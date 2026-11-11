/**
 * 浏览器直连 AI 的流式解析回归（原 heming-stream 的等价检查，改测共用解析器）
 *
 * 断言：
 *  1. 任意字节切分（逐字节、\n 与 \r\n 两种换行）下，SSE delta 都拼回同一串全文
 *  2. 合盘页的呈现口径：规则结论 head + **【AI 深挖】** 标记 + AI 增量，顺序不断
 *  3. 请求只发往厂商接口（api.deepseek.com），Authorization 带 Key，且本站不出网
 *  4. 401 的提示里不出现 Key 本身（Key 不进日志、不进页面文案）
 */

import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { hemingHead, buildHemingMessages, HEMING_TAIL_MARK } from '../../lib/ai/requests';
import { readSseStream, parseSseBuffer, extractDeltaText } from '../../lib/ai/sse';
import { streamChatDirect, directConfig } from '../../lib/ai/browser';
import type { ZiweiChart, BirthInfo } from '../../lib/ziwei/types';
import type { AiSettings } from '../../lib/ai/settings';

const KEY = 'sk-demo-1234567890abcd';
const SETTINGS: AiSettings = { provider: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', apiKey: KEY, remember: true };

const A: BirthInfo = { year: 1986, month: 8, day: 20, hour: 3, gender: 'female', name: '甲', province: '江苏', city: '南京' };
const B: BirthInfo = { year: 1990, month: 1, day: 9, hour: 6, gender: 'male', name: '乙', province: '江苏', city: '苏州' };
const chartA = generateChart(A) as ZiweiChart;
const chartB = generateChart(B) as ZiweiChart;
const HEAD = hemingHead(chartA, chartB);

/** 用桩 fetch 跑一次直连，记录请求，并把响应流喂给解析器 */
async function runWithStub(chunks: Uint8Array[], status = 200) {
  const seen: { url: string; init: RequestInit }[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: any, init: any) => {
    seen.push({ url: String(url), init });
    return {
      ok: status === 200,
      status,
      body: status === 200 ? new ReadableStream({
        start(c) { for (const ch of chunks) c.enqueue(ch); c.close(); },
      }) : null,
      text: async () => '{"error":{"message":"Authentication Fails (governor)","code":"invalid_api_key"}}',
    } as unknown as Response;
  }) as typeof fetch;
  let acc = '';
  let aiAcc = '';
  try {
    // 与页面同一条口径：AI 增量单独累计，规则结论 head 始终挂在前面
    const full = await streamChatDirect(SETTINGS, buildHemingMessages(chartA, chartB, '今年适合结婚吗？'), {
      onDelta: chunk => { aiAcc += chunk; acc = HEAD + HEMING_TAIL_MARK + aiAcc; },
    });
    return { acc, seen, full };
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
    const whole = await runWithStub([bytes]);
    assert.equal(whole.acc, HEAD + HEMING_TAIL_MARK + '你好世界', '整块拼接');
    assert.equal(whole.full, '你好世界', '返回值是 AI 全文（排盘页的气泡靠它）');

    // 2. 每一个切点都要拼回同一串（逐字节切片最狠的一条）
    for (let cut = 1; cut < bytes.length; cut++) {
      const r = await runWithStub([bytes.slice(0, cut), bytes.slice(cut)]);
      assert.equal(r.acc, HEAD + HEMING_TAIL_MARK + '你好世界', `byte split ${cut}`);
    }

    // 3. 逐字节入流
    const perByte = await runWithStub(Array.from(bytes, b => Uint8Array.of(b)));
    assert.equal(perByte.acc, HEAD + HEMING_TAIL_MARK + '你好世界', '逐字节入流');

    // 4. 请求只发往厂商接口，Key 在 Authorization 头里
    assert.match(whole.seen[0].url, /^https:\/\/api\.deepseek\.com\/v1\/chat\/completions$/, '只发厂商接口');
    assert.equal((whole.seen[0].init.headers as Record<string, string>).Authorization, `Bearer ${KEY}`);
    assert.match(whole.acc, /【AI 深挖】/, '保留 AI 深挖标记');
    assert.ok(whole.acc.startsWith(HEAD), '规则结论在前，AI 在后');
  }

  // 5. 401 的文案里不能出现 Key
  const bad = await runWithStub([new TextEncoder().encode('data: x\n\n')], 401);
  assert.ok(!bad.acc.includes(KEY), '401 提示不回显 Key');
  assert.ok(bad.acc.includes('鉴权失败'), '401 给出鉴权说明');

  // 6. 解析器单独检查：OpenAI 官方格式 + 未闭合行留待下一块
  const { deltas, rest } = parseSseBuffer('data: {"choices":[{"delta":{"content":"a"}}]}\ndata: {"delta":{"text":"b"');
  assert.deepEqual(deltas, ['a'], '未闭合的 data 行不能被吃掉');
  assert.equal(rest, 'data: {"delta":{"text":"b"', '残段交回下一块继续拼');
  assert.equal(extractDeltaText('[DONE]'), '');

  // 7. 没 Key：直接给提示，不发任何厂商请求
  const real = globalThis.fetch;
  globalThis.fetch = (() => { throw new Error('不该发请求'); }) as typeof fetch;
  let shown = '';
  const msg = await streamChatDirect(null, [], { onDelta: c => { shown += c; } });
  globalThis.fetch = real;
  assert.match(msg, /API Key/);
  assert.equal(shown, msg, '无 Key 时提示走 onDelta');
  assert.ok(directConfig(null) === null, '无 Key 时配置不可用');
  console.log('浏览器直连 SSE 字节切分 + Key 落点回归通过');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
