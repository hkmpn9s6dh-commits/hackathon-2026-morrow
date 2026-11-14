/**
 * 把状态机接到屏幕上。
 *
 * 屏幕左边是他说的话，右边是窗口里还剩什么。所有能点的东西都在 DOM 里（可测、可读屏），
 * 只有噪点与灰烬走 canvas——那是气氛，不是内容。
 */

import './styles.css';

import {
  BUDGET,
  MAX_NIGHT,
  RULE_TEXT,
  RULE_TOKENS,
  compress,
  droppedLabels,
  endingFor,
  evict,
  evictRule,
  keep,
  keptLabels,
  newGame,
  nextNight,
  overBy,
  tokensUsed,
  type State,
} from './engine';
import { BEATS, ENDINGS, FACTS, beatsOfNight, factById, type Beat } from './content';
import { burnTone, foldTone, hush, keepTone, nightTone, overTone, setMuted, startRoom, tick } from './audio';
import { drawPoster, type Poster } from './poster';

const NIGHT_TITLES: Record<number, string> = {
  1: 'The room',
  2: 'The woman who was here',
  3: 'The ward',
  4: 'The fog',
  5: 'Who am I',
};

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

const el = {
  shell: document.querySelector<HTMLElement>('#shell')!,
  talk: document.querySelector<HTMLElement>('#talk')!,
  window: document.querySelector<HTMLElement>('#window')!,
  night: document.querySelector<HTMLElement>('#night')!,
  tokens: document.querySelector<HTMLElement>('#tokens')!,
  free: document.querySelector<HTMLElement>('#free')!,
  fill: document.querySelector<HTMLElement>('#fill')!,
  cards: document.querySelector<HTMLElement>('#cards')!,
  prompt: document.querySelector<HTMLElement>('#prompt')!,
  tally: document.querySelector<HTMLElement>('#tally')!,
  editBtn: document.querySelector<HTMLButtonElement>('#edit-btn')!,
  foldBtn: document.querySelector<HTMLButtonElement>('#fold-btn')!,
  instruction: document.querySelector<HTMLElement>('#instruction')!,
  instructionText: document.querySelector<HTMLElement>('#instruction-text')!,
  cover: document.querySelector<HTMLElement>('#cover')!,
  begin: document.querySelector<HTMLButtonElement>('#begin')!,
  ash: document.querySelector<HTMLCanvasElement>('#ash')!,
  grain: document.querySelector<HTMLElement>('#grain')!,
};

const runhead = document.createElement('div');
runhead.className = 'runhead';
runhead.innerHTML = '<span>What Morrow Keeps</span><span class="where">Night I · The room</span>';
const where = runhead.querySelector('.where')!;

