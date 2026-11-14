/**
 * 声音全部是算出来的：没有音频文件，没有授权问题。
 * 浏览器要求先有一次点击，所以 AudioContext 在开场那一下才建。
 *
 * 音色说明：房间是棕噪声压到 400 Hz 以下；保留一张记忆是三角波拨弦；
 * 删掉一张是带通往下扫的白噪声（纸被火舔掉的声音）；折起两张是两声五度。
 */

type Ctx = AudioContext & { __morrow?: boolean };

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let roomGain: GainNode | null = null;
let muted = false;

function ac(): Ctx | null {
  if (muted) return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor() as Ctx;
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  return ctx;
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buf;
}

/** 开一次门：建上下文，起房间底噪。重复调用无副作用。 */
export function startRoom(): void {
  const c = ac();
  if (!c || !master || c.__morrow) return;
  c.__morrow = true;
  if (c.state === 'suspended') void c.resume();

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 6);
  src.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  const g = c.createGain();
  g.gain.value = 0.05;
  src.connect(lp).connect(g).connect(master);
  src.start();

  // 极慢的呼吸，让房间不是死的
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.05;
  const depth = c.createGain();
  depth.gain.value = 0.012;
  lfo.connect(depth).connect(g.gain);
  lfo.start();
  roomGain = g;
}

export function setMuted(next: boolean): void {
  muted = next;
  if (master) master.gain.value = next ? 0 : 0.9;
}

export function isMuted(): boolean {
  return muted;
}

function env(c: AudioContext, node: AudioNode, peak: number, attack: number, decay: number): GainNode {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  node.connect(g);
  if (master) g.connect(master);
  return g;
}

/** 记下一件事：一声很轻的拨弦。 */
export function keepTone(index = 0): void {
  const c = ac();
  if (!c) return;
  const scale = [220, 261.63, 293.66, 329.63, 392, 440];
  const f = scale[index % scale.length]! * (index >= scale.length ? 2 : 1);
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.value = f;
  env(c, o, 0.08, 0.012, 1.1);
  o.start();
  o.stop(c.currentTime + 1.6);
  const o2 = c.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = f * 2;
  env(c, o2, 0.025, 0.01, 0.7);
  o2.start();
  o2.stop(c.currentTime + 1);
}

/** 删掉一件事：纸被火舔掉。 */
export function burnTone(): void {
  const c = ac();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.6);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(2600, c.currentTime);
  bp.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.55);
  src.connect(bp);
  env(c, bp, 0.12, 0.01, 0.55);
  src.start();
  src.stop(c.currentTime + 0.7);
}

/** 折起两张：两声五度。 */
export function foldTone(): void {
  const c = ac();
  if (!c) return;
  for (const [f, at] of [
    [196, 0],
    [294, 0.11],
  ] as const) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = c.createGain();
    const t = c.currentTime + at;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g);
    if (master) g.connect(master);
    o.start(t);
    o.stop(t + 0.9);
  }
}

/** 打字：每几个字一下。 */
export function tick(i: number): void {
  const c = ac();
  if (!c || i % 3 !== 0) return;
  const o = c.createOscillator();
  o.type = 'square';
  o.frequency.value = 1700 + ((i * 37) % 240);
  env(c, o, 0.006, 0.002, 0.03);
  o.start();
  o.stop(c.currentTime + 0.06);
}

/** 换夜：一阵很低的风。 */
export function nightTone(): void {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(70, c.currentTime);
  o.frequency.linearRampToValueAtTime(55, c.currentTime + 2.4);
  env(c, o, 0.09, 0.6, 1.9);
  o.start();
  o.stop(c.currentTime + 2.6);
}

/** 窗口满了：一声不该出现的东西。 */
export function overTone(): void {
  const c = ac();
  if (!c) return;
  for (const f of [138.6, 146.8]) {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    o.connect(lp);
    env(c, lp, 0.05, 0.25, 1.4);
    o.start();
    o.stop(c.currentTime + 1.8);
  }
}

/** 一件东西烧掉的时候，房间短暂地空一下。 */
export function hush(): void {
  if (!roomGain || !ctx) return;
  const t = ctx.currentTime;
  roomGain.gain.cancelScheduledValues(t);
  roomGain.gain.setValueAtTime(roomGain.gain.value, t);
  roomGain.gain.linearRampToValueAtTime(0.012, t + 0.15);
  roomGain.gain.linearRampToValueAtTime(0.05, t + 1.8);
}

/** 录一条真实的音轨（给演示片用）：把总线接到 MediaStream 上，浏览器自己编 opus。 */
export function tapStream(): MediaStream | null {
  const c = ac();
  if (!c || !master) return null;
  const dest = c.createMediaStreamDestination();
  master.connect(dest);
  return dest.stream;
}
