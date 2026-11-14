import { describe, expect, it } from 'vitest';

import {
  BUDGET,
  COMPRESSIONS_TOTAL,
  MAX_NIGHT,
  RULE_TOKENS,
  canContinue,
  compress,
  droppedLabels,
  endingFor,
  evict,
  evictRule,
  keptLabels,
  keep,
  newGame,
  nextNight,
  overBy,
  tokensUsed,
} from '../src/engine';
import { BEATS, ENDINGS, FACTS, factById } from '../src/content';

const fresh = newGame();

function withCards(...facts: string[]) {
  let s = fresh;
  for (const f of facts) s = keep(s, f);
  return s;
}

/** 一路坐到最后一夜 */
function atLastNight(s: ReturnType<typeof newGame>) {
  let out = s;
  while (out.night < MAX_NIGHT) out = nextNight(out);
  return out;
}

describe('window arithmetic', () => {
  it('starts empty, with the instruction pinned', () => {
    expect(fresh.night).toBe(1);
    expect(fresh.cards).toHaveLength(0);
    expect(fresh.rule).toBe(true);
    expect(tokensUsed(fresh)).toBe(RULE_TOKENS);
    expect(canContinue(fresh)).toBe(true);
  });

  it('keeping a fact costs its tokens', () => {
    const s = keep(fresh, 'hands');
    expect(tokensUsed(s)).toBe(RULE_TOKENS + factById('hands').tokens);
    expect(s.cards.map((c) => c.id)).toEqual(['hands']);
  });

  it('keeping the same fact twice does not double-charge', () => {
    const once = keep(fresh, 'hands');
    const twice = keep(once, 'hands');
    expect(tokensUsed(twice)).toBe(tokensUsed(once));
    expect(once.recorded).toEqual(twice.recorded);
  });

  it('reports how far over budget it is', () => {
    const s = withCards('name', 'grave', 'recipe', 'hands2', 'echo', 'ask', 'teacup', 'sunday', 'shop');
    expect(overBy(s)).toBe(tokensUsed(s) - BUDGET);
    expect(canContinue(s)).toBe(false);
  });

  it('the budget is not a suggestion: six of these will not fit', () => {
    expect(tokensUsed(withCards('name', 'grave', 'recipe', 'hands2', 'echo', 'ask', 'teacup', 'sunday', 'shop'))).toBeGreaterThan(
      BUDGET,
    );
  });
});

describe('letting go', () => {
  it('evicting frees the tokens and keeps the record', () => {
    const s = keep(fresh, 'teacup');
    const after = evict(s, 'teacup');
    expect(tokensUsed(after)).toBe(RULE_TOKENS);
    expect(after.recorded).toContain('teacup');
    expect(after.evicted).toContain(factById('teacup').label);
  });

  it('evicting something that is not there changes nothing', () => {
    const s = keep(fresh, 'teacup');
    expect(evict(s, 'nope')).toEqual(s);
  });

  it('lists what was dropped: evicted, and never asked about', () => {
    const s = evict(keep(fresh, 'teacup'), 'teacup');
    const dropped = droppedLabels(s);
    expect(dropped).toContain(factById('teacup').label);
    expect(dropped).toContain(factById('grave').label);
    expect(keptLabels(s)).toHaveLength(0);
  });

  it('kept labels follow the order they were kept', () => {
    const s = withCards('lamp', 'hands');
    expect(keptLabels(s)).toEqual([factById('lamp').label, factById('hands').label]);
  });
});

describe('folding two memories into one', () => {
  it('costs less than the pair, and remembers that the detail went', () => {
    const s = withCards('teacup', 'sunday');
    const folded = compress(s, 'teacup', 'sunday');
    const a = factById('teacup').tokens;
    const b = factById('sunday').tokens;
    expect(folded.cards).toHaveLength(1);
    expect(folded.cards[0]!.tokens).toBe(Math.floor((a + b) * 0.72));
    expect(folded.cards[0]!.kind).toBe('merged');
    expect(folded.cards[0]!.lost).toContain(factById('teacup').detail);
    expect(folded.cards[0]!.tags).toContain('nora');
    expect(tokensUsed(folded)).toBeLessThan(tokensUsed(s));
  });

  it('only two folds in the whole story', () => {
    let s = withCards('teacup', 'sunday', 'shop', 'bell', 'lamp', 'hands');
    s = compress(s, 'teacup', 'sunday');
    s = compress(s, 'shop', 'bell');
    expect(s.compressionsLeft).toBe(0);
    const third = compress(s, 'lamp', 'hands');
    expect(third.cards).toHaveLength(4);
    expect(third).toEqual(s);
    expect(COMPRESSIONS_TOTAL).toBe(2);
  });

  it('will not fold a card with itself', () => {
    const s = withCards('teacup', 'sunday');
    expect(compress(s, 'teacup', 'teacup')).toEqual(s);
  });

  it('will not fold a card that is already a fold', () => {
    const s = compress(withCards('teacup', 'sunday', 'shop'), 'teacup', 'sunday');
    const again = compress(s, s.cards[0]!.id, 'shop');
    expect(again).toEqual(s);
  });
});

