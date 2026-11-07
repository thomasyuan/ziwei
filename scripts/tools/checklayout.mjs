/**
 * 全站版式一致性检查：header（导航 + 主题按钮）、footer、章节头（细线 + eyebrow）、标题字号
 * 用法：node scripts/tools/checklayout.mjs [baseURL] [basePath]
 */
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3996';
const BP = process.argv[3] ?? '/ziwei';
const PAGES = ['/', '/chart', '/chart?y=1986&m=8&d=20&sh=3&g=f', '/heming', '/knowledge',
  '/knowledge/ziwei/love', '/library', '/library/quanshu', '/library/quanshu/0', '/library/search?q=%E8%B4%AB',
  '/patterns', '/guides', '/famous', '/about', '/privacy', '/terms'];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', userDataDir: './.pptr-layout',
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const rows = [];
for (const p of PAGES) {
  await page.goto(`${BASE}${BP}${p}`, { waitUntil: 'networkidle2', defaultTimeout: 25000 });
  const r = await page.evaluate(() => {
    const headers = document.querySelectorAll('header').length;
    const footers = document.querySelectorAll('footer').length;
    const navLinks = [...document.querySelectorAll('header a')].map(a => a.textContent.trim()).filter(t => t.length < 8);
    const h1 = document.querySelector('h1');
    const cands = [...document.querySelectorAll('span')].filter(s => !s.closest('header') && /^[A-Z .]+$/.test(s.textContent.trim()) && s.textContent.trim().length >= 6);
    const eyebrow = cands[0];
    const hairlines = eyebrow ? [...eyebrow.parentElement.querySelectorAll('div')].filter(d => getComputedStyle(d).width === '48px').length : 0;
    return {
      headers, footers,
      nav: navLinks.slice(0, 12).join(','),
      h1size: h1 ? getComputedStyle(h1).fontSize : null,
      eyebrow: eyebrow ? eyebrow.textContent.trim() : null,
      hairlines,
    };
  });
  rows.push(`${p.padEnd(32)} header=${r.headers} footer=${r.footers} eyebrow=${r.eyebrow} 细线=${r.hairlines} h1=${r.h1size} nav=[${r.nav}]`);
}
console.log(rows.join('\n'));
const badHeader = rows.filter(r => !r.includes('header=1 '));
const badFooter = rows.filter(r => !r.includes('footer=1'));
const noLines = rows.filter(r => r.includes('细线=2') === false);
console.log(`\nheader=1 页数: ${rows.length - badHeader.length}/${rows.length}`);
console.log(`footer=1 页数: ${rows.length - badFooter.length}/${rows.length}`);
console.log(`带双侧细线的 eyebrow: ${rows.filter(r => r.includes('细线=2')).length}/${rows.length}`);
await browser.close();
