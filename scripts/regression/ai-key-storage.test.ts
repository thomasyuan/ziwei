/**
 * AI Key 存储与「Key 不进日志」回归
 *
 * 断言：
 *  1. maskKey 永远不返回完整 Key（页面上只可能出现打码串）
 *  2. 勾「记住」落 localStorage 并清掉 sessionStorage；不勾只落 sessionStorage；清除把两份都删
 *  3. 服务端渲染（无 window）读不到东西，也不炸
 *  4. iOS 隐私模式这类写入被拒的情况，writeAiSettings 返回 false（面板据此说明「只在内存里用」）
 *  5. resolveConfig 用 provider 预设补齐 base URL / model；zhipu 标记为不能浏览器直连
 *  6. 走一遍真实调用路径后，所有 console 输出里都不出现 Key（Key 不进日志）
 *  7. 接口地址拼接：DeepSeek 不带 /v1，OpenAI 系带 /v1；测试连接先打 /models
 */

import assert from 'node:assert/strict';
import { maskKey, writeAiSettings, readAiSettings, clearAiSettings, isUsable, type AiSettings } from '../../lib/ai/settings';
import { resolveConfig, PROVIDER_PRESETS, CUSTOM_PRESET, endpoint } from '../../lib/ai/providers';
import { streamChatDirect, pingAi } from '../../lib/ai/browser';

const KEY = 'sk-demo-1234567890abcd';
const SETTINGS: AiSettings = { provider: 'deepseek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash', apiKey: KEY, remember: true };

function makeStorage(throwOnWrite = false) {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { if (throwOnWrite) throw new Error('QuotaExceededError'); map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    get size() { return map.size; },
  };
}
type FakeWindow = { localStorage: ReturnType<typeof makeStorage>; sessionStorage: ReturnType<typeof makeStorage> };
function install(w: FakeWindow | undefined) {
  if (w) (globalThis as any).window = w; else delete (globalThis as any).window;
}