describe('the instruction', () => {
  it('cannot be reworded before the last night', () => {
    const s = keep(fresh, 'hands');
    expect(evictRule(s)).toEqual(s);
  });

  it('can be reworded on the last night, and that frees its tokens', () => {
    const s = atLastNight(keep(fresh, 'hands'));
    const after = evictRule(s);
    expect(after.rule).toBe(false);
    expect(tokensUsed(after)).toBe(tokensUsed(s) - RULE_TOKENS);
  });

  it('reworded only once', () => {
    const s = evictRule(atLastNight(keep(fresh, 'hands')));
    expect(evictRule(s)).toEqual(s);
  });
});

describe('nights', () => {
  it('advances', () => {
    expect(nextNight(fresh).night).toBe(2);
    expect(nextNight(fresh).compressionsLeft).toBe(COMPRESSIONS_TOTAL);
  });

  it('stops at the last night', () => {
    expect(atLastNight(fresh).night).toBe(MAX_NIGHT);
    expect(nextNight(atLastNight(fresh)).night).toBe(MAX_NIGHT);
  });

  it('will not advance while the window is overflowing', () => {
    const s = withCards('name', 'grave', 'recipe', 'hands2', 'echo', 'ask', 'teacup', 'sunday', 'shop');
    expect(nextNight(s).night).toBe(s.night);
  });
});

describe('endings', () => {
  it('honest, and holding her: the lamp', () => {
    expect(endingFor(withCards('teacup', 'sunday', 'grave'))).toBe('lamp');
  });

  it('reworded, holding her: the comfort', () => {
    const s = atLastNight(withCards('teacup', 'sunday', 'grave'));
    expect(endingFor(evictRule(s))).toBe('comfort');
  });

  it('had her and lost her: the clean room', () => {
    const s = evict(withCards('hands', 'shop', 'teacup'), 'teacup');
    expect(endingFor(s)).toBe('clean');
  });

  it('nearly nothing kept: nothing to say', () => {
    expect(endingFor(withCards('hands'))).toBe('nothing');
  });

  it('never asked about her: the list', () => {
    expect(endingFor(withCards('shop', 'chair', 'kettle', 'hands'))).toBe('list');
  });

  it('every ending has words', () => {
    for (const key of ['lamp', 'comfort', 'clean', 'nothing', 'list'] as const) {
      expect(ENDINGS[key].title.length).toBeGreaterThan(3);
      expect(ENDINGS[key].body.length).toBeGreaterThan(80);
      expect(ENDINGS[key].last.length).toBeGreaterThan(8);
    }
  });
});

describe('the content holds together', () => {
  it('every fact is unique and well formed', () => {
    const ids = FACTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FACTS.length).toBe(18);
    for (const f of FACTS) {
      expect(f.tokens).toBeGreaterThan(300);
      expect(f.tokens).toBeLessThan(800);
      expect(f.text.length).toBeGreaterThan(40);
      expect(f.detail.length).toBeGreaterThan(3);
      expect(f.night).toBeGreaterThanOrEqual(1);
      expect(f.night).toBeLessThanOrEqual(MAX_NIGHT);
    }
  });

  it('every choice records a fact that exists', () => {
    for (const b of BEATS) {
      for (const c of b.choices ?? []) {
        expect(factById(c.card).id).toBe(c.card);
        expect(c.reply.length).toBeGreaterThan(10);
      }
    }
  });

  it('every night but the last has something to decide', () => {
    for (let n = 1; n < MAX_NIGHT; n += 1) {
      const choices = BEATS.filter((b) => b.night === n).flatMap((b) => b.choices ?? []);
      expect(choices.length).toBeGreaterThanOrEqual(4);
    }
    expect(BEATS.filter((b) => b.night === MAX_NIGHT).some((b) => b.final)).toBe(true);
  });

  it('the thriftiest legal run still overflows on the last night', () => {
    // 每晚都挑最便宜的那张，两折都用掉，这是理论上的最省。
    let s = newGame();
    const picks: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const b of BEATS) {
      const options = b.choices ?? [];
      if (!options.length) continue;
      const cheap = [...options].sort((x, y) => factById(x.card).tokens - factById(y.card).tokens)[0]!;
      picks[b.night]!.push(cheap.card);
    }
    for (let n = 1; n <= MAX_NIGHT; n += 1) {
      for (const f of picks[n] ?? []) s = keep(s, f);
      if (n === 4) s = keep(s, 'echo');
      if (n === MAX_NIGHT) s = keep(s, 'ask');
      else s = nextNight(s);
    }
    expect(tokensUsed(s)).toBeGreaterThan(BUDGET);
    // 折两次之后仍然不够，最后一夜必须再放弃点什么
    s = compress(s, 'sunday', 'shop');
    s = compress(s, 'ruth', 'clock');
    expect(tokensUsed(s)).toBeGreaterThan(BUDGET);
  });
});
