/**
 * 浏览器直连 AI 的流式解析回归
 *
 * 断言：
 *  1. 任意字节切分（逐字节、\n 与 \r\n 两种换行）下，SSE delta 都拼回同一串全文
 *  2. 合盘页的呈现口径：规则结论 head + **【AI 深挖】** 标记 + AI 增量，顺序不断
 *  3. 请求只发往厂商接口（api.deepseek.com），Authorization 带 Key，且本站不出网
 *  4. 401 的提示里不出现 Key（含厂商回显的 Key 尾号，也要打码）
 *  5. 只出思考（reasoning_content）不出正文时，气泡不留白
 *  6. 200 但流里没有可识别 delta 时，给出可诊断的说明，而不是空白
 *  7. 网关忽略 stream、直接回 JSON 时也能出正文
 */

import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { hemingHead, buildHemingMessages, HEMING_TAIL_MARK } from '../../lib/ai/requests';
import { parseSseBuffer, extractDelta, extractDeltaText } from '../../lib/ai/sse';
import { streamChatDirect, directConfig, fetchModels } from '../../lib/ai/browser';
import type { ZiweiChart, BirthInfo } from '../../lib/ziwei/types';
import type { AiSettings } from '../../lib/ai/settings';

const KEY = 'sk-demo-1234567890abcd';
const SETTINGS: AiSettings = { provider: 'deepseek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash', apiKey: KEY, remember: true };

const A: BirthInfo = { year: 1986, month: 8, day: 20, hour: 3, gender: 'female', name: '甲', province: '江苏', city: '南京' };
const B: BirthInfo = { year: 1990, month: 1, day: 9, hour: 6, gender: 'male', name: '乙', province: '江苏', city: '苏州' };
const chartA = generateChart(A) as ZiweiChart;
const chartB = generateChart(B) as ZiweiChart;
const HEAD = hemingHead(chartA, chartB);

interface StubOptions {
  chunks?: Uint8Array[];
  status?: number;
  body?: string | null;
  contentType?: string;
  errorBody?: string;
}

/** 用桩 fetch 跑一次直连，记录请求，并把响应流喂给解析器 */
async function runWithStub(opts: StubOptions = {}) {
  const { chunks = [], status = 200, body, contentType = 'text/event-stream', errorBody } = opts;
  const seen: { url: string; init: RequestInit }[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: any, init: any) => {
    seen.push({ url: String(url), init });
    return {
      ok: status === 200,
      status,
      headers: { get: () => contentType },
      body: typeof status === 'number' && status === 200 && body === undefined ? new ReadableStream({
        start(c) { for (const ch of chunks) c.enqueue(ch); c.close(); },
      }) : null,
      text: async () => (body !== undefined && body !== null ? body : (errorBody ?? '')),
      json: async () => JSON.parse(body ?? '{}'),
    } as unknown as Response;
  }) as typeof fetch;
  let acc = '';
  let aiAcc = '';
  try {
    // 与页面同一条口径：AI 增量单独累计，规则结论 head 始终挂在前面
    const outcome = await streamChatDirect(SETTINGS, buildHemingMessages(chartA, chartB, '今年适合结婚吗？'), {
      onDelta: chunk => { aiAcc += chunk; acc = HEAD + HEMING_TAIL_MARK + aiAcc; },
    });
    return { acc, seen, outcome };
  } finally {
    globalThis.fetch = real;
  }
}

