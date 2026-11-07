/**
 * 主题默认值与切换持久化检查（全新档案：首屏应为 light）
 * 用法：node scripts/tools/checktoggle.mjs [baseURL] [basePath]
 */
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:9999', BP = process.argv[3] ?? '';
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', userDataDir: './.pptr-toggle',
});
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto(`${BASE}${BP}/`, { waitUntil: 'networkidle2' });
const first = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
const clickToggle = () => p.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find(x => (x.getAttribute('aria-label') || '').includes('主题'));
  t?.click();
});
await clickToggle();
await new Promise(r => setTimeout(r, 500));
const afterClick = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
await p.goto(`${BASE}${BP}/patterns`, { waitUntil: 'networkidle2' });
const persist = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
await p.goto(`${BASE}${BP}/knowledge/ziwei/love`, { waitUntil: 'networkidle2' });
const persist2 = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
console.log(`首屏默认: ${first} | 点击后: ${afterClick} | 换页后沿用: ${persist} | 再换页: ${persist2}`);
const colors = await p.evaluate(() => ({
  body: getComputedStyle(document.body).backgroundColor,
  box: (() => { const d = [...document.querySelectorAll('section > div')].find(x => getComputedStyle(x).borderRadius === '10px'); return d ? getComputedStyle(d).backgroundColor : null; })(),
  text: (() => { const d = [...document.querySelectorAll('section > div p')].find(x => x.textContent.length > 40); return d ? getComputedStyle(d).color : null; })(),
}));
console.log('暗色下页面底:', colors.body, '| 正文盒底:', colors.box, '| 正文色:', colors.text);
await b.close();
