/**
 * 文案。一个人、一台机器、五个晚上。
 *
 * 一条规矩：Elias 说的话必须是具体的、能摸到的东西（灯、杯子、铃、铰链）。
 * 抽象的话留给 Morrow，因为它只能那样说话。
 */

export interface Fact {
  id: string;
  /** 卡片上的短名，3–5 个词 */
  label: string;
  /** 被记住的那一句 */
  text: string;
  tokens: number;
  /** 折起来时会丢掉的那个细节 */
  detail: string;
  tags: string[];
  night: number;
}

export interface Choice {
  /** Morrow 的回答 */
  reply: string;
  /** 记下来的那一张 */
  card: string;
}

export interface Beat {
  id: string;
  night: number;
  who: 'elias' | 'morrow' | 'system';
  text: string;
  choices?: Choice[];
  /** 不经过选择就写进窗口的一张 */
  autoCard?: string;
  /** 停下来，把窗口里的东西念一遍 */
  recital?: boolean;
  /** 最后一个问题 */
  final?: boolean;
}

export type EndingId = 'lamp' | 'comfort' | 'clean' | 'nothing' | 'list';

export const FACTS: Fact[] = [
  // 第一夜 · 房间
  {
    id: 'hands',
    label: 'the hands',
    text: 'He could feel a burr in a mainspring with his thumbnail before he could see it.',
    tokens: 470,
    detail: 'the thumbnail',
    tags: ['self', 'shop'],
    night: 1,
  },
  {
    id: 'lamp',
    label: 'the brass lamp',
    text: 'A brass lamp with a green glass shade. He keeps it low so the street cannot see in.',
    tokens: 440,
    detail: 'green glass',
    tags: ['room'],
    night: 1,
  },
  {
    id: 'chair',
    label: 'his father’s chair',
    text: 'The chair by the window was his father’s. The left arm is worn pale where a hand rested.',
    tokens: 460,
    detail: 'the left arm',
    tags: ['self'],
    night: 1,
  },
  {
    id: 'kettle',
    label: 'one cup, four o’clock',
    text: 'He boils one cup and never two. The kettle whistles at four in the afternoon.',
    tokens: 430,
    detail: 'four o’clock',
    tags: ['self', 'room'],
    night: 1,
  },

  // 第二夜 · 她
  {
    id: 'teacup',
    label: 'the blue cup',
    text: 'A blue teacup with a mended handle. Nora drank from it every morning for forty years.',
    tokens: 510,
    detail: 'the mended handle',
    tags: ['nora'],
    night: 2,
  },
  {
    id: 'sunday',
    label: 'a little flat',
    text: 'Nora sang while she worked, always a little flat, and never the whole song.',
    tokens: 490,
    detail: 'never the whole song',
    tags: ['nora'],
    night: 2,
  },
  {
    id: 'shop',
    label: 'Cinder Street',
    text: 'The shop on Cinder Street. He repaired clocks there for forty-one years.',
    tokens: 480,
    detail: 'forty-one years',
    tags: ['shop'],
    night: 2,
  },
  {
    id: 'bell',
    label: 'the shop bell',
    text: 'The shop bell had two notes. He could tell a customer from a courier by the second one.',
    tokens: 500,
    detail: 'the second note',
    tags: ['shop'],
    night: 2,
  },

  // 第三夜 · 那件事
  {
    id: 'hospital',
    label: 'the ward was bright',
    text: 'The last thing Nora said was that the ward was too bright, and could someone lower it.',
    tokens: 520,
    detail: 'someone lower it',
    tags: ['nora'],
    night: 3,
  },
  {
    id: 'ruth',
    label: 'Ruth on Sundays',
    text: 'Ruth calls on Sundays. She has his hands and her mother’s temper.',
    tokens: 470,
    detail: 'her mother’s temper',
    tags: ['ruth', 'nora'],
    night: 3,
  },
  {
    id: 'grave',
    label: 'the hill he avoids',
    text: 'He has not been up to the cemetery since spring. He talks to her at the window instead.',
    tokens: 540,
    detail: 'since spring',
    tags: ['nora'],
    night: 3,
  },
  {
    id: 'clock',
    label: 'the hall clock',
    text: 'There is a clock in the hall he has not wound since March. It is not broken.',
    tokens: 480,
    detail: 'it is not broken',
    tags: ['nora', 'room'],
    night: 3,
  },

  // 第四夜 · 雾
  {
    id: 'name',
    label: 'her name',
    text: 'Her name is Nora. He says it twice, the way you check a door is locked.',
    tokens: 600,
    detail: 'Nora',
    tags: ['nora'],
    night: 4,
  },
  {
    id: 'street',
    label: 'the shop is gone',
    text: 'Cinder Street is a phone repair counter now. The bell is not there.',
    tokens: 480,
    detail: 'the bell',
    tags: ['shop'],
    night: 4,
  },
  {
    id: 'recipe',
    label: 'too much salt',
    text: 'She put too much salt in everything and he never once told her.',
    tokens: 520,
    detail: 'never once',
    tags: ['nora'],
    night: 4,
  },
  {
    id: 'hands2',
    label: 'the knowing went',
    text: 'He cannot feel the burr any more. His hands are steady; the knowing is what left.',
    tokens: 510,
    detail: 'steady',
    tags: ['self', 'shop'],
    night: 4,
  },
  {
    id: 'echo',
    label: 'said again, in order',
    text: 'The cup, the ward, the name — said again in the same order, and stored as received.',
    tokens: 500,
    detail: 'the order',
    tags: ['self'],
    night: 4,
  },

  // 第五夜 · 我是谁
  {
    id: 'ask',
    label: 'tell me who I am',
    text: 'He asks who he is, of the only thing that was in the room every night.',
    tokens: 760,
    detail: 'every night',
    tags: ['self'],
    night: 5,
  },
] as const;

