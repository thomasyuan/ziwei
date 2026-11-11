/**
 * 浏览器直连 AI 的端到端检查（手机版 iPhone 视口 + Key 落点 + 请求落点）
 *
 * 用法：node scripts/tools/checkai.mjs            # 用 out/（先 npm run build:pages）
 *       node scripts/tools/checkai.mjs <baseURL>   # 指已部署的站（如 https://www.cppcoder.net/ziwei）
 *
 * 抓的三件事：
 *  1. Key 只落在浏览器存储里（localStorage），保存后读回来；页面与 console 里都不出现完整 Key
 *  2. AI 请求只发往厂商接口（api.deepseek.com），本站（127.0.0.1 / Pages 域）不再被调用
 *     ——静态站没有 /api/interpret、/api/heming，浏览器直连是这条功能唯一的通路
 *  3. iPhone Safari 视口：viewport meta 生效、390px 宽不出现横向溢出、Key 输入框 ≥16px（聚焦不放大）
 *
 * Chrome 路径可用 CHROME=… 覆盖（默认 macOS；Windows 传 'C:/Program Files/Google Chrome/Application/chrome.exe'）。
 */
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'out', PORT = 3997, BP = '/ziwei';
const KEY = 'sk-demo-1234567890abcd';
const BASE = process.argv[2] ?? `http://127.0.0.1:${PORT}`;
const EXTERNAL = !BASE.includes('127.0.0.1');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ANSWER = '【测试答复】浏览器直连成功';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json' };

let server = null;
if (!EXTERNAL) {
  server = createServer((req, res) => {
    const raw = decodeURIComponent(req.url.split('?')[0]);
    const path = raw.startsWith('/ziwei') ? raw.slice(6) || '/' : raw;
    const cands = [join(ROOT, path), join(ROOT, path + '.html'), join(ROOT, path, 'index.html')];
    const file = cands.find(f => existsSync(f) && f.endsWith('.html')) ?? cands.find(f => existsSync(f));
    if (!file) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  }).listen(PORT);
}

const fails = [];
const ok = (cond, msg) => { if (cond) console.log('✓ ' + msg); else { fails.push(msg); console.log('✗ ' + msg); } };

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', userDataDir: './.pptr-ai',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=390,844'],
});
const page = (await browser.pages())[0] ?? await browser.newPage();
// iPhone Safari 视口 + UA（headless Chrome 的 hasTouch 模拟会关掉 session，用 isMobile=false + iPhone UA 就够）
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

// 厂商侧的两个接口都拦下来：POST /chat/completions（流式）+ GET /models（模型列表）
const MODELS = {
  object: 'list',
  data: [
    { id: 'deepseek-flash', object: 'model', owned_by: 'deepseek', name: 'DeepSeek-V4.1-Flash', context_window: 1048576 },
    { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek', name: 'DeepSeek-V4-Pro', context_window: 1048576 },
  ],
};
const outgoing = [];
await page.setRequestInterception(true);
page.on('request', req => {
  const url = req.url();
  const isChat = url.includes('/chat/completions');
  const isModels = url.endsWith('/models');
  if (!isChat && !isModels) { req.continue(); return; }
  outgoing.push({ url, method: req.method(), headers: req.headers(), body: req.postData?.() });
  const allow = BASE.replace(/(https?:\/\/[^/]+).*/, '$1');
  if (req.method() === 'OPTIONS') {
    req.respond({ status: 204, headers: {
      'access-control-allow-origin': allow, 'access-control-allow-methods': 'POST,GET',
      'access-control-allow-headers': 'authorization,content-type',
    } });
    return;
  }
  if (isModels) {
    req.respond({ status: 200, headers: {
      'content-type': 'application/json', 'access-control-allow-origin': allow,
    }, body: JSON.stringify(MODELS) });
    return;
  }
  req.respond({ status: 200, headers: {
    'content-type': 'text/event-stream', 'access-control-allow-origin': allow,
  }, body: `data: ${JSON.stringify({ choices: [{ delta: { content: ANSWER } }] })}\n\ndata: [DONE]\n\n` });
});
const logs = [];
page.on('console', m => logs.push(m.text()));

/** 在页面里按「选项文案」找 select 并改值（React 监听 change 事件，这样状态才跟着走） */
async function pickSelect(rootSel, wantOption, value) {
  const done = await page.evaluate((rootSel, wantOption, value) => {
    const root = document.querySelector(rootSel);
    if (!root) return 'no-root';
    const sels = [...root.querySelectorAll('select')];
    const hit = sels.find(s => [...s.options].some(o => o.textContent.includes(wantOption)));
    if (!hit) return 'no-select';
    const opt = [...hit.options].find(o => o.textContent.includes(value));
    if (!opt) return 'no-option';
    hit.value = opt.value;
    hit.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  }, rootSel, wantOption, value);
  if (done !== 'ok') throw new Error(`select 定位失败（${wantOption} / ${value}）：${done}`);
}

function clickByText(text) {
  return page.evaluate((text) => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === text);
    if (!b) return false; b.click(); return true;
  }, text);
}