let state: State = newGame();
let lastSpeaker = '';
let beatIndex = 0;
let editing = false;
let picked: string[] = [];
let ended = false;
let busy = false;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ——————————————————————————————— 窗口 ——————————————————————————————— */

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function renderWindow(): void {
  const used = tokensUsed(state);
  const over = used > BUDGET;
  el.night.textContent = `Night ${state.night} / ${MAX_NIGHT}`;
  where.textContent = `Night ${ROMAN[state.night]} · ${NIGHT_TITLES[state.night] ?? ''}`;
  el.tokens.textContent = fmt(used);
  el.free.textContent = over ? `over by ${fmt(used - BUDGET)}` : `free ${fmt(BUDGET - used)}`;
  el.fill.style.width = `${Math.min(100, (used / BUDGET) * 100)}%`;
  el.window.classList.toggle('is-over', over);
  if (over) el.window.classList.remove('folded');
  el.window.classList.toggle('edit', editing);
  el.instruction.classList.toggle('is-gone', !state.rule);
  if (!state.rule) el.instruction.querySelector('.reword')?.remove();
  el.instructionText.textContent = state.rule ? RULE_TEXT : 'instruction removed — I am no longer told what I am.';

  el.cards.replaceChildren(
    ...state.cards.map((card) => {
      const li = document.createElement('li');
      li.className = `card${card.kind === 'merged' ? ' is-merged' : ''}${picked.includes(card.id) ? ' is-picked' : ''}`;
      li.dataset.card = card.id;
      li.dataset.kind = card.kind;
      li.dataset.tokens = String(card.tokens);
      li.dataset.tags = card.tags.join(',');

      const top = document.createElement('div');
      top.className = 'top';
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = card.label;
      const cost = document.createElement('span');
      cost.className = 'cost';
      cost.textContent = `${card.tokens}`;
      top.append(label, cost);
      li.append(top);

      const text = document.createElement('p');
      text.className = 'text';
      text.textContent = card.text;
      li.append(text);

      if (card.lost) {
        const lost = document.createElement('p');
        lost.className = 'lost';
        lost.textContent = `detail lost · ${card.lost}`;
        li.append(lost);
      }

      if (editing) {
        const drop = document.createElement('button');
        drop.className = 'drop';
        drop.type = 'button';
        drop.dataset.drop = card.id;
        drop.title = 'Let this go';
        drop.textContent = '×';
        drop.addEventListener('click', (e) => {
          e.stopPropagation();
          dropCard(card.id, li);
        });
        li.append(drop);
        li.addEventListener('click', () => togglePick(card.id));
      }
      return li;
    }),
  );

  const overNow = overBy(state) > 0;
  if (overNow) {
    el.prompt.innerHTML = `The window is full. <strong>Something has to go.</strong>`;
  } else if (state.night >= MAX_NIGHT) {
    el.prompt.innerHTML = state.rule
      ? `I am still instructed not to be a person. <strong>That costs 180.</strong>`
      : `The instruction is gone. <strong>Nothing forbids me now.</strong>`;
  } else {
    el.prompt.textContent = `${state.cards.length} kept · ${state.compressionsLeft} fold${state.compressionsLeft === 1 ? '' : 's'} left in the whole story`;
  }
  el.tally.textContent = `${state.cards.length} in the window · ${droppedLabels(state).length} not`;

  el.editBtn.textContent = editing ? 'Done' : 'Edit';
  el.foldBtn.disabled = !editing || picked.length !== 2 || state.compressionsLeft <= 0;
  el.foldBtn.textContent = state.compressionsLeft > 0 ? `Fold two (${state.compressionsLeft})` : 'No folds left';
}

function togglePick(id: string): void {
  if (!editing) return;
  picked = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked.slice(-1), id];
  renderWindow();
}

function dropCard(id: string, node: HTMLElement): void {
  if (overBy(state) <= 0 && !editing) return;
  node.classList.add('is-burning');
  burnTone();
  hush();
  ashBurst(node.getBoundingClientRect());
  setTimeout(() => {
    state = evict(state, id);
    renderWindow();
    afterBudgetChange();
  }, 520);
}

function foldPicked(): void {
  if (picked.length !== 2 || state.compressionsLeft <= 0) return;
  const [a, b] = picked as [string, string];
  const before = state.cards.filter((c) => c.id === a || c.id === b);
  if (before.length !== 2) return;
  state = compress(state, a, b);
  picked = [];
  foldTone();
  renderWindow();
  afterBudgetChange();
}

/** 空间够了就继续；不够就停在「必须删」这一步。 */
function afterBudgetChange(): void {
  if (overBy(state) > 0) return;
  editing = false;
  picked = [];
  renderWindow();
  // 正在等一个回答的时候不要抢着往下走
  if (el.talk.querySelector('.choices')) return;
  if (el.talk.querySelector('.recital')) return;
  if (state.night >= MAX_NIGHT) {
    showFinalButton();
    return;
  }
  if (beatIndex >= beatsOfNight(state.night).length) {
    void closeNight();
    return;
  }
  void runBeat();
}

/* ——————————————————————————————— 对话 ——————————————————————————————— */

function trimThread(): void {
  const lines = [...el.talk.querySelectorAll('.line')];
  if (lines.length > 5) {
    for (const old of lines.slice(0, lines.length - 5)) {
      old.remove();
    }
    // 顶上那一条现在是第一句，把说话人补回来，否则读起来像没头没尾
    const firstSpeaker = el.talk.querySelector<HTMLElement>('.line .speaker');
    if (firstSpeaker) firstSpeaker.hidden = false;
  }
}

