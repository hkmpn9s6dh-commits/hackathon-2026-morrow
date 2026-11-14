# 00 — SPEC（闸 A：我们和评委会不会看到同一件东西）

赛道：**Chroma Awards Season 2 · Game 分区 · Interactive Narrative - Presented by Pickford**
截止：2027-01-07 23:45 PT ＝ 北京 2027-01-08 15:45
作品：**《What Morrow Keeps》**（单页 Web，英文，约 8 分钟，无需下载）

## 1. 官方口径（原文，2026-11-14 抓自 chromaawards.com）

> **Thematic Guidelines**
> - **Story & Choice:** Center story-driven experiences with character, dialogue, and meaningful choices.
> - **Player Agency:** Show how player decisions shape the narrative and emotional impact.
> - **Craft & Technical Execution:** Judged on game feel, mechanics, art direction, audio, and overall polish.

> **Technical Requirements**
> - **Platform:** Playable on web without requiring a download
> - **Language:** All languages are eligible, however in-game text and dialogue must be in English or
>   include English subtitles for judging
> - **Judging Link:** Submitted via a web hosted link where the game can be played, publicly accessible,
>   not unlisted, private, nor password protected
> - **Download Link:** Must include a download link a gameplay video of the game

> **判分**：四个维度各占 25% —— Theme & Division Purpose / Creativity & AI Innovation /
> Craft & Technical Polish / Sound & Emotional Impact。

> 赛程：Preliminary（通过/不通过 + 1–10 分）→ Qualifiers（各类前 66%）→ Quarter Finals（前 50）
> → Semi-Finals（前 22）→ Finals（最多四位终审评委）。

## 2. 这件作品怎么对上四条

| 官方维度 | 我们的回答 | 可指认的地方 |
| --- | --- | --- |
| Theme & Division Purpose（25%） | 互动叙事的本体：**选择就是记忆**。问他什么，才记得什么；窗口装不下，就必须忘。 | 每一拍的二选一＝注意力；溢出时的删除＝遗忘 |
| Creativity & AI Innovation（25%） | 机制不是"AI 画了图"，而是**把上下文窗口做成道德装置**：系统指令也占 token，最后一夜它和"留住妻子"抢同一块地方。 | 180 token 的 instruction 卡；`Reword this instruction` |
| Craft & Technical Polish（25%） | 一个状态机、29 条单测、19 项 e2e、界面量测；无外部请求、无位图、字体随包。 | `scripts/verify.sh` |
| Sound & Emotional Impact（25%） | 声音全部程序合成（房间底噪、拨弦、纸被火舔、换夜的风）；结局给一张"留存清单"逐条列出你丢掉的东西。 | `src/audio.ts`；结局的 Kept / Let go |

## 3. 黄金路径（60 秒演示脚本，视频就照这个录）

1. **0–6 s** 封面：黑场，右边一张正在烧的卡片，字是"Her name is Nora."。
2. **6–14 s** 点 Begin → 夜 I。Elias 第一次开口："Is this the thing my daughter put on the phone?"
3. **14–24 s** 第一次二选一：问手，还是问房间。窗口右侧立刻多出一张卡（470 tokens）。
4. **24–34 s** 夜里念窗口：Morrow 把记住的句子念回来。Elias："It sounds like it happened to somebody else."
5. **34–46 s** 跳到夜 IV：他说"我有个妻子，名字那部分是会掉的"。你选"Her name is Nora."
6. **46–56 s** 窗口满了：红色游标、`over by 184`、`Something has to go`。删掉一张，卡片烧掉、灰往下走。
7. **56–60 s** 夜 V："Then tell me who I am." → 结局卡 + 留存清单。

## 4. 验收条件（每条都能用命令或 DOM 断言判）

| # | 条件 | 判据 |
| --- | --- | --- |
| AC-1 | 首屏可交互 ≤ 3 s | e2e `readyMs < 3000` |
| AC-2 | 纯前端、运行时不发任何外部请求 | e2e 抓 request，全部同源；`verify.sh` 扫源码里的 `http(s)://` |
| AC-3 | 窗口算术正确 | 单测 `tokensUsed` / `overBy` |
| AC-4 | 记一张卡＝加它的 token；重复记不重复收费 | 单测 |
| AC-5 | 删一张＝退回 token 并记入 `evicted` | 单测 |
| AC-6 | 折两张＝0.72 之和、丢细节、整局只有 2 次 | 单测 |
| AC-7 | 溢出时不能往后走 | 单测 `nextNight` 不动；e2e 断言 `#answer` 不出现 |
| AC-8 | 系统指令只有最后一夜能改 | 单测 `evictRule` |
| AC-9 | 五个结局都能到达，且各有正文 | 单测 `endingFor` ×5 |
| AC-10 | 字体随包（Garamond / Plex），不走系统字 | e2e `document.fonts.check` |
| AC-11 | 英文正文；无中文界面文字 | `verify.sh` 扫源码里的 CJK |
| AC-12 | 桌面 1440×900 与手机 390×844 都能玩到结局 | e2e 两个视口各跑一遍 |
| AC-13 | 字号 ≥ 12 px、正文对比度 ≥ 4.5 | `scripts/measure-ui.mjs` |
| AC-14 | 一个人从零 clone 只照 README 就能复验 | 闸 C 的全新 clone |

## 5. 不做什么（过了闸 A 只删不加）

- 不做生图当主视觉：这件作品的画面是排版、光与火，生成式模型给不了"因为是你删的所以它才烧"的因果。
- 不做多语言切换：评委看英文；中文只在仓库文档里。
- 不做存档/跳过/成就：8 分钟一次坐完，退出即清空——这正是作品要说的事。
- 不做联网、不采集、不引第三方脚本与 CDN。