const KEY_FIELD = 'input[type="password"]';

async function fillKey({ captureDefaults = false } = {}) {
  await page.evaluate(() => localStorage.removeItem('ziwei-ai-settings'));
  const opened = await clickByText('设置 Key');
  if (!opened) throw new Error('没找到「设置 Key」按钮');
  await page.waitForSelector(KEY_FIELD);
  // 先记下默认的 Base URL / 模型名（口径：DeepSeek 官方文档 = api.deepseek.com + deepseek-flash）
  const defaults = captureDefaults ? await page.evaluate(() => {
    const panel = document.querySelector('input[type="password"]').closest('div.rounded-2xl');
    // 注意：没写 type 的 input 属性不存在，但 DOM 属性 .type 是 'text'，所以用属性过滤
    const texts = [...panel.querySelectorAll('input')].filter(i => i.type === 'text').map(i => i.value);
    // DOM 顺序：Model 输入框在前，Base URL 在后
    return { provider: panel.querySelector('select')?.value, model: texts[0], baseUrl: texts[1] };
  }) : null;
  await page.type(KEY_FIELD, KEY);
  // 点「拉取模型列表」：Key + Base URL 就够，不必先保存
  const pulled = await clickByText('拉取模型列表');
  if (!pulled) throw new Error('没有「拉取模型列表」按钮');
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '保存');
    return !!b;
  }, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));
  const vars = await page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'deepseek-v4-pro'));
    return sel ? [...sel.options].map(o => o.value) : null;
  });
  // 切成第二个模型，验证选的模型真的进了请求体
  if (vars) {
    await page.evaluate(() => {
      const sel = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'deepseek-v4-pro'));
      sel.value = 'deepseek-v4-pro';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  const saved = await clickByText('保存');
  if (!saved) throw new Error('没有「保存」按钮');
  await new Promise(r => setTimeout(r, 300));
  return { defaults, modelOptions: vars };
}

async function readStoredKey() {
  return page.evaluate(() => {
    const raw = localStorage.getItem('ziwei-ai-settings');
    return raw ? JSON.parse(raw).apiKey : null;
  });
}

