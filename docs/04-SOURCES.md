# 04 — SOURCES（选赛、规则、尺子的原文出处）

抓取时间：2026-11-14（北京）。所有引文原文照抄，未改写。

## 1. 赛事

| 项 | 原文 / 出处 |
| --- | --- |
| 赛事主页 | https://chromaawards.com/ ｜「The Chroma Awards — World's Largest AI Film & Media Competition。Incubated by ElevenLabs」 |
| Game 分区定义 | https://chromaawards.com/prizes#divisions ｜「**Game** — Build your world - web based games and experiences」，Prize Total **$20,500** |
| 目标类别 | https://chromaawards.com/prizes/game-interactive-narrative-presented-by-pickford ｜「**Interactive Narrative - Presented By Pickford**」，1st $2,000 + Pickford Grand Prize / 2nd $1,000 / 3rd $500 |
| 类别规则 | 同上，「**Story & Choice:** Center story-driven experiences with character, dialogue, and meaningful choices. **Player Agency:** Show how player decisions shape the narrative and emotional impact. **Craft & Technical Execution:** Judged on game feel, mechanics, art direction, audio, and overall polish.」 |
| 技术要求 | 同上，「**Platform:** Playable on web without requiring a download」「**Language:** … must be in English or include English subtitles for judging」「**Judging Link:** … publicly accessible, not unlisted, private, nor password protected」「**Download Link:** Must include a download link a gameplay video of the game」 |
| 资格 | 同上，「Submitter must be over 18 and from a non-sanction country」；FAQ：「Residents of Russia, or of any country … subject to comprehensive OFAC sanctions (including Cuba, Iran, North Korea, Syria, and the annexed regions of Ukraine) are not eligible」——**中国大陆不在排除名单** |
| 免费 | FAQ：「There is no entry fee to participate.」 |
| 截止 | FAQ：「Submissions open Monday, October 19th, 2026 (12:00pm Pacific Time) and close **January 7th, 2027 (11:45pm Pacific Time)**」＝北京 2027-01-08 15:45 |
| 公布 | FAQ：「Winners will be announced on or around Thursday, February 11th, 2027 (10:00pm Pacific Time)」 |
| 判分 | FAQ：「scored from 1-10 on four equally weighted criteria: **Theme & Division Purpose (25%), Creativity & AI Innovation (25%), Craft & Technical Polish (25%), and Sound & Emotional Impact (25%)**」 |
| 赛程 | FAQ：「Preliminary Judging (a pass/fail check plus a 1-10 score), Qualifiers (**top 66% per category** advance), Quarter Finals (**top 50** per category advance), Semi-Finals (**top 22** per category advance), and Finals」 |
| 原创与 IP | FAQ：「**Can I use IP that I don't own?** … No」「**Can I use music I don't own…** … Original music you created / licensed / … / Music generated entirely by AI」 |
| 一稿一类 | 类别页：「Submission: Can only be submitted once to a single category」 |

## 2. 尺子（往届得奖/入围作，缩略图存 `proof/gate-d/rulers/`）

来自官方作品库 https://watch.chromaawards.com/ （页头：「Chroma Awards 2025 — Winners and Finalists — Explore over 300 projects」）。
Games 分区共 9 件，本作取其中 5 件**亲眼看过缩略图**的作尺子（编号沿用 `01-UI.md`）：

| # | 作品 | 作者 | 类别 | 作品页 |
| --- | --- | --- | --- | --- |
| R1 | The Dream | 404-GEN, Erno Forsstrom, Ivan Lehusha | Games - Interactive Narrative & Choose Your Own Adventure | https://watch.chromaawards.com/submission/38fb4a63-8cc3-423d-8fea-0cd568489795 |
| R2 | GENESIS / INTERFACE | Cream Team / Bardia Shahrestani | Games - Interactive Narrative & Choose Your Own Adventure | https://watch.chromaawards.com/submission/b2b471c1-c3be-4968-9eff-38467b9bb981 |
| R3 | Vibe Survivor（带奖章） | VibeCreAI | Games - Fighting & Shooter | https://watch.chromaawards.com/submission/5e5fd770-661d-4cb7-9600-078d39b9fe00 |
| R4 | GAME RUSH | Kenneth Roxas | Games - Experimental & Open Format | https://watch.chromaawards.com/submission/7f387cec-7954-458d-82a6-6ac1251fe4c2 |
| R5 | BlokAIsia — AI City Builder | Theo Lee | Games - Simulation & Sandbox | https://watch.chromaawards.com/submission/49ebeb1e-8466-43b3-b4ea-e58083760a73 |

另 4 件（PAREHO、TRAVELLER、Whatify World、Chrono-Critters 1.0）缩略图也一并下载，留给盲排备用。

## 3. 字体

- EB Garamond — Copyright The EB Garamond Project Authors，**SIL Open Font License 1.1**（`src/assets/OFL-garamond.txt`）。
- IBM Plex Mono — Copyright IBM Corp.，**SIL Open Font License 1.1**（`src/assets/OFL-plex.txt`）。
- 只取 latin 子集 woff2（400/400i/500、300/400），随包发布，运行时不联网取字。

## 4. 本机可复现性（写给人看，不用来交件）

- `google.com`/`firebase` 系直连 000、`github.com:443` 直连 000 —— 本机走 `127.0.0.1:7897` 代理才能通；
  部署走 `gh`（api.github.com 直连可用）。这与作品本身无关：作品零外部依赖。
