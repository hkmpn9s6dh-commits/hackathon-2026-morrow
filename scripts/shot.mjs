/**
 * 实拍：真浏览器、真构建产物。
 *
 *   node scripts/shot.mjs
 *
 * 图落在 shots/，自己看，也给盲排的评委看。
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
const out = resolve(root, process.env.MORROW_SHOT_DIR ?? 'shots');
const DPR = Number(process.env.MORROW_SHOT_DPR ?? 2);

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

async function settle(page) {
  await page.waitForFunction(
    () => {
      const lines = [...document.querySelectorAll('.line')];
      const last = lines[lines.length - 1];
      if (last && last.getAttribute('data-done') !== '1') return false;
      const recital = document.querySelector('.recital');
      const choices = document.querySelector('.choices');
      const answer = document.querySelector('#answer');
      return Boolean(recital || choices || answer || last);
    },
    null,
    { timeout: 20000 },
  );
  await page.waitForTimeout(700);
}

async function pickChoice(page, index = 0) {
  await settle(page);
  const buttons = page.locator('.choices .choice');
  const count = await buttons.count();
  if (!count) return false;
  await buttons.nth(Math.min(index, count - 1)).click();
  await page.waitForTimeout(260);
  return true;
}

async function skipRecital(page) {
  const recital = page.locator('.recital');
  if (await recital.count()) {
    await recital.first().click();
    await page.waitForTimeout(300);
  }
}

async function waitRecital(page) {
  for (let i = 0; i < 40; i += 1) {
    if (await page.locator('.recital').count()) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

async function shot(page, name) {
  await page.screenshot({ path: resolve(out, `${name}.png`), animations: 'disabled' });
  console.log(`  ${name}.png`);
}

async function main() {
  await mkdir(out, { recursive: true });
  const server = await startServer(resolve(root, 'dist'), 4332);
  const browser = await chromium.launch({ executablePath: CHROME });

  try {
    const page = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: DPR });
    await page.goto(server.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await shot(page, '01-cover');

    await page.click('#begin');
    await settle(page);
    await page.waitForTimeout(500);
    await shot(page, '02-night-1-first-line');

    await pickChoice(page, 0);
    await settle(page);
    await shot(page, '03-first-memory');

    await pickChoice(page, 0);
    await waitRecital(page);
    await page.waitForTimeout(900);
    await shot(page, '04-recital-night-1');
    await skipRecital(page);
    await settle(page);

    // 走到第四夜，制造溢出
    for (let guard = 0; guard < 40; guard += 1) {
      if (await page.locator('.interlude').count()) {
        await page.waitForTimeout(1600);
        continue;
      }
      const over = await page.evaluate(() => window.__morrow?.over ?? false);
      if (over) break;
      const picked = await pickChoice(page, 0);
      if (picked) continue;
      await skipRecital(page);
      const answer = page.locator('#answer');
      if (await answer.count()) break;
      await page.waitForTimeout(400);
    }
    await settle(page).catch(() => {});
    await shot(page, '05-window-full');

    const overNow = await page.evaluate(() => window.__morrow?.over ?? false);
    if (overNow) {
      const drop = page.locator('.card .drop').first();
      if (await drop.count()) {
        await drop.click();
        await page.waitForTimeout(900);
      }
    }
    await shot(page, '06-after-a-loss');

    // 走到结局
    for (let guard = 0; guard < 40; guard += 1) {
      if (await page.locator('#ending').count()) break;
      if (await page.locator('.interlude').count()) {
        await page.waitForTimeout(1600);
        continue;
      }
      const answered = await page.evaluate(() => window.__morrow?.ended ?? false);
      if (answered) break;
      const over = await page.evaluate(() => window.__morrow?.over ?? false);
      if (over) {
        const drop = page.locator('.card .drop').first();
        if (await drop.count()) {
          await drop.click();
          await page.waitForTimeout(700);
          continue;
        }
      }
      const answer = page.locator('#answer');
      if (await answer.count()) {
        await answer.click();
        await page.waitForTimeout(800);
        continue;
      }
      const picked = await pickChoice(page, 0);
      if (picked) continue;
      await skipRecital(page);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(700);
    await shot(page, '07-ending');

    // 手机
    const phone = await browser.newPage({ viewport: PHONE, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
    await phone.goto(server.url, { waitUntil: 'domcontentloaded' });
    await phone.waitForTimeout(700);
    await shot(phone, '08-phone-cover');
    await phone.click('#begin');
    await settle(phone);
    await pickChoice(phone, 0);
    await settle(phone);
    await shot(phone, '09-phone-memory');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
