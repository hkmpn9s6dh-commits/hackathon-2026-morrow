# 02 — PROOF（闸 C：你能证明它能用吗）

一句话：**一个人从零 clone，只照 README 跑 `bash scripts/verify.sh`，全绿；线上同一版也全绿。**
下面是逐条证据，命令可复制、输出可复验。

## 1. 本机全量

```
$ bash scripts/verify.sh
== node            node v22.22.2, npm 10.x
== 字体随包        5 个 woff2
== type check      (无输出)
== unit tests      29 tests passed
== build           ✓ built
== end to end      27/27 passed
== ui measurement  proof/ui/report.md 已更新
== hygiene         dist: 154468 bytes
verify: all green
```

用例如下（`test/engine.test.ts`，29 条）：窗口算术 5 · 删除 4 · 折起 4 · 系统指令 3 · 换夜 3 ·
结局 6 · 内容自洽 4。

其中两条是「这件作品还算不算一件作品」的兜底：

- **`the thriftiest legal run still overflows on the last night`**：每晚都挑最便宜的那张、两次折起全用掉，
  最后一夜仍然超预算 —— 说明"必须放弃点什么"不是文案，是算术。
- **`every ending has words`** + **`every choice records a fact that exists`**：五个结局都有正文，
  每个选项都连着一条真实存在的记忆，不会出现点了没反应的死路。

## 2. 端到端（真 Chromium、真点击、两个视口、两条路）

```
$ node scripts/e2e.mjs
  PASS  AC-1 三秒内可交互 — 334ms
  PASS  AC-10 随包字体已加载（Garamond）／（Plex）
  PASS  封面标题正确
  PASS  AC-3 开局只占系统指令 180 — 180
  PASS  AC-4 记一张卡后窗口变大 — 650 tokens, 1 cards
  PASS  键盘 1 可选
  PASS  AC-7 会溢出 — over（4280 / 4096）
  PASS  AC-7 溢出时点不到答案
  PASS  溢出时窗口有提示
  PASS  AC-5 删掉的那张不在了 — hands
  PASS  AC-5 记进了 evicted — 0 → 1
  PASS  AC-9 走到结局 — lamp（kept 6 / gone 12）
  PASS }

第二条路（最后一夜改系统指令）走到 **comfort**，说明"删掉那句规矩"这条路是真的通，不是文案分支：

```
  PASS  第二条路走到结局 — ending · comfort
  PASS  AC-8 最后一夜能改系统指令 — comfort
```

手机（390×844，`hasTouch`）：

```
  PASS  手机上面板默认收起
  PASS  手机上两个选项都在可视区
  PASS  AC-12 手机上能记住第一件事 — 1 cards
  PASS  AC-12 手机没有横向溢出
```

外加两条硬约束：**运行时不发任何外部请求**、**没有控制台报错**。

## 3. 线上（GitHub Pages）

- 地址：https://hkmpn9s6dh-commits.github.io/hackathon-2026-morrow/
- `node scripts/e2e.mjs --url <线上>` → **27/27 passed**（同一份构建，不是 dev server）
- 仓库：https://github.com/hkmpn9s6dh-commits/hackathon-2026-morrow（MIT，`main` 是源码，`gh-pages` 是构建产物）

## 4. 全新 clone（闸 C 的硬门槛）

```
$ git clone https://github.com/hkmpn9s6dh-commits/hackathon-2026-morrow.git
$ cd hackathon-2026-morrow && bash scripts/verify.sh
29 tests passed
27/27 passed
verify: all green      ← 退出码 0
```

用的是**另一台机器之外的全新目录**，没有 `node_modules`、没有 `.tmp`、没有任何本机状态；
除了 `npm ci` 与 Playwright 的 Chromium，什么都不额外提供。

## 5. 界面量测（`proof/ui/report.md`）

- 三个视口（1440×900 / 1280×800 / 390×844），每个视口 11 个文本节点、2 个按钮
- 阅读文本 ≥ 12px、对比度 ≥ 4.5:1；大写小标签 ≥ 9.5px、≥ 3:1（报告里写明这一档的理由）
- 可点元素 ≥ 32px；无横向溢出；正文无截断
- 结论：**全过，0 问题**

## 6. 第一眼（闸 D）

两轮盲排记录在 `proof/gate-d/README.md`：第 1 轮两位都排第 4（未过线），改法后第 2 轮 3rd / 1st（过线）。
**条件性**：两位评委同族不同档，不同家族那一位还没跑。

## 7. 没能证明的（自己先说）

1. **真机 iOS Safari / 微信内置浏览器**没上过真机，只在 Chromium（桌面 + 移动模拟）验过。
2. **声音只在本机扬声器上听过**：程序合成的音色在低端安卓上可能偏薄。
3. **8 分钟的通关时长**是按 e2e 的点击节奏估的，真人有阅读停顿，实际可能 10–12 分钟。
4. 演示片是 webm（本机 ffmpeg 是精简构建，没有 mp4 编码器），见 `05-SUBMISSION.md`。