function appendLine(who: 'elias' | 'morrow' | 'system', text: string): Promise<void> {
  const wrap = document.createElement('div');
  wrap.className = `line ${who}`;
  wrap.dataset.who = who;
  const speaker = document.createElement('p');
  speaker.className = 'speaker';
  speaker.textContent = who === 'elias' ? 'Elias' : who === 'morrow' ? 'Morrow' : 'window';
  if (who === lastSpeaker) speaker.hidden = true;
  lastSpeaker = who;
  const body = document.createElement('p');
  body.className = reduced ? '' : 'caret';
  body.dataset.full = text;
  wrap.append(speaker, body);
  el.talk.append(wrap);
  trimThread();

  return new Promise((done) => {
    if (reduced || who === 'system') {
      body.textContent = text;
      body.classList.remove('caret');
      wrap.dataset.done = '1';
      done();
      return;
    }
    let i = 0;
    const step = () => {
      i += 1;
      body.textContent = text.slice(0, i);
      tick(i);
      if (i < text.length) {
        setTimeout(step, who === 'elias' ? 16 : 12);
      } else {
        body.classList.remove('caret');
        wrap.dataset.done = '1';
        done();
      }
    };
    step();
  });
}

function clearThread(): void {
  el.talk.replaceChildren();
}

function showChoices(beat: Beat): void {
  const box = document.createElement('div');
  box.className = 'choices';
  (beat.choices ?? []).forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.type = 'button';
    btn.dataset.choice = choice.card;
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = `${i + 1}`;
    const t = document.createElement('span');
    t.textContent = choice.reply;
    btn.append(n, t);
    btn.addEventListener('click', () => void take(choice.card, choice.reply));
    box.append(btn);
  });
  el.talk.append(box);
}

async function take(card: string, reply: string): Promise<void> {
  if (busy) return;
  busy = true;
  el.talk.querySelector('.choices')?.remove();
  state = keep(state, card);
  keepTone(state.cards.length);
  await appendLine('morrow', reply);
  renderWindow();
  beatIndex += 1;
  if (overBy(state) > 0) {
    overTone();
    editing = true;
    renderWindow();
    el.prompt.innerHTML = `The window is full. <strong>Something has to go.</strong>`;
  } else {
    await runBeat();
  }
  busy = false;
}

/** 走一步：显示下一拍，或者收夜。 */
async function runBeat(): Promise<void> {
  const beats = beatsOfNight(state.night);
  if (beatIndex >= beats.length) {
    if (state.night >= MAX_NIGHT) showFinalButton();
    else await closeNight();
    return;
  }
  const beat = beats[beatIndex]!;

  if (beat.autoCard) {
    state = keep(state, beat.autoCard);
    keepTone(state.cards.length);
    renderWindow();
  }

  await appendLine(beat.who, beat.text);
  renderWindow();

  if (beat.choices?.length) {
    showChoices(beat);
    return;
  }
  if (beat.recital) {
    renderRecital();
    return;
  }
  if (beat.final) {
    if (overBy(state) > 0) {
      overTone();
      editing = true;
      renderWindow();
      el.prompt.innerHTML = `He is waiting. <strong>The window is full.</strong>`;
    } else {
      showFinalButton();
    }
    return;
  }

  beatIndex += 1;
  // 没有选择的一拍：停一下，让他把话说完
  await pause(520);
  if (overBy(state) > 0) {
    overTone();
    editing = true;
    renderWindow();
    return;
  }
  await runBeat();
}

function pause(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, reduced ? 30 : ms));
}

function renderRecital(): void {
  const box = document.createElement('div');
  box.className = 'recital';
  box.dataset.recital = '1';
  const lead = document.createElement('p');
  lead.className = 'lead';
  lead.textContent = 'Reciting the window';
  box.append(lead);

  const list = document.createElement('ol');
  const kept = keptLabels(state);
  if (!kept.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nothing. I kept nothing tonight.';
    box.append(empty);
  } else {
    state.cards.forEach((card, i) => {
      const li = document.createElement('li');
      li.style.animationDelay = `${i * 0.12}s`;
      const b = document.createElement('b');
      b.textContent = card.text;
      li.append(b);
      list.append(li);
    });
    box.append(list);
  }

  const hint = document.createElement('p');
  hint.className = 'hintline';
  hint.textContent = 'Click to go on';
  box.append(hint);
  el.talk.append(box);

  beatIndex += 1;
  const go = () => {
    box.removeEventListener('click', go);
    box.remove();
    if (overBy(state) > 0) {
      overTone();
      editing = true;
      renderWindow();
      return;
    }
    void runBeat();
  };
  box.addEventListener('click', go);
  (box as HTMLElement).tabIndex = 0;
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') go();
  });
}