async function main() {
  // 1. 打码
  const m = maskKey(KEY);
  assert.ok(!m.includes(KEY), '打码串不能含完整 Key');
  assert.ok(m.startsWith('sk-') && m.includes('abcd'), '只留头 3 位与尾 4 位');
  assert.equal(maskKey('abc12345'), '••••', '≤8 位的短串全打点，不留任何头尾');
  assert.equal(maskKey(''), '');

  // 2. 记住 / 不记住 / 清除
  install({ localStorage: makeStorage(), sessionStorage: makeStorage() });
  assert.equal(readAiSettings(), null, '初始没有配置');
  assert.equal(writeAiSettings({ ...SETTINGS, remember: false }), true);
  const win = (globalThis as any).window as FakeWindow;
  assert.ok(win.sessionStorage.getItem('ziwei-ai-settings'), '不勾记住 → sessionStorage');
  assert.equal(win.localStorage.getItem('ziwei-ai-settings'), null, '不勾记住不能同时留在 localStorage');
  assert.equal(readAiSettings()!.remember, false, '读出来的 remember 跟写入一致');

  assert.equal(writeAiSettings(SETTINGS), true);
  assert.ok(win.localStorage.getItem('ziwei-ai-settings'), '勾记住 → localStorage');
  assert.equal(win.sessionStorage.getItem('ziwei-ai-settings'), null, '切到记住时清掉 sessionStorage，避免两份并存');

  clearAiSettings();
  assert.equal(win.localStorage.getItem('ziwei-ai-settings'), null, '清除后 localStorage 没有 Key');
  assert.equal(win.sessionStorage.getItem('ziwei-ai-settings'), null, '清除后 sessionStorage 也没有 Key');

  // 2.5 旧默认值一次性升级：上一版存的是 /v1 + deepseek-chat，读到要自动换成官方新口径
  const win2 = (globalThis as any).window as FakeWindow;
  win2.localStorage.setItem('ziwei-ai-settings', JSON.stringify({
    provider: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', apiKey: KEY, remember: true,
  }));
  const migrated = readAiSettings()!;
  assert.equal(migrated.baseUrl, 'https://api.deepseek.com', '旧 base URL 升级为新口径');
  assert.equal(migrated.model, 'deepseek-flash', '旧模型名升级为 deepseek-flash');
  assert.equal(migrated.thinking, false, '深度思考默认关');
  // 用户自己写死的非默认组合不能动
  win2.localStorage.setItem('ziwei-ai-settings', JSON.stringify({
    provider: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', model: 'my-proxy-model', apiKey: KEY, remember: true,
  }));
  assert.equal(readAiSettings()!.model, 'my-proxy-model', '只升级「两个旧默认值同时命中」的情况，别动自定义配置');
  assert.equal(writeAiSettings({ ...SETTINGS, thinking: true }), true);
  assert.equal(readAiSettings()!.thinking, true, '深度思考开关能持久化');

  // 3. SSR（没有 window）
  install(undefined);
  assert.equal(readAiSettings(), null, '服务端渲染读不到 Key');
  assert.equal(writeAiSettings(SETTINGS), false, '服务端写入不算成功');

  // 4. 写入被拒（iOS 隐私模式 / 禁用站点存储）
  install({ localStorage: makeStorage(true), sessionStorage: makeStorage(true) });
  assert.equal(writeAiSettings(SETTINGS), false, '写入被拒要返回 false，面板据此说明「只在内存里用」');

  // 5. provider 预设与浏览器直连标记（DeepSeek 口径以官方文档为准：base URL 不带 /v1，模型 deepseek-flash）
  const r = resolveConfig({ provider: 'deepseek', apiKey: 'sk-123' });
  assert.equal(r!.baseUrl, 'https://api.deepseek.com');
  assert.equal(r!.model, 'deepseek-flash');
  assert.deepEqual(PROVIDER_PRESETS.deepseek.fallbackModels, ['deepseek-flash', 'deepseek-v4-pro']);
  assert.equal(endpoint('https://api.deepseek.com', 'models'), 'https://api.deepseek.com/models');
  assert.equal(endpoint('https://api.deepseek.com/', 'chat/completions'), 'https://api.deepseek.com/chat/completions');
  assert.equal(endpoint('https://api.openai.com/v1', 'models'), 'https://api.openai.com/v1/models', '带 /v1 的厂子原样拼');
  assert.equal(r!.browserDirect, true, 'DeepSeek 实测允许浏览器直连（CORS 预检带 authorization）');
  assert.equal(PROVIDER_PRESETS.openai.browserDirect, true);
  assert.equal(PROVIDER_PRESETS.moonshot.browserDirect, true);
  assert.equal(PROVIDER_PRESETS.dashscope.browserDirect, true);
  assert.equal(PROVIDER_PRESETS.zhipu.browserDirect, false, '智谱预检不回 allow-origin，浏览器直连必被拦');
  assert.equal(resolveConfig({ provider: 'custom', apiKey: 'sk-1' }), null, '自定义厂子必须自己填 base URL');
  assert.equal(CUSTOM_PRESET.id, 'custom');
  assert.ok(isUsable(SETTINGS) && !isUsable(null) && !isUsable({ ...SETTINGS, model: '' }));

  // 6. Key 不进日志：把整条调用链跑一遍，console 里不能有 Key
  const logs: string[] = [];
  const FNS = ['log', 'info', 'warn', 'error', 'debug'] as const;
  const original: Record<(typeof FNS)[number], Console['log']> =
    { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };
  for (const fn of FNS) {
    console[fn] = ((...args: unknown[]) => { logs.push(args.map(a => String(a)).join(' ')); }) as Console['log'];
  }
  install({ localStorage: makeStorage(), sessionStorage: makeStorage() });
  writeAiSettings(SETTINGS);
  readAiSettings();
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    if (String(url).endsWith('/models')) {
      return {
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ object: 'list', data: [{ id: 'deepseek-flash', name: 'DeepSeek-V4.1-Flash', context_window: 1048576 }] }),
        text: async () => '',
      } as unknown as Response;
    }
    return {
      ok: true, status: 200,
      headers: { get: () => 'text/event-stream' },
      body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"delta":{"text":"答"}}\n\n')); c.close(); } }),
      text: async () => '{"ok":true}',
    } as unknown as Response;
  }) as typeof fetch;
  let lastBody = '';
  const realInner = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    if (String(url).endsWith('/chat/completions')) lastBody = String(init.body);
    return realInner(url as never, init as never);
  }) as typeof fetch;
  const chatOutcome = await streamChatDirect(readAiSettings(), [{ role: 'user', content: '问题' }], { onDelta: () => {} });
  globalThis.fetch = realInner;
  assert.deepEqual(JSON.parse(lastBody).thinking, { type: 'disabled' }, '深度思考关时显式发 thinking.disabled');
  assert.equal(JSON.parse(lastBody).max_tokens, 4000, 'max_tokens 默认给足');
  const pingMsg = await pingAi(readAiSettings());
  globalThis.fetch = realFetch;
  for (const fn of FNS) console[fn] = original[fn];
  assert.ok(!logs.some(l => l.includes(KEY)), `Key 出现在 console 输出里：${JSON.stringify(logs)}`);
  assert.equal(chatOutcome.text, '答', '正文照常取到');
  assert.match(pingMsg, /已连通/, '测试连接成功');
  assert.match(pingMsg, /\/models 返回 1 个模型/, '测试连接先走 /models（不花 token）');

  console.log('AI Key 存储 + 打码 + provider 直连标记 + Key 不进日志 回归通过');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
