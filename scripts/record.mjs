/**
 * 录一段真实的演示：真浏览器、真点击、真音轨（浏览器自己编 opus）。
 *
 *   node scripts/record.mjs
 *
 * 产出：
 *   submission/gameplay.webm        画面（Playwright 录的）
 *   submission/gameplay-audio.webm  这一局的音轨（页面里 MediaRecorder 录的）
 *   submission/gameplay-final.webm  两条合成（ffmpeg -c copy，不重编码）
 *
 * 之所以这么绕：本机 ffmpeg 是精简构建，只有 webm 和 vp9，没有音频编码器。
 * 让浏览器编码音频、ffmpeg 只做搬运，是唯一能保住"真声音"的路。
 */

import { execFile } from 'node:child_process';
import { mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { chromium } from 'playwright-core';

import { startServer } from './serve.mjs';

const run = promisify(execFile);
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CHROME =
  process.env.MORROW_CHROME ??
  'C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const FFMPEG =
  process.env.MORROW_FFMPEG ??
  'C:/Users/张一/AppData/Local/ms-playwright/ffmpeg-1013/ffmpeg-win64.exe';

const out = resolve(root, 'submission');
const vdir = resolve(out, '.video-tmp');
const SIZE = { width: 1280, height: 720 };

async function waitBeat(page) {
  await page
    .waitForFunction(
      () => {
        const lines = [...document.querySelectorAll('.line')];
        const last = lines[lines.length - 1];
        if (last && last.getAttribute('data-done') !== '1') return false;
        return Boolean(
          document.querySelector('.recital') ||
            document.querySelector('.choices') ||
            document.querySelector('#answer') ||
            document.querySelector('#ending'),
        );
      },
      null,
      { timeout: 20000 },
    )
    .catch(() => {});
}

async function main() {
  await mkdir(out, { recursive: true });
  await rm(vdir, { recursive: true, force: true });
  await mkdir(vdir, { recursive: true });

  const server = await startServer(resolve(root, 'dist'), 4335);
  const browser = await chromium.launch({ executablePath: CHROME });
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 1,
    recordVideo: { dir: vdir, size: SIZE },
  });
  const page = await context.newPage();
  await page.goto(server.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800); // 让封面烧一会儿，给片子留个开场

  await page.click('#begin');
  await page.waitForTimeout(320);
  await page.evaluate(() => window.__morrow.startRec());

  // 一条路走到结局：每次选第一项；溢出就删；念窗口就点
  for (let step = 0; step < 90; step += 1) {
    if (await page.locator('#ending').count()) break;
    const s = await page.evaluate(() => ({ over: window.__morrow.over, ended: window.__morrow.ended }));
    if (s.ended) break;
    if (await page.locator('.interlude').count()) {
      await page.waitForTimeout(1500);
      continue;
    }
    if (s.over) {
      const d = page.locator('.card .drop').first();
      if (await d.count()) {
        await d.click();
        await page.waitForTimeout(1100);
        continue;
      }
    }
    if (await page.locator('.recital').count()) {
      await page.waitForTimeout(1500);
      await page.locator('.recital').click();
      await page.waitForTimeout(400);
      continue;
    }
    if (await page.locator('#answer').count()) {
      await page.locator('#answer').click();
      await page.waitForTimeout(1200);
      continue;
    }
    const choices = page.locator('.choices .choice');
    if (await choices.count()) {
      await page.waitForTimeout(400);
      await choices.first().click();
      await page.waitForTimeout(300);
      await waitBeat(page);
      continue;
    }
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(2200); // 结局停一会儿
  const audio = await page.evaluate(() => window.__morrow.stopRec());
  await page.waitForTimeout(500);

  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();
  await server.close();

  if (audio) {
    const base64 = String(audio).split(',')[1] ?? '';
    await writeFile(resolve(out, 'gameplay-audio.webm'), Buffer.from(base64, 'base64'));
  }
  if (!videoPath) {
    console.error('没有录到画面');
    process.exit(1);
  }
  const raw = resolve(out, 'gameplay.webm');
  await rm(raw, { force: true });
  await writeFile(raw, await (await import('node:fs/promises')).readFile(videoPath));

  // 合成：只搬运，不重编码
  let muxed = false;
  try {
    await run(FFMPEG, [
      '-y',
      '-i',
      raw,
      '-i',
      resolve(out, 'gameplay-audio.webm'),
      '-c',
      'copy',
      '-shortest',
      resolve(out, 'gameplay-final.webm'),
    ]);
    muxed = true;
  } catch (err) {
    console.log('合成失败（画面单独可用）：', String(err).slice(0, 200));
  }

  const files = await readdir(out);
  console.log('产出：', files.filter((f) => f.endsWith('.webm')).join('  '));
  console.log(muxed ? '画面与音轨已合成 gameplay-final.webm' : '只有画面，没有音轨');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