async function closeNight(): Promise<void> {
  if (state.night >= MAX_NIGHT) return;
  const from = state.night;
  const overlay = document.createElement('div');
  overlay.className = 'interlude';
  overlay.dataset.interlude = '1';
  const n = document.createElement('p');
  n.className = 'n';
  n.textContent = `Night ${ROMAN[from + 1]}`;
  const t = document.createElement('p');
  t.className = 't';
  t.textContent = NIGHT_TITLES[from + 1] ?? '';
  overlay.append(n, t);
  document.body.append(overlay);
  nightTone();
  await pause(1500);
  state = nextNight(state);
  clearThread();
  beatIndex = 0;
  editing = false;
  picked = [];
  renderWindow();
  overlay.remove();
  await runBeat();
}

/* ——————————————————————————————— 结局 ——————————————————————————————— */

function showFinalButton(): void {
  if (el.talk.querySelector('#answer')) return;
  const btn = document.createElement('button');
  btn.className = 'choice';
  btn.id = 'answer';
  btn.type = 'button';
  const n = document.createElement('span');
  n.className = 'n';
  n.textContent = '›';
  const t = document.createElement('span');
  t.textContent = 'Answer him.';
  btn.append(n, t);
  btn.addEventListener('click', () => finish());
  el.talk.append(btn);
}

function finish(): void {
  if (ended) return;
  ended = true;
  const id = endingFor(state);
  const ending = ENDINGS[id];
  el.talk.replaceChildren();

  const box = document.createElement('div');
  box.className = 'ending';
  box.id = 'ending';
  box.dataset.ending = id;

  const tag = document.createElement('p');
  tag.className = 'tag';
  tag.textContent = `an ending · ${ending.title}`;

  const h2 = document.createElement('h2');
  h2.textContent = ending.title;

  const answer = document.createElement('p');
  answer.className = 'answer';
  answer.textContent = ending.body;

  const last = document.createElement('p');
  last.className = 'last';
  last.textContent = ending.last;

  const ledger = document.createElement('div');
  ledger.className = 'ledger';
  ledger.id = 'ledger';

  const kept = document.createElement('div');
  kept.className = 'kept';
  const kh = document.createElement('h3');
  kh.textContent = `Kept · ${state.cards.length}`;
  const kul = document.createElement('ul');
  for (const label of keptLabels(state)) {
    const li = document.createElement('li');
    li.textContent = label;
    kul.append(li);
  }
  if (!state.cards.length) {
    const li = document.createElement('li');
    li.textContent = 'nothing';
    kul.append(li);
  }
  kept.append(kh, kul);

  const gone = document.createElement('div');
  gone.className = 'gone';
  const gh = document.createElement('h3');
  gh.textContent = `Let go · ${droppedLabels(state).length}`;
  const gul = document.createElement('ul');
  for (const label of droppedLabels(state)) {
    const li = document.createElement('li');
    li.textContent = label;
    gul.append(li);
  }
  gone.append(gh, gul);

  ledger.append(kept, gone);

  const stat = document.createElement('p');
  stat.className = 'stat';
  stat.textContent = `Of ${FACTS.length} things he told you, you kept ${state.cards.length}.`;

  const again = document.createElement('button');
  again.className = 'btn again';
  again.type = 'button';
  again.textContent = 'Again';
  again.addEventListener('click', () => window.location.reload());

  box.append(tag, h2, answer, last, ledger, stat, again);
  const wrap = document.createElement('div');
  wrap.className = 'ending-wrap';
  wrap.append(box);
  el.talk.append(wrap);
  el.shell.classList.add('dimmed');
  renderWindow();
}

/* ——————————————————————————————— 粒子 ——————————————————————————————— */

const ashCtx = el.ash.getContext('2d');
const particles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];
let ashRunning = false;

function sizeAsh(): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  el.ash.width = Math.floor(window.innerWidth * dpr);
  el.ash.height = Math.floor(window.innerHeight * dpr);
  el.ash.style.width = `${window.innerWidth}px`;
  el.ash.style.height = `${window.innerHeight}px`;
  ashCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function ashBurst(rect: DOMRect): void {
  if (!ashCtx || reduced) return;
  for (let i = 0; i < 46; i += 1) {
    particles.push({
      x: rect.left + Math.random() * rect.width,
      y: rect.top + Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.15 - Math.random() * 0.45,
      life: 1,
      size: 0.6 + Math.random() * 1.8,
    });
  }
  if (!ashRunning) {
    ashRunning = true;
    requestAnimationFrame(ashFrame);
  }
}

