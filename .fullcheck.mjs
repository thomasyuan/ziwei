import puppeteer from 'puppeteer-core';
const BASE=process.argv[2], BP=process.argv[3] ?? '';
const PAGES=['/','/chart','/chart?y=1986&m=8&d=20&sh=3&g=f','/heming','/knowledge','/knowledge/ziwei/love','/library','/library/quanshu','/library/quanshu/0','/library/search?q=%E8%B4%AB','/patterns','/guides','/famous','/about','/privacy','/terms'];
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',userDataDir:'./.pptr-full'});
const p=await b.newPage();
await p.setViewport({width:1280,height:900});
// 强制亮色
await p.goto(`${BASE}${BP}/`,{waitUntil:'domcontentloaded'});
await p.evaluate(()=>localStorage.setItem('ziwei-theme','light'));
const rows=[];
for(const pg of PAGES){
  await p.goto(`${BASE}${BP}${pg}`,{waitUntil:'networkidle2',defaultTimeout:25000});
  const r=await p.evaluate(()=>{
    const header=document.querySelector('header');
    const hb=Math.round(header.getBoundingClientRect().bottom);
    const h1=document.querySelector('h1');
    const cands=[...document.querySelectorAll('span')].filter(s=>!s.closest('header') && /^[A-Z .]+$/.test(s.textContent.trim()) && s.textContent.trim().length>=6);
    const eb=cands[0];
    const lines=eb?[...eb.parentElement.querySelectorAll('div')].filter(d=>getComputedStyle(d).width==='48px').length:0;
    return {theme:document.documentElement.getAttribute('data-theme'),body:getComputedStyle(document.body).backgroundColor,hb,h1:h1?Math.round(h1.getBoundingClientRect().top)-hb:null,eb:eb?eb.textContent.trim():'none',lines,headers:document.querySelectorAll('header').length,footers:document.querySelectorAll('footer').length};
  });
  rows.push(`${pg.padEnd(32)} 主题=${r.theme} 底=${r.body} eyebrow=${r.eb} 细线=${r.lines} h1距=${r.h1} header=${r.headers} footer=${r.footers}`);
}
console.log(rows.join('\n'));
console.log('\n底色种类:', new Set(rows.map(r=>r.match(/底=(\S+ \S+ \S+)/)?.[1])).size, '| h1距集合:', new Set(rows.map(r=>r.match(/h1距=(\d+)/)?.[1])));
await b.close();