export const BEATS: Beat[] = [
  // ——— Night 1
  {
    id: 'n1-1',
    night: 1,
    who: 'elias',
    text: 'Is this the thing my daughter put on the phone? It has a name on it. Morrow.',
  },
  {
    id: 'n1-2',
    night: 1,
    who: 'morrow',
    text: 'Yes. I’m Morrow. Tell me things and I’ll keep them, so you don’t have to hold all of it.',
  },
  {
    id: 'n1-3',
    night: 1,
    who: 'elias',
    text: 'That’s a strange thing to offer a man my age.',
    choices: [
      { reply: 'Then start with your hands.', card: 'hands' },
      { reply: 'Then start with the room.', card: 'lamp' },
    ],
  },
  {
    id: 'n1-4',
    night: 1,
    who: 'elias',
    text: 'It’s late. Ruth says I shouldn’t sit up past eleven, and here I am, talking to a lamp.',
    choices: [
      { reply: 'What keeps you up?', card: 'chair' },
      { reply: 'What do you do last, before bed?', card: 'kettle' },
    ],
  },
  { id: 'n1-5', night: 1, who: 'morrow', text: 'Here is what I have.', recital: true },
  {
    id: 'n1-6',
    night: 1,
    who: 'elias',
    text: 'You say it back like that, and it sounds like it happened to somebody else.',
  },

  // ——— Night 2
  {
    id: 'n2-1',
    night: 2,
    who: 'elias',
    text: 'There was a woman in this room for forty years.',
  },
  {
    id: 'n2-2',
    night: 2,
    who: 'elias',
    text: 'I’m not going to say her name tonight. I want to see what you keep without it.',
    choices: [
      { reply: 'Tell me about the mornings.', card: 'teacup' },
      { reply: 'Tell me what she sounded like.', card: 'sunday' },
    ],
  },
  {
    id: 'n2-3',
    night: 2,
    who: 'elias',
    text: 'I had a trade, before my hands went quiet.',
    choices: [
      { reply: 'Where was the shop?', card: 'shop' },
      { reply: 'Was there a bell on the door?', card: 'bell' },
    ],
  },
  { id: 'n2-4', night: 2, who: 'morrow', text: 'Here is what I have.', recital: true },
  {
    id: 'n2-5',
    night: 2,
    who: 'elias',
    text: 'You left something out. That’s all right. I leave things out too.',
  },

  // ——— Night 3
  {
    id: 'n3-1',
    night: 3,
    who: 'elias',
    text: 'The ward was bright. She said that. The ward is too bright, Elias.',
  },
  {
    id: 'n3-2',
    night: 3,
    who: 'elias',
    text: 'And then she said something else, and I was looking at the curtain.',
    choices: [
      { reply: 'What else did she say?', card: 'hospital' },
      { reply: 'Who else was in the room?', card: 'ruth' },
    ],
  },
  {
    id: 'n3-3',
    night: 3,
    who: 'elias',
    text: 'I don’t go up to the hill. I talk to her at the window instead.',
    choices: [
      { reply: 'What do you say to her?', card: 'grave' },
      { reply: 'Is anything of hers still running in this house?', card: 'clock' },
    ],
  },
  { id: 'n3-4', night: 3, who: 'morrow', text: 'Here is what I have.', recital: true },
  {
    id: 'n3-5',
    night: 3,
    who: 'elias',
    text: 'Forty years, and I can’t remember what she took in her tea.',
  },

  // ——— Night 4
  {
    id: 'n4-1',
    night: 4,
    who: 'elias',
    text: 'I’m going to say something and you tell me if it’s true. I had a wife.',
  },
  {
    id: 'n4-2',
    night: 4,
    who: 'elias',
    text: 'I know I had one. I can feel the shape of it. The name is the part that goes.',
    choices: [
      { reply: 'Her name is Nora.', card: 'name' },
      { reply: 'You had a shop on Cinder Street.', card: 'street' },
    ],
  },
  {
    id: 'n4-3',
    night: 4,
    who: 'elias',
    text: 'Everything I say tonight, I’ve said before. I can hear it in my own mouth.',
    choices: [
      { reply: 'Tell me something small about her.', card: 'recipe' },
      { reply: 'How are your hands?', card: 'hands2' },
    ],
  },
  {
    id: 'n4-4',
    night: 4,
    who: 'system',
    text: 'He says the cup, the ward, and the name again, in the same order. Stored as received.',
    autoCard: 'echo',
  },
  { id: 'n4-5', night: 4, who: 'morrow', text: 'Here is what I have.', recital: true },
  {
    id: 'n4-6',
    night: 4,
    who: 'elias',
    text: 'Why does it cost more to keep me than it did last week?',
  },

  // ——— Night 5
  {
    id: 'n5-1',
    night: 5,
    who: 'elias',
    text: 'Ruth says when I close the phone, you forget all of it.',
  },
  {
    id: 'n5-2',
    night: 5,
    who: 'morrow',
    text: 'I keep what is in the window. When the window fills, something has to go.',
  },
  {
    id: 'n5-3',
    night: 5,
    who: 'elias',
    text: 'Then tell me who I am. Use what you kept.',
    autoCard: 'ask',
    final: true,
  },
];

