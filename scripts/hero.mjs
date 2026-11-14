/**
 * 交件缩略图：玩到第三夜（屋里已经有几件东西），再拍 1500×844。
 * 这张图要回答一个问题：这游戏到底长什么样。
 */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CHROME = process.env.MORROW_CHROME ?? 'C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';

async function main() {
  const out = resolve(root, 'submission');
  await mkdir(out, { recursive: true });
  const server = await startServer(resolve(root, 'dist'), 4337);
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 844 }, deviceScaleFactor: 1 });
    await page.goto(server.url, { waitUntil: 'domcontentloaded' });
    await page.click('#begin');
    await page.waitForTimeout(2600);

    for (let step = 0; step < 40; step += 1) {
      const s = await page.evaluate(() => ({ night: window.__morrow.night, over: window.__morrow.over }));
      if (s.night >= 3 && (await page.locator('.choices .choice').count()) > 0) break;
      if (await page.locator('.interlude').count()) { await page.waitForTimeout(1500); continue; }
      if (s.over) {
        const d = page.locator('.card .drop').first();
        if (await d.count()) { await d.click(); await page.waitForTimeout(700); continue; }
      }
      if (await page.locator('.recital').count()) { await page.locator('.recital').click(); await page.waitForTimeout(300); continue; }
      const c = page.locator('.choices .choice');
      if (await c.count()) { await c.first().click(); await page.waitForTimeout(500); continue; }
      await page.waitForTimeout(300);
    }
    // 等这一拍打完，再等灯光落定
    await page.waitForFunction(() => {
      const last = [...document.querySelectorAll('.line')].pop();
      return !last || last.getAttribute('data-done') === '1';
    }, null, { timeout: 15000 }).catch(() => {});
    // 停在有选项的那一拍：图里看得出"这是个能玩的游戏"
    await page.waitForSelector('.choices .choice', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2200);

    // 一、带界面的实拍（说明"这是个能玩的游戏"）
    await page.screenshot({ path: resolve(out, 'ingame-ui.png') });
    console.log('  ingame-ui.png 1500×844');

    // 二、把界面收起来，只留画面（画廊缩略图用：一眼是图，不是字）
    await page.evaluate(() => {
      for (const sel of ['#window', '.talk', '.runhead']) {
        const el = document.querySelector(sel);
        if (el) el.style.display = 'none';
      }
      // 推近一点：缩略图里要让他占住画面
      const scene = document.querySelector('#scene');
      if (scene) {
        scene.style.transform = 'scale(1.12)';
        scene.style.transformOrigin = '50% 58%';
      }
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: resolve(out, 'thumbnail.png') });
    console.log('  thumbnail.png 1500×844');
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
