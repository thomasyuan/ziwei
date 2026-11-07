import puppeteer from 'puppeteer-core';
const BASE='http://127.0.0.1:3996', BP='/ziwei';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',userDataDir:'./.pptr-scroll'});
const p=await b.newPage();
await p.setViewport({width:1280,height:900});
// 首页滚到中间 → 点页脚「关于」→ 新页应从头开始；检查 eyebrow 是否被导航条压住
await p.goto(`${BASE}${BP}/`,{waitUntil:'networkidle2'});
await p.evaluate(()=>window.scrollTo(0,600));
console.log('滚动后 scrollY:', await p.evaluate(()=>window.scrollY));
await p.evaluate(()=>{ const a=[...document.querySelectorAll('footer a')].find(x=>x.getAttribute('href')?.endsWith('/about')); a?.click(); });
await new Promise(r=>setTimeout(r,1200));
const y=await p.evaluate(()=>window.scrollY);
const topVisible=await p.evaluate(()=>{
  const header=document.querySelector('header').getBoundingClientRect().bottom;
  const eb=[...document.querySelectorAll('span')].filter(s=>!s.closest('header') && /^[A-Z .]+$/.test(s.textContent.trim()) && s.textContent.trim().length>=6)[0];
  return eb ? Math.round(eb.getBoundingClientRect().top) >= header : null;
});
console.log('跳转到 /about 后 scrollY:', y, '| eyebrow 完整可见(在导航条下方):', topVisible);
// 再从中段点导航里的菜单项
await p.evaluate(()=>window.scrollTo(0,400));
await p.evaluate(()=>{ const a=[...document.querySelectorAll('header a')].find(x=>x.getAttribute('href')?.endsWith('/guides')); a?.click(); });
await new Promise(r=>setTimeout(r,1200));
console.log('点菜单 /guides 后 scrollY:', await p.evaluate(()=>window.scrollY), '| URL:', p.url());
await b.close();