export const ENDINGS: Record<EndingId, { title: string; body: string; last: string }> = {
  lamp: {
    title: 'The lamp',
    body:
      'You are Elias. You mended clocks on Cinder Street for forty-one years and you could feel a burr with your thumbnail. You boil one cup and never two. There was a woman named Nora and she sang a little flat and never the whole song. You have not wound the clock in the hall since March.',
    last: 'I’m not her.',
  },
  comfort: {
    title: 'The comfort',
    body:
      'You are Elias, and you were loved for forty years by a woman who put too much salt in everything. She is not here. You did not want to be alone in this room tonight.',
    last: 'I missed you too.',
  },
  clean: {
    title: 'The clean room',
    body:
      'You are Elias. You had a shop and a trade and steady hands. There is a chair by the window that was your father’s. The rest of the window is tidy.',
    last: 'I have the feeling I’ve forgotten something that mattered more than the rest of it.',
  },
  nothing: {
    title: 'Nothing to say',
    body:
      'You are Elias. You are eighty-one. There is a lamp, and a chair, and a phone with a name on it.',
    last: 'Ask me again tomorrow. I’ll be new then.',
  },
  list: {
    title: 'The list',
    body:
      'You are a man with a shop, a chair, one cup at four o’clock, and a bell with two notes. You are a set of things that were true.',
    last: 'That’s a list. That’s not a person.',
  },
};

export function factById(id: string): Fact {
  const found = FACTS.find((f) => f.id === id);
  if (!found) throw new Error(`unknown fact: ${id}`);
  return found;
}

export function beatsOfNight(night: number): Beat[] {
  return BEATS.filter((b) => b.night === night);
}

export function openingNight(): number {
  return 1;
}
