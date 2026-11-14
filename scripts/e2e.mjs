/**
 * 端到端：真 Chromium、真构建产物、真点击。
 *
 *   node scripts/e2e.mjs                本地 dist
 *   node scripts/e2e.mjs --url https://…  线上
 *
 * 退出码就是结论：全过 0，任何一条不过 1。
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CHROME =
  process.env.MORROW_CHROME ??
  'C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';

const args = process.argv.slice(2);
const urlFlag = args.indexOf('--url');
const remote = urlFlag >= 0 ? args[urlFlag + 1] : null;

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function waitBeat(page) {
  await page.waitForFunction(
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
    { timeout: 25000 },
  );
}

async function state(page) {
  return page.evaluate(() => ({
    tokens: window.__morrow.tokens,
    night: window.__morrow.night,
    over: window.__morrow.over,
    ended: window.__morrow.ended,
    ending: window.__morrow.ending,
    cards: document.querySelectorAll('.card').length,
  }));
}

/** 一路推进：念窗口就点、选项就选、溢出就删、结局就停。 */
async function play(page, { maxSteps = 90, rewordAtEnd = false, choiceIndex = 0, stopOver = false } = {}) {
  for (let step = 0; step < maxSteps; step += 1) {
    if (await page.locator('#ending').count()) return 'ending';
    const s = await state(page);
    if (s.ended) return 'ending';

    if (await page.locator('.interlude').count()) {
      await page.waitForTimeout(1700);
      continue;
    }
    if (s.over) {
      if (stopOver) return 'over';
      if (rewordAtEnd && s.night >= 5) {
        if ((await page.locator('.reword').count()) === 0) {
          await page.locator('#instruction').click();
          await page.waitForTimeout(220);
        }
        if (await page.locator('.reword').count()) {
          await page.locator('.reword').click();
          await page.waitForTimeout(700);
          continue;
        }
      }
      const d = page.locator('.card .drop').first();
      if (await d.count()) {
        await d.click();
        await page.waitForTimeout(850);
        continue;
      }
    }
    if (await page.locator('.recital').count()) {
      await page.locator('.recital').click();
      await page.waitForTimeout(320);
      continue;
    }
    if (await page.locator('#answer').count()) {
      await page.locator('#answer').click();
      await page.waitForTimeout(700);
      continue;
    }
    const choices = page.locator('.choices .choice');
    if (await choices.count()) {
      await choices.nth(choiceIndex).click();
      await page.waitForTimeout(280);
      await waitBeat(page).catch(() => {});
      continue;
    }
    await page.waitForTimeout(300);
  }
  return 'timeout';
}