async function main() {
  for (const ending of ['\n', '\r\n']) {
    const bytes = new TextEncoder().encode(
      `data: {"delta":{"text":"你好"}}${ending}${ending}` +
      `data: {"choices":[{"delta":{"content":"世界"}}]}${ending}${ending}data: [DONE]${ending}${ending}`,
    );

    // 1. 整块
    const whole = await runWithStub({ chunks: [bytes] });
    assert.equal(whole.acc, HEAD + HEMING_TAIL_MARK + '你好世界', '整块拼接');
    assert.equal(whole.outcome.text, '你好世界', '返回值是正文全文（气泡靠它）');

    // 2. 每一个切点都要拼回同一串（逐字节切片最狠的一条）
    for (let cut = 1; cut < bytes.length; cut++) {
      const r = await runWithStub({ chunks: [bytes.slice(0, cut), bytes.slice(cut)] });
      assert.equal(r.acc, HEAD + HEMING_TAIL_MARK + '你好世界', `byte split ${cut}`);
    }

    // 3. 逐字节入流
    const perByte = await runWithStub({ chunks: Array.from(bytes, b => Uint8Array.of(b)) });
    assert.equal(perByte.acc, HEAD + HEMING_TAIL_MARK + '你好世界', '逐字节入流');

    // 4. 请求只发往厂商接口（DeepSeek 官方 base URL 不带 /v1），Key 在 Authorization 头里
    assert.equal(whole.seen[0].url, 'https://api.deepseek.com/chat/completions', '只发厂商接口');
    assert.equal((whole.seen[0].init.headers as Record<string, string>).Authorization, `Bearer ${KEY}`);
    const sentBody = JSON.parse(String(whole.seen[0].init.body));
    assert.equal(sentBody.model, 'deepseek-flash', '请求体用选中的模型名');
    assert.deepEqual(sentBody.thinking, { type: 'disabled' }, '默认关掉 DeepSeek 思考模式（否则思考 token 吃满 max_tokens，正文为空）');
    assert.equal(sentBody.max_tokens, 4000, 'max_tokens 给够，别让思考/答案互相挤掉');
    assert.match(whole.acc, /【AI 深挖】/, '保留 AI 深挖标记');
    assert.ok(whole.acc.startsWith(HEAD), '规则结论在前，AI 在后');
  }

  // 5. 401：文案不回显 Key，连厂商回显的 Key 尾号也打码
  const bad = await runWithStub({
    status: 401,
    errorBody: '{"error":{"message":"Authentication Fails, Your api key: ****abcd is invalid"}}',
  });
  assert.ok(!bad.acc.includes(KEY), '401 提示不回显 Key');
  assert.ok(!bad.acc.includes('abcd'), '401 里厂商回显的尾号也要打码');
  assert.ok(bad.acc.includes('鉴权失败'), '401 给出鉴权说明');

  // 6. 解析器单独检查：OpenAI 官方格式 + 未闭合行留待下一块
  const { deltas, rest } = parseSseBuffer('data: {"choices":[{"delta":{"content":"a"}}]}\ndata: {"delta":{"text":"b"');
  assert.deepEqual(deltas, [{ content: 'a', reasoning: '', finishReason: null }], '未闭合的 data 行不能被吃掉');
  assert.equal(rest, 'data: {"delta":{"text":"b"', '残段交回下一块继续拼');
  assert.equal(extractDeltaText('[DONE]'), '');
  assert.deepEqual(extractDelta('{"choices":[{"delta":{"reasoning_content":"想"}}]}'), { content: '', reasoning: '想', finishReason: null }, '思考过程单独取');

  // 7. 只出思考不出正文 → 显示思考过程，不留白
  const reasoningOnly = new TextEncoder().encode(
    'data: {"choices":[{"delta":{"reasoning_content":"先看命宫…"}}]}\n\n'
    + 'data: {"choices":[{"delta":{"reasoning_content":"再看夫妻宫。"}}]}\n\n',
  );
  const rOnly = await runWithStub({ chunks: [reasoningOnly] });
  assert.ok(rOnly.outcome.text.startsWith('**【思考过程】**'), '只出思考时把思考显示出来');
  assert.ok(rOnly.outcome.text.includes('先看命宫…再看夫妻宫。'), '思考内容完整');

  // 7.5 思考吃满 max_tokens（finish_reason=length）→ 提示里点明原因
  const cut = new TextEncoder().encode(
    'data: {"choices":[{"delta":{"reasoning_content":"想了很久"}}]}\n\n'
    + 'data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n',
  );
  const truncated = await runWithStub({ chunks: [cut] });
  assert.match(truncated.outcome.text, /max_tokens/, '撞长度上限时说明是预算问题');
  assert.equal(truncated.outcome.finishReason, 'length', 'finish_reason 透传出来');

  // 8. 200 但流里没有可识别 delta → 可诊断说明
  const emptyStream = new TextEncoder().encode('data: {"choices":[{"delta":{}}]}\n\n');
  const empty = await runWithStub({ chunks: [emptyStream] });
  assert.match(empty.outcome.text, /正文是空的/, '空流要给出诊断，不是空白气泡');

  // 9. 网关忽略 stream、直接回 JSON
  const json = await runWithStub({
    contentType: 'application/json',
    body: '{"choices":[{"message":{"content":"整段答案"}}]}',
  });
  assert.equal(json.outcome.text, '整段答案', '非流式 JSON 也能取正文');

  // 10. 没 Key：直接给提示，不发任何厂商请求
  const real = globalThis.fetch;
  globalThis.fetch = (() => { throw new Error('不该发请求'); }) as typeof fetch;
  let shown = '';
  const noKey = await streamChatDirect(null, [], { onDelta: c => { shown += c; } });
  globalThis.fetch = real;
  assert.match(noKey.text, /API Key/);
  assert.equal(shown, noKey.text, '无 Key 时提示走 onDelta');
  assert.ok(directConfig(null) === null, '无 Key 时配置不可用');

  // 11. 拉模型列表：GET /models + Authorization，按返回的 id 出列表
  globalThis.fetch = (async () => ({
    ok: true, status: 200,
    json: async () => ({ object: 'list', data: [
      { id: 'deepseek-flash', name: 'DeepSeek-V4.1-Flash', context_window: 1048576 },
      { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro' },
    ] }),
    text: async () => '',
  }) as unknown as Response) as typeof fetch;
  const listed = await fetchModels({ baseUrl: 'https://api.deepseek.com', apiKey: KEY });
  globalThis.fetch = real;
  assert.equal(listed.ok, true);
  assert.deepEqual(listed.models.map(m => m.id), ['deepseek-flash', 'deepseek-v4-pro']);
  assert.equal(listed.models[0].name, 'DeepSeek-V4.1-Flash');
  assert.equal(listed.models[0].contextWindow, 1048576);

  console.log('浏览器直连 SSE 字节切分 + 思考/空流/JSON 兜底 + Key 落点回归通过');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
