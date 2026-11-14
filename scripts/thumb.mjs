/**
 * 交件用的缩略图 / 封面图：真浏览器、真构建产物、固定画幅。
 *
 *   node scripts/thumb.mjs
 *
 * Chroma 的画廊按缩略图排，所以这张图要单独出：1500×844（16:9），另出一张 1600×900 的封面。
 */

import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CHROME =
  process.env.MORROW_CHROME ??
  'C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';

const SHOTS = [
  { name: 'thumbnail.png', width: 1500, height: 844 },
  { name: 'cover-1600x900.png', width: 1600, height: 900 },
];

async function main() {
  const out = resolve(root, 'submission');
  await mkdir(out, { recursive: true });
  const server = await startServer(resolve(root, 'dist'), 4336);
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    for (const s of SHOTS) {
      const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1 });
      await page.goto(server.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2600); // 让火烧到一个好看的形状
      await page.screenshot({ path: resolve(out, s.name) });
      console.log(`  ${s.name}  ${s.width}×${s.height}`);
      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
