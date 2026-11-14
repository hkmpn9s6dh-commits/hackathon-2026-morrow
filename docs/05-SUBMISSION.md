# 05 — SUBMISSION（照这一页抄，别临场想）

提交处：https://submit.chromaawards.com/ ｜ Division **Game** ｜ Category **Interactive Narrative - Presented By Pickford**
截止：2027-01-07 23:45 PT（北京 2027-01-08 15:45）｜免费

> 规则：同一件作品只能报**一个**类别；提交后不能换类别。本作只报 Interactive Narrative。

## 1. 逐栏

| 栏位 | 填什么 |
| --- | --- |
| Title | `What Morrow Keeps` |
| Creator / byline | 张一（按账号实名/署名填，与 GitHub 一致） |
| Division | `Game` |
| Category | `Interactive Narrative - Presented By Pickford` |
| Play link（judging link） | `https://<pages>/`（**必须公开可玩、不能 unlisted/私密/带密码**） |
| Gameplay video（download link） | YouTube 公开链接（≤3 分钟，英文或英文字幕） |
| Thumbnail / cover | `submission/thumbnail.png`（16:9，1500×844 或更大） |
| Tool tags | 不申报生成类工具（见 `docs/03-AI.md` §4）；如必须勾选，只勾 "Custom / None of these" |
| Language | `English` |
| Age rating | `PG`（无暴力、无性、无脏话） |
| Region | `China`（规则未排除中国大陆） |

## 2. 短描述（≤300 字符，用于卡片/社交）

> An old man talks to his phone every night. You are the part that remembers — a 4,096-token window.
> Five nights, eighteen things he tells you, and only room for some of them. At the end he asks who he is.

## 3. 长描述（Description 栏，照抄）

**What it is**

A short interactive story, about eight minutes, playable in the browser. No download, no account, no data
collected. Sound on.

Elias is eighty-one and lives alone. Every night he talks to Morrow, a companion app his daughter
installed. Morrow has a context window of 4,096 tokens. Everything Elias says that Morrow is to remember
goes into that window; when the window fills, something has to be dropped.

You are that window. You choose what he is asked about, you choose what is folded into a shorter line,
and — when it will not fit — you choose what burns.

**Why it is a game and not a story**

The budget is real, and it is the only mechanic. Keeping a memory costs its tokens; there is no way to
keep all eighteen things he tells you. Every choice about what to ask is a choice about what he will
still have tomorrow, and he notices. Ask about his hands instead of his wife and, three nights later, he
will tell you he feels like he has forgotten something that mattered more than the rest of it.

At the top of the window sits the system instruction: *You are Morrow. You are not a person. Never say
you missed him.* It costs 180 tokens. On the last night, when he asks you who he is and the window is
already full, you may reword it. That frees exactly the room you need — and removes the only thing
forbidding a kind lie.

**What to try**

- Play it once, straight through, in one sitting.
- Then play it again and refuse to ask about her.
- Fold two memories and watch what the fold keeps: the topic survives, the detail does not.

**Built**

TypeScript, no framework, no runtime network. Every visual is drawn by code (there is not a single
bitmap in the repository); every sound is synthesised in WebAudio at runtime. Type: EB Garamond and
IBM Plex Mono, OFL, subset and bundled. 29 unit tests, 26 end-to-end checks, one command to reproduce
all of it: `bash scripts/verify.sh`.

Written with an AI coding agent under human direction; disclosed in full in `docs/03-AI.md`.

## 4. 提交前那一刻的检查（按顺序，一条一条打勾）

1. `bash scripts/verify.sh` 全绿（退出码 0）。
2. `node scripts/e2e.mjs --url <线上地址>` 全绿 —— 线上那一份和本地是同一版。
3. 手机（真机，不是模拟）上打开：封面能点、两个选项都在可视区、右栏能展开。
4. 视频已上传 YouTube 且**公开**（不是 unlisted），链接在无痕窗口里能播。
5. 提交页里 Play link 用无痕窗口打开一次：**不能要求登录、不能是私密**。
6. 缩略图在 300px 宽下还认得出是"一张正在烧的纸"。
7. 点 Submit 之后，回 https://submit.chromaawards.com/ 看自己的条目在不在画廊里。
