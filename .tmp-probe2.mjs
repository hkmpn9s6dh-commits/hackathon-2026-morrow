import { chromium } from 'playwright-core';
const CHROME='C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const b=await chromium.launch({executablePath:CHROME});
const p=await b.newPage({viewport:{width:1600,height:1200},deviceScaleFactor:1});
await p.goto('https://watch.chromaawards.com/',{waitUntil:'networkidle',timeout:60000}).catch(()=>{});
await p.waitForTimeout(3000);
// 滚到底把所有卡片加载出来
for(let i=0;i<40;i++){await p.mouse.wheel(0,1800);await p.waitForTimeout(320);}
const rows=await p.evaluate(()=>[...document.querySelectorAll('a[href*="/submission/"]')].map(a=>{
  const img=a.querySelector('img');
  return {href:a.getAttribute('href'), text:(a.innerText||'').replace(/\n+/g,' | ').slice(0,160), img: img? img.getAttribute('src'):null};
}));
const games=rows.filter(r=>/Games?\s*-|- Games|Game/i.test(r.text));
console.log('TOTAL',rows.length,'GAMES',games.length);
for(const g of games) console.log(JSON.stringify(g));
await b.close();
