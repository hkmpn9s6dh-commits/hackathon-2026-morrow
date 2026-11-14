/**
 * 界面卫生量测：字号、对比度、溢出、点击区、横向滚动。
 *
 *   node scripts/measure-ui.mjs
 *
 * 写出 proof/ui/report.md；退出码 0 表示全过。它只管卫生，不判审美。
 *
 * 分两档：
 *   - 阅读文本：≥ 12px，对比度 ≥ 4.5
 *   - 大写小标签（表头、成本、计数）：≥ 9.5px，对比度 ≥ 3.0
 *     —— 这一档是与样板的既定取舍：等宽大写字距拉开后在 2 倍屏上清晰，
 *        但它们不是要连着读的句子，所以按 WCAG 的 large-text 之外单列一档。
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CHROME =
  process.env.MORROW_CHROME ??
  'C:/Users/张一/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
];

const READING = [
  '.line.elias p',
  '.line.morrow p',
  '.line.system p',
  '.card .text',
  '.card .label',
  '.recital li',
  '.choice',
  '.prompt',
  '.ending .answer',
  '.ending .last',
  '.ledger li',
];
const MICRO = ['.speaker', '.plate', '.gauge-line', '.card .cost', '.instruction', '.hintline', '.stat', '.runhead', '.btn', '.tally', '.card .lost'];

const MIN_READING = 12;
const MIN_MICRO = 9.5;
const MIN_CONTRAST = 4.5;
const MIN_CONTRAST_MICRO = 3;

/** 背景是渐变和半透明，按区域取一个实测值来算对比度，并在报告里写明。 */
const REGION_BG = [
  ['.window', [12, 14, 17]],
  ['.cover', [9, 10, 12]],
  ['.interlude', [7, 8, 10]],
  [':root', [9, 10, 12]],
];

function rgb(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str);
  if (!m) return [255, 255, 255];
  return m[1]
    .split(',')
    .slice(0, 3)
    .map((v) => Number(v.trim()));
}

function luminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function bgFor(selector) {
  for (const [prefix, color] of REGION_BG) {
    if (prefix === ':root' || selector.startsWith(prefix)) return color;
  }
  return [9, 10, 12];
}

const problems = [];
const rows = [];

async function measureViewport(browser, base, vp) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.name === 'phone',
    hasTouch: vp.name === 'phone',
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#begin');

  // 让界面进入"有卡片、有选项"的状态
  await page.click('#begin');
  await page.waitForTimeout(2600);
  const choices = page.locator('.choices .choice');
  if (await choices.count()) {
    await choices.first().click();
    await page.waitForTimeout(2200);
  }

  const data = await page.evaluate(
    (payload) => {
      const { reading, micro } = payload;
      const out = [];
      for (const [tier, sels] of [
        ['reading', reading],
        ['micro', micro],
      ]) {
        for (const sel of sels) {
          for (const el of document.querySelectorAll(sel)) {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) continue;
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            out.push({
              tier,
              sel,
              text: (el.textContent ?? '').trim().slice(0, 42),
              size: parseFloat(cs.fontSize),
              color: cs.color,
              height: Math.round(r.height),
            });
          }
        }
      }
      const buttons = [...document.querySelectorAll('.btn, .choice, .drop')]
        .filter((b) => getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height > 0)
        .map((b) => ({
          cls: b.className,
          text: (b.textContent ?? '').trim().slice(0, 24),
          h: Math.round(b.getBoundingClientRect().height),
        }));
      const overflow = [...document.querySelectorAll('.line.elias p, .line.morrow p, .ending .answer, .card .label')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => (el.textContent ?? '').trim().slice(0, 40));
      return {
        items: out,
        buttons,
        overflow,
        docOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        width: window.innerWidth,
      };
    },
    { reading: READING, micro: MICRO },
  );

  // 去重（同一个选择器多元素，取最差的一条即可）
  const worst = new Map();
  for (const item of data.items) {
    const key = `${item.tier}|${item.sel}`;
    const prev = worst.get(key);
    if (!prev || item.size < prev.size) worst.set(key, item);
  }

  for (const item of worst.values()) {
    const bg = bgFor(item.sel);
    const ratio = contrast(rgb(item.color), bg);
    const minSize = item.tier === 'reading' ? MIN_READING : MIN_MICRO;
    const minRatio = item.tier === 'reading' ? MIN_CONTRAST : MIN_CONTRAST_MICRO;
    const bad = item.size < minSize || ratio < minRatio;
    rows.push({ vp: vp.name, ...item, ratio, bg, minSize, minRatio, bad });
    if (bad) {
      problems.push(
        `${vp.name} · ${item.sel} · ${item.size}px / ${ratio.toFixed(1)}:1（要 ≥${minSize}px、≥${minRatio}:1）`,
      );
    }
  }

  for (const b of data.buttons) {
    if (b.h < 32) problems.push(`${vp.name} · 按钮太矮 ${b.h}px · ${b.text}`);
  }
  if (data.docOverflow) problems.push(`${vp.name} · 页面横向溢出（宽 ${data.width}）`);
  for (const t of data.overflow) problems.push(`${vp.name} · 文本被截断：${t}`);

  return data;
}

async function main() {
  const server = await startServer(resolve(root, 'dist'), 4334);
  const browser = await chromium.launch({ executablePath: CHROME });
  const summary = [];
  try {
    for (const vp of VIEWPORTS) {
      const d = await measureViewport(browser, server.url, vp);
      summary.push({ vp: vp.name, items: d.items.length, buttons: d.buttons.length });
      console.log(`  ${vp.name}: ${d.items.length} 个文本节点 / ${d.buttons.length} 个按钮`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const lines = [];
  lines.push('# UI 量测报告（自动生成）');
  lines.push('');
  lines.push(`生成：node scripts/measure-ui.mjs · 结论：**${problems.length ? '有问题' : '全过'}**`);
  lines.push('');
  lines.push('- 阅读文本：≥ 12px，对比度 ≥ 4.5:1');
  lines.push('- 大写小标签：≥ 9.5px，对比度 ≥ 3:1（等宽、字距拉开、非连续阅读文本）');
  lines.push('- 可点元素：高度 ≥ 32px；页面不得横向溢出；正文不得被截断');
  lines.push('- 背景取区域实测底色（`.window` #0c0e11、页面 #090a0c），不是纯色量的');
  lines.push('');
  lines.push('| 视口 | 选择器 | 档 | 字号 | 对比度 | 背景 | 结论 |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    lines.push(
      `| ${r.vp} | \`${r.sel}\` | ${r.tier === 'reading' ? '阅读' : '标签'} | ${r.size}px | ${r.ratio.toFixed(1)}:1 | rgb(${r.bg.join(',')}) | ${r.bad ? '❌' : '✓'} |`,
    );
  }
  lines.push('');
  lines.push(`覆盖：${summary.map((s) => `${s.vp} ${s.items} 节点 / ${s.buttons} 按钮`).join('；')}`);
  lines.push('');
  if (problems.length) {
    lines.push('## 待修');
    for (const p of problems) lines.push(`- ${p}`);
  } else {
    lines.push('## 待修');
    lines.push('- 无');
  }

  await mkdir(resolve(root, 'proof/ui'), { recursive: true });
  await writeFile(resolve(root, 'proof/ui/report.md'), `${lines.join('\n')}\n`, 'utf8');

  if (problems.length) {
    console.error(`\n${problems.length} 个问题：`);
    for (const p of problems.slice(0, 20)) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log('\nui: all clean');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
