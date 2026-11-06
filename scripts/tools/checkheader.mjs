/**
 * 导航条一致性检查：所有页面的 header 必须存在且样式一致
 * 用法：node scripts/tools/checkheader.mjs [baseURL] [basePath] [mobile|desktop]
 */
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3996';
const BP = process.argv[3] ?? '/ziwei';
const MOBILE = process.argv[4] === 'mobile';

const PAGES = [
  '/', '/chart?y=1986&m=8&d=20&sh=3&g=f', '/heming',
  '/knowledge', '/knowledge/ziwei/love',
  '/library', '/library/quanshu', '/library/quanshu/0', '/library/search?q=%E8%B4%AB',
  '/patterns', '/guides', '/famous', '/about', '/privacy', '/terms',
];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', userDataDir: './.pptr-header',
});
const page = await browser.newPage();
await page.setViewport(MOBILE ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
                          : { width: 1280, height: 900 });

const rows = [];
for (const p of PAGES) {
  await page.goto(`${BASE}${BP}${p}`, { waitUntil: 'networkidle2', defaultTimeout: 25000 });
  const h = await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return { none: true };
    const cs = getComputedStyle(header);
    const inner = header.firstElementChild;
    const links = [...header.querySelectorAll('a')].map(a => a.textContent.trim());
    const navRow = header.querySelectorAll('nav').length;
    const toggle = [...header.querySelectorAll('button')].some(b => (b.getAttribute('aria-label') || '').includes('主题'));
    return {
      height: cs.height, padding: cs.paddingLeft + '/' + cs.paddingRight,
      bg: cs.backgroundColor, pos: cs.position,
      innerMaxW: inner ? getComputedStyle(inner).maxWidth : null,
      links: links.join(','), navRows: navRow, toggle,
    };
  });
  rows.push([p, h.none ? 'NO HEADER' : `${h.height} pad=${h.padding} pos=${h.pos} maxW=${h.innerMaxW} nav=${h.navRows} toggle=${h.toggle}`]);
}
const uniq = new Set(rows.map(r => r[1].replace(/maxW=\d+px/, 'maxW=viewport')));
console.log(`视口: ${MOBILE ? 'iPhone 390×844' : 'desktop 1280×900'}   一致样式数: ${uniq.size}`);
for (const [p, s] of rows) console.log(`${p.padEnd(34)} ${s}`);
await browser.close();
