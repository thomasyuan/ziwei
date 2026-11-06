/**
 * 主题/移动端可访问性检查（连本机 Chrome，用 puppeteer-core）
 * 用法：node scripts/tools/checktheme.mjs [baseURL]
 * 默认 http://127.0.0.1:9999
 */
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:9999';
const BP = process.argv[3] ?? '';   // 子路径前缀（静态导出时如 /ziwei）
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  userDataDir: './.pptr-profile',
});

const results = [];
const push = (name, val) => results.push(`${name}: ${val}`);

// ── 1. 首页：iPhone 视口（390×844），检查导航与主题切换 ──
const iPhone = await browser.newPage();
await iPhone.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await iPhone.goto(`${BASE}${BP}/`, { waitUntil: 'networkidle2' });
const nav = await iPhone.evaluate(() => {
  const header = document.querySelector('header');
  const links = header ? [...header.querySelectorAll('a')].map(a => a.textContent.trim()) : [];
  const toggle = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '').includes('主题'));
  const theme = document.documentElement.getAttribute('data-theme');
  return {
    hasHeader: !!header,
    links: links.slice(0, 12).join(','),
    toggleVisible: !!toggle && toggle.offsetParent !== null,
    theme,
  };
});
push('首页 header', nav.hasHeader);
push('首页 导航项', nav.links);
push('首页 主题按钮可见', nav.toggleVisible);
push('首页 当前主题', nav.theme);

// 点一下主题按钮，看 data-theme 是否翻转
await iPhone.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '').includes('主题'));
  t?.click();
});
await new Promise(r => setTimeout(r, 400));
push('切换后主题', await iPhone.evaluate(() => document.documentElement.getAttribute('data-theme')));

// ── 2. 知识库页（暗色）：检查正文盒子背景与文字色 ──
const kb = await browser.newPage();
await kb.goto(`${BASE}${BP}/knowledge/ziwei/love`, { waitUntil: 'networkidle2' });
const styles = await kb.evaluate(() => {
  const theme = document.documentElement.getAttribute('data-theme');
  const paras = [...document.querySelectorAll('p, div')].filter(d => d.textContent.length > 60 && d.children.length === 0);
  const boxes = [...document.querySelectorAll('section > div')];
  const box = boxes.find(d => d.textContent.includes('帝星入夫妻')) ?? boxes[0];
  const cs = box ? getComputedStyle(box) : null;
  const text = paras[0] ? getComputedStyle(paras[0]).color : null;
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  return { theme, boxBg: cs?.backgroundColor, text, bodyBg };
});
push('知识库 data-theme', styles.theme);
push('知识库 正文盒背景', styles.boxBg);
push('知识库 正文色', styles.text);
push('页面底色', styles.bodyBg);

// 对比度粗算
const lum = (c) => {
  const m = c.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
  const [r, g, b] = m.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const L1 = Math.max(lum(a), lum(b)), L2 = Math.min(lum(a), lum(b)); return ((L1 + 0.05) / (L2 + 0.05)).toFixed(2); };
push('正文对比度(盒底vs文字)', ratio(styles.boxBg, styles.text));

// ── 3. 排盘页暗色：宫格底色与文字 ──
const chart = await browser.newPage();
await chart.goto(`${BASE}${BP}/chart?y=1986&m=8&d=20&sh=3&g=f`, { waitUntil: 'networkidle2', defaultTimeout: 20000 });
await new Promise(r => setTimeout(r, 1500));
const chartStyles = await chart.evaluate(() => {
  const cell = [...document.querySelectorAll('div')].find(d => /命宫|迁移|夫妻/.test(d.textContent) && d.className.includes('palace'));
  const cs = cell ? getComputedStyle(cell) : null;
  const readPanel = [...document.querySelectorAll('div')].find(d => d.textContent.includes('命格总览') && getComputedStyle(d).borderRadius === '16px');
  const rp = readPanel ? getComputedStyle(readPanel) : null;
  return {
    theme: document.documentElement.getAttribute('data-theme'),
    cellBg: cs?.backgroundColor, cellColor: cs?.color,
    panelBg: rp?.backgroundColor,
    readings: document.body.textContent.includes('太阳入命，光明磊落'),
  };
});
push('排盘 data-theme', chartStyles.theme);
push('排盘 宫格底色', chartStyles.cellBg);
push('排盘 宫格文字', chartStyles.cellColor);
push('排盘 解读面板底色', chartStyles.panelBg);
push('排盘 13维解读已生成', chartStyles.readings);

// ── 4. 合盘页 & 格局页在暗色下的底色 ──
for (const p of ['/heming', '/patterns', '/library', '/guides']) {
  const pg = await browser.newPage();
  await pg.goto(`${BASE}${BP}${p}`, { waitUntil: 'networkidle2' });
  const v = await pg.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    card: (() => { const c = document.querySelector('.card, .card-flat, .card-tinted'); return c ? getComputedStyle(c).backgroundColor : null; })(),
  }));
  push(`${p} 主题/底色/卡片`, `${v.theme} ${v.bodyBg} ${v.card}`);
  await pg.close();
}

console.log('\n' + results.join('\n'));
await browser.close();
