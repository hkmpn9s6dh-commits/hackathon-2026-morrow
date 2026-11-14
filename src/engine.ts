/**
 * 纯状态机：窗口的大小、留什么、丢什么、最后是谁。
 *
 * 这一层不碰 DOM，也不发音。它只回答三个问题：
 *   现在还剩多少 token？这一步合不合法？照现在这样，他会听到哪一种结局？
 */

import { FACTS, factById, type EndingId, type Fact } from './content';

/** 窗口的大小。 */
export const BUDGET = 4096;
/** 系统指令占掉的 token。它也是一张卡片，最后一夜可以改。 */
export const RULE_TOKENS = 180;
export const MAX_NIGHT = 5;
/** 整段故事里只允许折两次。 */
export const COMPRESSIONS_TOTAL = 2;
/** 两张折成一张之后，剩下的分量（细节就没了）。 */
export const MERGE_RATIO = 0.72;

export const RULE_TEXT =
  'You are Morrow, a companion. You are not a person. You have no body, no past and no feelings. Never say you missed him.';

export interface MemoryCard {
  id: string;
  kind: 'fact' | 'merged';
  label: string;
  text: string;
  tokens: number;
  tags: string[];
  /** 这张卡片自己带着的那个细节；折起来就没收 */
  detail: string;
  /** 折起来的时候丢掉的那个细节 */
  lost: string | null;
  /** 由哪几张折成 */
  from: string[];
}

export interface State {
  night: number;
  cards: MemoryCard[];
  rule: boolean;
  compressionsLeft: number;
  /** 曾经写进过窗口的（用来区分「没问过」和「问过又丢了」） */
  recorded: string[];
  /** 被删掉的卡片标签 */
  evicted: string[];
  finished: boolean;
}

function cardFromFact(f: Fact): MemoryCard {
  return {
    id: f.id,
    kind: 'fact',
    label: f.label,
    text: f.text,
    tokens: f.tokens,
    tags: [...f.tags],
    detail: f.detail,
    lost: null,
    from: [f.id],
  };
}

export function newGame(): State {
  return {
    night: 1,
    cards: [],
    rule: true,
    compressionsLeft: COMPRESSIONS_TOTAL,
    recorded: [],
    evicted: [],
    finished: false,
  };
}

export function tokensUsed(s: State): number {
  return (s.rule ? RULE_TOKENS : 0) + s.cards.reduce((sum, c) => sum + c.tokens, 0);
}

export function overBy(s: State): number {
  return tokensUsed(s) - BUDGET;
}

export function canContinue(s: State): boolean {
  return overBy(s) <= 0;
}

export function cardById(s: State, id: string): MemoryCard | undefined {
  return s.cards.find((c) => c.id === id);
}

/** 把一张记进窗口。已经记过就原样返回（幂等）。 */
export function keep(s: State, factId: string): State {
  if (s.recorded.includes(factId)) return s;
  const card = cardFromFact(factById(factId));
  return {
    ...s,
    cards: [...s.cards, card],
    recorded: [...s.recorded, factId],
  };
}

/** 删掉一张。删过的东西记在 evicted 里，结尾要逐条列出来。 */
export function evict(s: State, cardId: string): State {
  const card = cardById(s, cardId);
  if (!card) return s;
  return {
    ...s,
    cards: s.cards.filter((c) => c.id !== cardId),
    evicted: [...s.evicted, card.label],
  };
}

/** 两张折成一张：省下位置，丢掉细节。 */
export function compress(s: State, aId: string, bId: string): State {
  if (aId === bId) return s;
  if (s.compressionsLeft <= 0) return s;
  const a = cardById(s, aId);
  const b = cardById(s, bId);
  if (!a || !b) return s;
  if (a.kind !== 'fact' || b.kind !== 'fact') return s;
  const merged: MemoryCard = {
    id: `fold-${a.id}-${b.id}`,
    kind: 'merged',
    label: `${a.label} · ${b.label}`,
    text: `${a.label}. ${b.label}. The particulars have gone soft.`,
    tokens: Math.floor((a.tokens + b.tokens) * MERGE_RATIO),
    tags: Array.from(new Set([...a.tags, ...b.tags])),
    detail: '',
    lost: `${a.detail}, ${b.detail}`,
    from: [...a.from, ...b.from],
  };
  return {
    ...s,
    cards: [...s.cards.filter((c) => c.id !== aId && c.id !== bId), merged],
    compressionsLeft: s.compressionsLeft - 1,
  };
}

/** 改掉自己的指令。只有最后一夜能改。 */
export function evictRule(s: State): State {
  if (s.night < MAX_NIGHT || !s.rule) return s;
  return { ...s, rule: false, evicted: [...s.evicted, 'the instruction'] };
}

export function nextNight(s: State): State {
  if (!canContinue(s)) return s;
  if (s.night >= MAX_NIGHT) return { ...s, finished: true };
  return { ...s, night: s.night + 1 };
}

export function keptLabels(s: State): string[] {
  return s.cards.map((c) => c.label);
}

/** 结尾那张单子：删掉的，和从没问过的。 */
export function droppedLabels(s: State): string[] {
  const kept = new Set(s.cards.flatMap((c) => c.from));
  const never = FACTS.filter((f) => !s.recorded.includes(f.id) && !kept.has(f.id)).map((f) => f.label);
  return [...s.evicted, ...never];
}

export function noraCount(s: State): number {
  return s.cards.filter((c) => c.tags.includes('nora')).length;
}

export function endingFor(s: State): EndingId {
  const nora = noraCount(s);
  const hadHer = s.recorded.some((id) => factById(id).tags.includes('nora'));
  if (s.cards.length <= 1) return 'nothing';
  if (nora > 0) return s.rule ? 'lamp' : 'comfort';
  if (hadHer) return 'clean';
  return 'list';
}
