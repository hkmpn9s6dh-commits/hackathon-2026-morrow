# What Morrow Keeps

An interactive short story for the browser. You are the part of an old man's phone that remembers.

> Elias is eighty-one. Every night he talks to a companion app called Morrow. Morrow's context window
> holds 4,096 tokens. When it fills, something has to go — and you are the one who decides what.

Five nights, eighteen things he tells you, two folds, one last question: *tell me who I am.*

**Chroma Awards Season 2 — Game division, Interactive Narrative (Presented by Pickford).**

- Play: `npm ci && npm run build && npm run preview` → http://localhost:4321
- Built page: `dist/` (open it with any static server; no runtime network, no data collection)
- About 8 minutes, English, sound on, headphones.

## What it is, mechanically

The window is a real budget. Every memory is a card with a token cost. Keeping is free, but the window
is finite:

- **Keep** — ask about something and it is written down. You cannot ask about everything.
- **Fold** — collapse two memories into one line. It costs less, and the detail is gone. Twice per story.
- **Let go** — delete a card. It burns. The tokens come back; the memory does not.
- **The instruction** — 180 tokens at the top, telling Morrow it is not a person. On the last night you
  may reword it. That frees the 180 — and removes the only thing that forbids a kind lie.

Five endings, decided by what is still in the window and whether the instruction survived.

## Run it

```bash
npm ci
npm run dev        # author mode
npm run build      # dist/
npm run preview    # static server on :4321
```

Node 20.19+ (Vite 8). No environment variables, no keys, no external services.

## Prove it

```bash
bash scripts/verify.sh
```

That is one command from a fresh clone to "this is what the judges will see". It runs:

| Step | What it proves |
| --- | --- |
| `tsc --noEmit` | types hold |
| `vitest run` | 29 unit tests: window arithmetic, keep / fold / evict, overflow blocking, five endings, content integrity, and that even the thriftiest legal run still overflows |
| `vite build` | it builds, under 2 MB, fonts bundled |
| `node scripts/e2e.mjs` | 26 checks in real Chromium, desktop + phone, two different playthroughs, no external requests, no console errors |
| `node scripts/measure-ui.mjs` | font sizes, contrast, hit targets, no clipping, no horizontal scroll → `proof/ui/report.md` |
| hygiene | no TODO, no external URLs, no secrets, no bitmaps, no CJK in the built page |

Single tests: `npm test`. Recorded evidence lives in `docs/02-PROOF.md`.

## Layout

```
index.html            one page, no framework
src/engine.ts         the whole state machine (pure, no DOM)
src/content.ts        the writing: 18 memories, 5 nights of beats, 5 endings
src/main.ts           wiring: beats, choices, editing, recital, ending
src/poster.ts         the burning card on the cover (canvas, procedural)
src/audio.ts          all sound, synthesised with WebAudio — no audio files
src/styles.css        lamp + ledger
test/engine.test.ts   29 unit tests
scripts/              verify.sh, e2e.mjs, measure-ui.mjs, shot.mjs, serve.mjs
docs/                 00-SPEC 01-UI 02-PROOF 03-AI 04-SOURCES 05-SUBMISSION
proof/                UI measurement report, gate-D blind ranking, ruler thumbnails
```

## Credits

- Text, code, art direction: written with an AI coding agent (WorkBuddy, DeepSeek V4.1 Flash) under
  human direction. See `docs/03-AI.md` for exactly what was generated and how.
- Type: EB Garamond and IBM Plex Mono, both SIL Open Font License 1.1, subset bundled in `src/assets/`
  (licences next to the files). No system font is required.
- No third-party images, music, footage, or likenesses. Every pixel is drawn by code and every sound is
  synthesised at runtime.
- Licence: MIT (see `LICENSE`).
