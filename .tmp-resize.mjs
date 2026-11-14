import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const CHROME='C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const files=process.argv.slice(2);
const b=await chromium.launch({executablePath:CHROME});
for(const f of files){
  const b64=readFileSync(f).toString('base64');
  const ext=f.split('.').pop();
  const p=await b.newPage({viewport:{width:960,height:600}});
  await p.setContent(`<body style="margin:0;background:#000"><img src="data:image/${ext==='png'?'png':'jpeg'};base64,${b64}" style="width:960px;display:block"></body>`);
  await p.waitForTimeout(300);
  const out=f.replace(/\.(png|jpg)$/,'-small.jpg');
  await p.screenshot({path:out,type:'jpeg',quality:82});
  console.log(out);
  await p.close();
}
await b.close();
