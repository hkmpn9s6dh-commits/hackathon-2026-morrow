# 闸 D — 盲排记录

题目：**「评委第一眼会停下来吗」**。成品与 Chroma Awards 2025 Games 分区的往届得奖/入围作混在一起，
随机字母命名，交给没参与制作的评委各自排名。**每一位都把它排在至少 3 件得奖作之上，才算过线。**

## 棋盘

- 图：`board-r1.png`（6 格，3×2，每格 16:9，等大，只标字母，不标作者与类别）
- 字母对照（固定洗牌，种子 `20260108`，可复现）：`mapping.txt`
  - A = Vibe Survivor（Chroma 2025，Games，带奖章）
  - B = GAME RUSH（Chroma 2025，Games）
  - **C = 本次作品《What Morrow Keeps》**
  - D = BlokAIsia（Chroma 2025，Games）
  - E = GENESIS / INTERFACE（Chroma 2025，Games · Interactive Narrative）
  - F = The Dream（Chroma 2025，Games · Interactive Narrative）
- 尺子缩略图原件在 `rulers/`（9 件，另 4 件备用）。

## 第 1 轮（2026-11-14 15:00）：**未过线**

成品当时的封面：黑场 + 左侧标题 + 右侧一张小尺寸烧卡（520×470 画布，卡片 40% 画幅）。

| 评委 | 排名 | 我们的位置 | 原话（摘要） |
| --- | --- | --- | --- |
| 子代理 A（reasoning 档） | A > E > F > **C** > D > B | 第 4 | 「C 衬线排版和燃烧纸页优雅克制，小而静，但缩略图偏暗」 |
| 子代理 B（lite 档） | E > A > F > **C** > D > B | 第 4 | 「C elegant serif title and torn parchment; quiet but unmistakably authored」 |

第 4 ＝只压在 2 件得奖作之上（D、B），**不够**。两位评委指名的是同一个毛病：**太静、太暗、缩略图里面积太小**。

## 改法（不是调参，是换做法）

1. **卡片放大约 2.3 倍**：画布 520×470 → 640×700，卡片上下出血（贴着画幅顶底），烧口从画幅 62% 处开始。
2. **字号随卡片上调**：卡内正文 27/23px → 36/30px，卡片自己的表头 10→12px。
3. **背景由「纯黑」改成「被自己的火照亮」**：封面上加暖色径向光（`rgba(255,176,92,.20)`），
   并在卡片外挂一层 120px 的暖色 drop-shadow。缩略图里整块区域因此有亮度，不再是一块黑。
4. 标题改成三行压排（What / *Morrow* / Keeps），在缩略图里占的高度变大。

## 第 2 轮（2026-11-14 15:12）：**过线**

| 评委 | 排名 | 我们的位置 | 原话（摘要） |
| --- | --- | --- | --- |
| 子代理 A（reasoning 档） | E > A > **C** > F > D > B | **第 3** | 「米色衬线排版独特，但小尺寸下文字失读」 |
| 子代理 B（lite 档） | **C** > F > E > A > D > B | **第 1** | 「Elegant serif typography, letter and page; promises literary craft」 |

两位都把它排在 ≥3 件得奖作之上（A：压在 F、D、B 之上；B：压在全部 5 件之上）。**按规则，闸 D 过线。**

## 仍要说明的两点（不粉饰）

1. **两位评委同族不同档**（同厂商 reasoning / lite），不是「不同家族」。规则里验收那一轮要求至少一位不同家族、
   能看图的评委——这一步建议由 台分（Opus5.5）或 gpt 系 agent 用子单再跑一次；本轮的结论是**条件性过线**。
2. 评委 A 第 2 轮仍点到「小尺寸下文字失读」。这是本作的结构性软处：它是排版的，不是插画的。
   对策已写进提交包：缩略图用 16:9 封面原图（1500×844），不要再用更小的图。

## 复现

```bash
node scripts/board.mjs       # 用固定种子重排棋盘 → proof/gate-d/board-r1.png
```