// ─── /chart：AI 追问 ─────────────────────────────────────────
// 先前那个 profile 可能留着旧一版的设置：先清站点存储再重载，保证看的是默认值
await page.goto(`${BASE}${BP}/chart?y=1986&m=8&d=20&sh=3&g=f`, { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
const meta = await page.evaluate(() => document.querySelector('meta[name="viewport"]')?.content ?? '');
ok(/width=device-width/.test(meta), `viewport meta：${meta || '（缺失）'}`);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(overflow <= 1, `390px 宽无横向溢出（overflow=${overflow}）`);

outgoing.length = 0;
const picked = await fillKey({ captureDefaults: true });
const modelReqs = outgoing.filter(r => r.url.endsWith('/models') && r.method === 'GET');
ok(picked.defaults?.baseUrl === 'https://api.deepseek.com', `默认 Base URL = ${picked.defaults?.baseUrl}（DeepSeek 官方不带 /v1）`);
ok(picked.defaults?.model === 'deepseek-flash', `默认模型 = ${picked.defaults?.model}（deepseek-chat 是历史名）`);
ok((picked.modelOptions ?? []).includes('deepseek-v4-pro'), `拉到的模型列表：${(picked.modelOptions ?? []).join('、')}`);
const stored = await readStoredKey();
ok(stored === KEY, 'Key 存进浏览器 localStorage（本站是静态站，没有服务器可收）');
const storedModel = await page.evaluate(() => JSON.parse(localStorage.getItem('ziwei-ai-settings')).model);
ok(storedModel === 'deepseek-v4-pro', `下拉里选的模型被保存：${storedModel}`);
const keyFont = await page.evaluate(() => {
  const el = document.querySelector('input[type="password"]');
  el.focus();
  return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
});
ok(keyFont >= 16, `Key 输入框字号 ${keyFont}px（iOS Safari 聚焦不会自动放大整页）`);
// 触控目标：手机版按钮 min-height 44px（globals.css 的 767 断点）。面板已展开，所以切换按钮显示「收起设置」
const touch = await page.evaluate(() => {
  const find = (t) => [...document.querySelectorAll('button')].find(x => x.textContent.trim() === t);
  const h = (b) => b ? Math.round(b.getBoundingClientRect().height) : 0;
  return { toggle: h(find('收起设置')), save: h(find('保存')), send: h(find('发送')) };
});
ok(touch.toggle >= 44 && touch.save >= 44 && touch.send >= 44,
  `触控目标：设置切换 ${touch.toggle}px / 保存 ${touch.save}px / 发送 ${touch.send}px（≥44）`);
await page.screenshot({ path: 'out/_ai-mobile-chart.png' });

outgoing.length = 0;
const asked = await page.evaluate(() => {
  const chip = [...document.querySelectorAll('button')].find(b => b.textContent.startsWith('我的整体命格'));
  if (!chip) return false; chip.click(); return true;
});
if (!asked) throw new Error('没有常见问题按钮');
await page.waitForFunction(
  (t) => [...document.querySelectorAll('div')].some(d => d.textContent.includes(t)),
  { timeout: 20000 }, ANSWER,
);
const aiReq = outgoing.filter(r => r.method === 'POST' && r.url.includes('/chat/completions'));
ok(aiReq.length === 1, `AI 只发一条请求到厂商接口（${aiReq[0]?.url}）`);
ok(/api\.deepseek\.com/.test(aiReq[0]?.url ?? ''), '目标域是 api.deepseek.com（不是本站）');
ok(aiReq[0]?.headers.authorization === `Bearer ${KEY}`, 'Authorization 头带 Key（Key 只在浏览器→厂商这条链路上）');
const sentBody = JSON.parse(aiReq[0]?.body ?? '{}');
ok(sentBody.model === 'deepseek-v4-pro', '请求体用的是下拉里选中的模型');
ok(sentBody.thinking?.type === 'disabled', '默认关掉思考模式（否则正文可能为空）');
ok(sentBody.max_tokens >= 4000, `max_tokens=${sentBody.max_tokens}`);
ok(modelReqs.length >= 1, `模型列表走 GET /models（${modelReqs.length} 次，不花 token）`);
ok(modelReqs.every(r => r.headers.authorization === `Bearer ${KEY}`), '/models 也只用这套 Key 鉴权');
ok(!outgoing.some(r => new URL(r.url).origin !== new URL(BASE).origin && !r.url.includes('deepseek')), '没有多余的跨域请求');

// ─── /heming：规则结论 + AI 深挖 ─────────────────────────────
await page.goto(`${BASE}${BP}/heming`, { waitUntil: 'networkidle2' });
await fillKey();
const hemingStored = await readStoredKey();
ok(hemingStored === KEY, '合盘页共用同一份浏览器里的 Key');
const A = '.heming-grid > div:nth-child(1)';
const B = '.heming-grid > div:nth-child(2)';
for (const side of [A, B]) {
  await pickSelect(side, '年份', '1990');
  await pickSelect(side, '月份', '1');
  await pickSelect(side, '日期', '1');
}
outgoing.length = 0;
const started = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始合盘分析'));
  if (!b) return false; b.click(); return true;
});
if (!started) throw new Error('没有「开始合盘分析」按钮');
await page.waitForFunction(
  (t) => [...document.querySelectorAll('div')].some(d => d.textContent.includes(t) && d.textContent.includes('规则引擎结论')),
  { timeout: 25000 }, ANSWER,
);
const hemingReq = outgoing.filter(r => r.method === 'POST' && r.url.includes('/chat/completions'));
ok(hemingReq.length === 1 && hemingReq[0].headers.authorization === `Bearer ${KEY}`, '合盘 AI 深挖同样直连厂商接口');
ok(!outgoing.some(r => new URL(r.url).origin !== new URL(BASE).origin && !r.url.includes('deepseek')), '合盘页没有别的跨域调用');

// ─── 桌面字号：桌面上不该用手机的 16px（视觉上会偏大） ──────────
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(`${BASE}${BP}/chart?y=1986&m=8&d=20&sh=3&g=f`, { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '设置 Key');
  b && b.click();
});
await page.waitForSelector(KEY_FIELD);
const deskFonts = await page.evaluate(() => {
  const panel = document.querySelector('input[type="password"]').closest('div.rounded-2xl');
  return [...panel.querySelectorAll('input, select')].map(el => ({ tag: el.tagName, size: parseFloat(getComputedStyle(el).fontSize) }));
});
ok(deskFonts.every(f => f.size <= 14), `桌面字号 ≤14px：${[...new Set(deskFonts.map(f => f.size))].join('/')}px`);

// ─── Key 不进日志 ───────────────────────────────────────────
ok(!logs.some(l => l.includes(KEY)), `console 输出里没有完整 Key（共 ${logs.length} 条）`);

await browser.close();
if (server) server.close();

if (fails.length) { console.log(`\n✗ ${fails.length} 项失败：\n` + fails.map(f => '  - ' + f).join('\n')); process.exit(1); }
console.log('\n全部通过：Key 只在浏览器、请求只到厂商、iPhone 视口可用、Key 不进日志');
