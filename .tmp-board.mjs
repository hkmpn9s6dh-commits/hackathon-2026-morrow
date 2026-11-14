import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
const CHROME='C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const files = [
  ['proof/gate-d/rulers/05-the-dream.jpg','R1 The Dream'],
  ['proof/gate-d/rulers/09-genesis-interface.jpg','R2 GENESIS / INTERFACE'],
  ['proof/gate-d/rulers/03-vibe-survivor.png','R3 Vibe Survivor'],
  ['proof/gate-d/rulers/01-game-rush.png','R4 GAME RUSH'],
  ['proof/gate-d/rulers/04-blokaisia.jpg','R5 BlokAIsia'],
  ['shots/01-cover.png','MINE'],
];
// 固定洗牌（seed 写在这里，谁都能复现）
let seed = 20260108;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const order = [...files];
for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
const letters = ['A','B','C','D','E','F'];
const mapping = order.map((f, i) => `${letters[i]} = ${f[1]}`);
writeFileSync('proof/gate-d/mapping.txt', mapping.join('\n') + '\n');
const tiles = order.map((f, i) => {
  const ext = f[0].split('.').pop();
  const b64 = readFileSync(f[0]).toString('base64');
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  return `<figure><span>${letters[i]}</span><img src="data:${mime};base64,${b64}"></figure>`;
}).join('\n');
const html = `<html><body style="margin:0;background:#050506">
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:10px;width:2440px">
${tiles}
</div>
<style>
figure{margin:0;position:relative;aspect-ratio:16/9;overflow:hidden;background:#000}
figure img{width:100%;height:100%;object-fit:cover;display:block}
figure span{position:absolute;left:10px;top:6px;font:600 30px/1 monospace;color:#fff;text-shadow:0 0 12px #000,0 0 3px #000}
</style></body></html>`;
const b = await chromium.launch({executablePath:CHROME});
const p = await b.newPage({viewport:{width:2440,height:860},deviceScaleFactor:1});
await p.setContent(html);
await p.waitForTimeout(700);
await p.screenshot({path:'proof/gate-d/board-r1.png', fullPage:true});
console.log(mapping.join(' | '));
await b.close();
