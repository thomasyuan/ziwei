/**
 * 首屏内容到导航条的距离（gap）一致性检查
 * 用法：node scripts/tools/checkmargin.mjs [baseURL] [basePath]
 */
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] ?? 'http://127.0.0.1:3996';
const BP = process.argv[3] ?? '/ziwei';
const PAGES = ['/', '/chart', '/chart?y=1986&m=8&d=20&sh=3&g=f', '/heming', '/knowledge',
  '/knowledge/ziwei/love', '/library', '/library/quanshu', '/library/quanshu/0',
  '/patterns', '/guides', '/famous', '/about', '/privacy', '/terms'];

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: './.pptr-margin' });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
const out = [];
for (const pg of PAGES) {
  await p.goto(`${BASE}${BP}${pg}`, { waitUntil: 'networkidle2', defaultTimeout: 25000 });
  const m = await p.evaluate(() => {
    const header = document.querySelector('header');
    const hb = header.getBoundingClientRect().bottom;
    // 导航条下方第一个有内容的块（跳过 sticky header 自身）
    const nodes = [...document.body.querySelectorAll('main, section, div')].filter(d => {
      const r = d.getBoundingClientRect();
      return r.top >= hb - 2 && r.height > 20 && d.textContent.trim().length > 8;
    });
    const first = nodes.sort((a, c) => a.getBoundingClientRect().top - c.getBoundingClientRect().top)[0];
    const h1 = document.querySelector('h1');
    return {
      headerBottom: Math.round(hb),
      firstTop: first ? Math.round(first.getBoundingClientRect().top) : null,
      h1Top: h1 ? Math.round(h1.getBoundingClientRect().top) : null,
      gap: first && h1 ? Math.round(h1.getBoundingClientRect().top - hb) : null,
    };
  });
  out.push(`${pg.padEnd(32)} header底=${m.headerBottom} 首个内容块顶=${m.firstTop} h1顶=${m.h1Top} h1距导航=${m.gap}`);
}
console.log(out.join('\n'));
const gaps = out.map(r => Number(r.match(/h1距导航=(\d+)/)?.[1] ?? NaN)).filter(n => !Number.isNaN(n));
console.log('\nh1 距导航条: min', Math.min(...gaps), 'max', Math.max(...gaps));
await b.close();