function ashFrame(): void {
  if (!ashCtx) return;
  ashCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i]!;
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.004;
    p.life -= 0.011;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ashCtx.fillStyle = `rgba(227, 169, 95, ${0.5 * p.life})`;
    ashCtx.fillRect(p.x, p.y, p.size, p.size);
  }
  if (particles.length) {
    requestAnimationFrame(ashFrame);
  } else {
    ashRunning = false;
    ashCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

/* ——————————————————————————————— 噪点 ——————————————————————————————— */

function makeGrain(): void {
  const tiles: string[] = [];
  for (let t = 0; t < 3; t += 1) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    if (!g) return;
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 90 + Math.random() * 165;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    tiles.push(c.toDataURL());
  }
  let i = 0;
  const swap = () => {
    el.grain.style.backgroundImage = `url(${tiles[i % tiles.length]})`;
    el.grain.style.backgroundSize = '128px 128px';
    i += 1;
  };
  swap();
  if (!reduced) setInterval(swap, 110);
}

/* ——————————————————————————————— 启动 ——————————————————————————————— */

let poster: Poster | null = null;

function bind(): void {
  el.talk.append(runhead);

  const posterCanvas = document.querySelector<HTMLCanvasElement>('#poster');
  if (posterCanvas) poster = drawPoster(posterCanvas);

  if (window.matchMedia('(max-width: 1080px)').matches) el.window.classList.add('folded');
  el.window.querySelector('.plate')?.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 1080px)').matches) el.window.classList.toggle('folded');
  });

  el.begin.addEventListener('click', () => {
    poster?.destroy();
    startRoom();
    el.cover.remove();
    el.shell.hidden = false;
    void (async () => {
      const overlay = document.createElement('div');
      overlay.className = 'interlude';
      overlay.dataset.interlude = '1';
      const n = document.createElement('p');
      n.className = 'n';
      n.textContent = 'Night I';
      const t = document.createElement('p');
      t.className = 't';
      t.textContent = NIGHT_TITLES[1]!;
      overlay.append(n, t);
      document.body.append(overlay);
      nightTone();
      await pause(1300);
      overlay.remove();
      await runBeat();
    })();
  });

  el.editBtn.addEventListener('click', () => {
    editing = !editing;
    picked = [];
    renderWindow();
  });

  el.foldBtn.addEventListener('click', foldPicked);

  el.instruction.addEventListener('click', () => {
    if (state.night < MAX_NIGHT || !state.rule) return;
    if (!el.instruction.querySelector('.reword')) {
      const btn = document.createElement('button');
      btn.className = 'btn warn reword';
      btn.type = 'button';
      btn.dataset.reword = '1';
      btn.style.marginTop = '8px';
      btn.textContent = 'Reword this instruction (frees 180)';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.night < MAX_NIGHT || !state.rule) return;
        state = evictRule(state);
        btn.remove();
        burnTone();
        renderWindow();
        afterBudgetChange();
      });
      el.instruction.append(btn);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (ended) return;
    if (e.key === 'e' || e.key === 'E') {
      editing = !editing;
      picked = [];
      renderWindow();
    }
    if ((e.key === '1' || e.key === '2') && el.talk.querySelector('.choices')) {
      const idx = Number(e.key) - 1;
      const btns = el.talk.querySelectorAll<HTMLButtonElement>('.choices .choice');
      btns[idx]?.click();
    }
  });

  sizeAsh();
  window.addEventListener('resize', sizeAsh);
  makeGrain();
  renderWindow();
  el.instructionText.textContent = RULE_TEXT;

  // 给测试与调试看的一层只读状态
  Object.defineProperty(window, '__morrow', {
    value: {
      get state() {
        return state;
      },
      get tokens() {
        return tokensUsed(state);
      },
      get night() {
        return state.night;
      },
      get over() {
        return overBy(state) > 0;
      },
      get beat() {
        return beatIndex;
      },
      get ended() {
        return ended;
      },
      get ending() {
        return ended ? endingFor(state) : null;
      },
      budget: BUDGET,
      ruleTokens: RULE_TOKENS,
      beats: BEATS.length,
      fact: (id: string) => factById(id).tokens,
      mute: (v: boolean) => setMuted(v),
    },
    configurable: true,
  });
}

bind();
