import puppeteer from 'puppeteer-core';
const BASE=process.argv[2] ?? 'http://127.0.0.1:3996', BP=process.argv[3] ?? '/ziwei';
const PAGES=['/','/chart','/chart?y=1986&m=8&d=20&sh=3&g=f','/heming','/knowledge','/knowledge/ziwei/love','/library','/library/quanshu','/library/quanshu/0','/patterns','/guides','/famous','/about','/privacy','/terms'];
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',userDataDir:'./.pptr-dark2'});
const p=await b.newPage();
await p.setViewport({width:1280,height:900});
const lines=[];
for(const pg of PAGES){
  await p.goto(`${BASE}${BP}${pg}`,{waitUntil:'networkidle2',defaultTimeout:25000});
  const r=await p.evaluate(()=>{
    const header=document.querySelector('header');
    const hb=Math.round(header.getBoundingClientRect().bottom);
    const h1=document.querySelector('h1');
    const bodyBg=getComputedStyle(document.body).backgroundColor;
    const headerBg=getComputedStyle(header).backgroundColor;
    const cands=[...document.querySelectorAll('section > div')];
    const box=cands.find(d=>getComputedStyle(d).borderRadius==='10px');
    return {theme:document.documentElement.getAttribute('data-theme'),bodyBg,headerBg,h1Top:h1?Math.round(h1.getBoundingClientRect().top):null,hb,boxBg:box?getComputedStyle(box).backgroundColor:null};
  });
  lines.push(`${pg.padEnd(32)} 主题=${r.theme} body底=${r.bodyBg} header底=${r.headerBg} h1距导航=${r.h1Top?r.h1Top-r.hb:'-'} 正文盒=${r.boxBg}`);
}
console.log(lines.join('\n'));
const bodies=new Set(lines.map(l=>l.match(/body底=(\S+ \S+ \S+)/)?.[1]));
console.log('\n不同的 body 底色种类:', bodies.size, [...bodies]);
await b.close();
