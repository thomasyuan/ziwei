import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: './.pptr-profile2' });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:9999/knowledge/ziwei/love', { waitUntil: 'networkidle2' });
const info = await page.evaluate(() => {
  const theme = document.documentElement.getAttribute('data-theme');
  const sections = [...document.querySelectorAll('section')];
  const boxes = sections.map(s => {
    const d = s.querySelector('div');
    return {
      title: s.querySelector('h2')?.textContent?.slice(0, 12),
      bg: d ? getComputedStyle(d).backgroundColor : null,
      style: d?.getAttribute('style')?.slice(0, 60),
    };
  });
  const root = getComputedStyle(document.documentElement);
  return { theme, count: sections.length, boxes, bgCard: root.getPropertyValue('--bg-card'), bgPage: root.getPropertyValue('--bg-page') };
});
console.log(JSON.stringify(info, null, 2));
// palace cell check on chart page
const p2 = await browser.newPage();
await p2.goto('http://127.0.0.1:9999/chart?y=1986&m=8&d=20&sh=3&g=f', { waitUntil: 'networkidle2', defaultTimeout: 20000 });
const cells = await p2.evaluate(() => {
  const el = [...document.querySelectorAll('div')].filter(d => d.className && String(d.className).includes('palace-cell')).slice(0, 3)
    .map(d => ({ cls: String(d.className).slice(0, 40), bg: getComputedStyle(d).backgroundColor, color: getComputedStyle(d).color }));
  const grid = document.querySelector('.grid');
  return { hasPalaceCell: el.length, el, gridBg: grid ? getComputedStyle(grid).backgroundColor : null };
});
console.log(JSON.stringify(cells, null, 2));
await browser.close();