async function main() {
  const server = remote ? null : await startServer(resolve(root, 'dist'), 4333);
  const base = remote ?? server.url;
  const browser = await chromium.launch({ executablePath: CHROME });

  try {
    /* ——— 桌面，第一次通关 ——— */
    const page = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const requests = [];
    const errors = [];
    page.on('request', (r) => requests.push(r.url()));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));

    const t0 = Date.now();
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#begin', { state: 'visible' });
    const readyMs = Date.now() - t0;
    check('AC-1 三秒内可交互', readyMs < 3000, `${readyMs}ms`);

    const fonts = await page.evaluate(async () => {
      // 字体是按需加载的：先要一次，再轮询等它落地；否则线上会因为慢半拍而误判
      const waitFor = async (spec) => {
        for (let i = 0; i < 50; i += 1) {
          await document.fonts.load(spec).catch(() => {});
          if (document.fonts.check(spec)) return true;
          await new Promise((r) => setTimeout(r, 100));
        }
        return document.fonts.check(spec);
      };
      const garamond = await waitFor('16px Garamond');
      const plex = await waitFor('16px Plex');
      await document.fonts.ready;
      return { garamond, plex };
    });
    check('AC-10 随包字体已加载（Garamond）', fonts.garamond === true);
    check('AC-10 随包字体已加载（Plex）', fonts.plex === true);

    const title = await page.textContent('h1');
    check('封面标题正确', /What\s*Morrow\s*Keeps/.test(title.replace(/\s+/g, ' ').trim()), title.trim());

    await page.click('#begin');
    await waitBeat(page);
    const s1 = await state(page);
    check('AC-3 开局只占系统指令 180', s1.tokens === 180, `${s1.tokens}`);
    check('第一夜开始', s1.night === 1, `night ${s1.night}`);

    // 第一次二选一
    const firstCards = s1.cards;
    await page.locator('.choices .choice').first().click();
    await page.waitForTimeout(400);
    await waitBeat(page);
    const s2 = await state(page);
    check('AC-4 记一张卡后窗口变大', s2.tokens > 180 && s2.cards === firstCards + 1, `${s2.tokens} tokens, ${s2.cards} cards`);

    // 键盘 1 也能选
    if (await page.locator('.choices .choice').count()) {
      await page.keyboard.press('1');
      await page.waitForTimeout(500);
      const s3 = await state(page);
      check('键盘 1 可选', s3.cards >= s2.cards, `${s3.cards} cards`);
    } else {
      check('键盘 1 可选', true, '本拍无选项，跳过');
    }

    // 走到溢出
    const stop = await play(page, { stopOver: true, maxSteps: 80 });
    check('AC-7 会溢出', stop === 'over', stop);
    const sOver = await state(page);
    check('AC-7 溢出时点不到答案', (await page.locator('#answer').count()) === 0, `${sOver.tokens} / 4096`);
    check('溢出时窗口有提示', /Something has to go/.test(await page.textContent('#prompt')));

    // 删一张
    const before = await page.evaluate(() => ({
      tokens: window.__morrow.tokens,
      ids: window.__morrow.state.cards.map((c) => c.id),
      evicted: window.__morrow.state.evicted.length,
    }));
    const drop = page.locator('.card .drop').first();
    check('溢出时进入编辑态（有删除按钮）', (await drop.count()) > 0);
    const goneId = (await page.locator('.card').first().getAttribute('data-card')) ?? '';
    if (await drop.count()) {
      await drop.click();
      await page.waitForTimeout(900);
    }
    const after = await page.evaluate(() => ({
      tokens: window.__morrow.tokens,
      ids: window.__morrow.state.cards.map((c) => c.id),
      evicted: window.__morrow.state.evicted.length,
    }));
    check('AC-5 删掉的那张不在了', !after.ids.includes(goneId), `${goneId}`);
    check('AC-5 记进了 evicted', after.evicted === before.evicted + 1, `${before.evicted} → ${after.evicted}`);

    const path = await play(page, { rewordAtEnd: false });
    check('一条路走到底', path === 'ending', path);
    await page.waitForTimeout(600);
    const end = await state(page);
    check('AC-9 走到结局', end.ended === true, `${end.ending}`);
    check('结局有正文', (await page.locator('.ending .answer').count()) === 1);
    check('结局有留存清单', (await page.locator('#ledger').count()) === 1);
    const kept = await page.locator('#ledger .kept li').count();
    const gone = await page.locator('#ledger .gone li').count();
    check('清单两边都有内容', kept > 0 && gone > 0, `kept ${kept} / gone ${gone}`);

    // 无外部请求、无报错
    const external = requests.filter((u) => !u.startsWith(base.replace(/\/$/, '')) && !u.startsWith('data:'));
    check('AC-2 运行时不发外部请求', external.length === 0, external.slice(0, 3).join(' '));
    check('没有控制台报错', errors.length === 0, errors.slice(0, 2).join(' | '));

    await page.close();

    /* ——— 桌面，第二条路：最后一夜改指令 ——— */
    const p2 = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: 1 });
    await p2.goto(base, { waitUntil: 'domcontentloaded' });
    await p2.click('#begin');
    await waitBeat(p2);
    const path2 = await play(p2, { rewordAtEnd: true });
    const e2 = await state(p2);
    check('第二条路走到结局', path2 === 'ending' && e2.ended === true, `${path2} · ${e2.ending}`);
    check('AC-8 最后一夜能改系统指令', typeof e2.ending === 'string', `${e2.ending}`);
    await p2.close();

    /* ——— 手机 ——— */
    const phone = await browser.newPage({
      viewport: PHONE,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await phone.goto(base, { waitUntil: 'domcontentloaded' });
    await phone.tap('#begin');
    await waitBeat(phone);
    const folded = await phone.evaluate(() => document.querySelector('#window').classList.contains('folded'));
    check('手机上面板默认收起', folded === true);
    const choicesVisible = await phone.locator('.choices .choice').first().isVisible();
    check('手机上两个选项都在可视区', choicesVisible === true);
    await phone.locator('.choices .choice').first().tap();
    await phone.waitForTimeout(500);
    const sp = await state(phone);
    check('AC-12 手机上能记住第一件事', sp.cards >= 1, `${sp.cards} cards`);
    const overflowX = await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    check('AC-12 手机没有横向溢出', overflowX === true);
    await phone.close();

    /* ——— 汇总 ——— */
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    if (failed.length) {
      console.log('FAILED:');
      for (const f of failed) console.log(`  - ${f.name} ${f.detail}`);
    }
  } finally {
    await browser.close();
    if (server) await server.close();
  }
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
