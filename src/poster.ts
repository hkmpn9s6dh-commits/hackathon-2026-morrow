/**
 * 封面上的那张卡片：一张正在被烧掉的记忆。
 *
 * 全部画在 canvas 上——纸、字、烧焦的边、飘起来的火星。
 * 不引外部图片，颜色和字形都跟界面同一套。
 */

const PAPER = '#e9e0cc';
const PAPER_DARK = '#d5c9ae';
const INK = '#231f1a';
const CHAR = '58, 38, 24';
const EMBER = '255, 176, 92';

export interface Poster {
  destroy: () => void;
}

export function drawPoster(canvas: HTMLCanvasElement): Poster {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = 640;
  const H = 700;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  if (!ctx) return { destroy: () => {} };
  ctx.scale(dpr, dpr);

  const LEFT = 34;
  const TOP = 18;
  const BOTTOM = H - 18;
  const rand = mulberry(20260107);

  // 烧口：一条竖着的波浪线，越往下吃得越深
  const steps = 80;
  const edge: number[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const base = 384 + Math.sin(t * 3.6) * 34 + Math.sin(t * 8.4 + 1.1) * 15;
    edge.push(Math.max(250, Math.min(500, base + (rand() - 0.5) * 10)));
  }
  const edgeAt = (y: number): number => {
    const t = Math.max(0, Math.min(1, (y - TOP) / (BOTTOM - TOP)));
    const i = Math.min(steps, Math.round(t * steps));
    return edge[i]!;
  };

  const embers: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];
  let raf = 0;
  let t0 = performance.now();

  function paperPath(inset: number): void {
    const r = 4;
    ctx!.beginPath();
    ctx!.moveTo(LEFT + inset + r, TOP + inset);
    ctx!.lineTo(edgeAt(TOP + inset) - inset, TOP + inset);
    for (let i = 1; i <= steps; i += 1) {
      const y = TOP + inset + ((BOTTOM - TOP - inset * 2) * i) / steps;
      ctx!.lineTo(edgeAt(y) - inset, y);
    }
    ctx!.lineTo(LEFT + inset + r, BOTTOM - inset);
    ctx!.quadraticCurveTo(LEFT + inset, BOTTOM - inset, LEFT + inset, BOTTOM - inset - r);
    ctx!.lineTo(LEFT + inset, TOP + inset + r);
    ctx!.quadraticCurveTo(LEFT + inset, TOP + inset, LEFT + inset + r, TOP + inset);
    ctx!.closePath();
  }

  function drawPaper(): void {
    ctx!.save();
    paperPath(0);
    const g = ctx!.createLinearGradient(LEFT, TOP, 340, BOTTOM);
    g.addColorStop(0, PAPER);
    g.addColorStop(0.75, PAPER_DARK);
    g.addColorStop(1, '#c9bb9c');
    ctx!.fillStyle = g;
    ctx!.fill();

    // 纸面上一层很淡的横纹，像真的卡片
    ctx!.clip();
    ctx!.strokeStyle = 'rgba(90,72,42,.05)';
    ctx!.lineWidth = 1;
    for (let y = TOP + 12; y < BOTTOM; y += 6) {
      ctx!.beginPath();
      ctx!.moveTo(LEFT, y);
      ctx!.lineTo(400, y);
      ctx!.stroke();
    }
    ctx!.restore();
  }

  function burnEdge(time: number): void {
    // 1. 把纸吃掉
    ctx!.save();
    ctx!.globalCompositeOperation = 'destination-out';
    for (let i = 0; i <= steps; i += 1) {
      const y = TOP + ((BOTTOM - TOP) * i) / steps;
      const wob = Math.sin(time * 0.0014 + i * 0.55) * 3;
      const rad = 9 + Math.abs(Math.sin(i * 1.31)) * 15;
      ctx!.beginPath();
      ctx!.arc(edgeAt(y) + wob, y, rad, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.restore();

    // 2. 贴着烧口的焦：只画在纸上
    ctx!.save();
    ctx!.globalCompositeOperation = 'source-atop';
    ctx!.lineJoin = 'round';
    ctx!.shadowColor = `rgba(${CHAR}, 0.9)`;
    ctx!.shadowBlur = 12;
    ctx!.strokeStyle = `rgba(${CHAR}, 0.92)`;
    for (const width of [26, 16, 9]) {
      ctx!.lineWidth = width;
      ctx!.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const y = TOP + ((BOTTOM - TOP) * i) / steps;
        const x = edgeAt(y) + Math.sin(time * 0.0014 + i * 0.55) * 3;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();
    }
    ctx!.restore();

    // 3. 火：断断续续的一点亮，外加几团外溢的热
    ctx!.save();
    ctx!.globalCompositeOperation = 'lighter';
    ctx!.lineCap = 'round';
    let i0 = 0;
    while (i0 < steps) {
      const run = 3 + Math.floor(rand() * 8);
      const hot = rand() > 0.28;
      ctx!.beginPath();
      for (let i = i0; i <= Math.min(steps, i0 + run); i += 1) {
        const y = TOP + ((BOTTOM - TOP) * i) / steps;
        const x = edgeAt(y) + Math.sin(time * 0.0014 + i * 0.55) * 3;
        if (i === i0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.lineWidth = 1.5;
      ctx!.strokeStyle = hot ? 'rgba(255, 226, 176, 0.55)' : `rgba(${EMBER}, 0.28)`;
      ctx!.shadowColor = `rgba(${EMBER}, 0.9)`;
      ctx!.shadowBlur = 12;
      ctx!.stroke();
      i0 += run + 1;
    }

    for (let k = 0; k < 16; k += 1) {
      const y = TOP + ((BOTTOM - TOP) * k) / 15;
      const x = edgeAt(y) + Math.sin(time * 0.0014 + k * 0.9) * 4;
      const r = 26 + Math.abs(Math.sin(k * 2.1)) * 42;
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${EMBER}, 0.16)`);
      g.addColorStop(0.45, `rgba(${EMBER}, 0.06)`);
      g.addColorStop(1, `rgba(${EMBER}, 0)`);
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.restore();
  }

  function drawText(): void {
    ctx!.save();
    ctx!.fillStyle = INK;
    ctx!.font = '400 12px "Plex", monospace';
    ctx!.letterSpacing = '2.2px';
    ctx!.fillText('WHAT MORROW KEEPS', 74, 76);
    ctx!.letterSpacing = '0px';

    const lines: [string, string][] = [
      ['400 36px "Garamond", serif', 'Her name is Nora.'],
      ['400 30px "Garamond", serif', 'She sang a little flat,'],
      ['italic 400 30px "Garamond", serif', 'and never the whole song.'],
      ['400 30px "Garamond", serif', 'He never told her'],
      ['italic 400 30px "Garamond", serif', 'about the salt.'],
    ];
    let y = 176;
    for (const [font, text] of lines) {
      ctx!.font = font;
      ctx!.fillText(text, 76, y);
      y += 54;
    }

    ctx!.fillStyle = 'rgba(35,31,26,.5)';
    ctx!.font = '400 9px "Plex", monospace';
    ctx!.letterSpacing = '1.8px';
    ctx!.fillText('5 NIGHTS · 4096 TOKENS', 74, BOTTOM - 34);
    ctx!.restore();
  }

  function spawnEmber(): void {
    const y = TOP + Math.random() * (BOTTOM - TOP);
    embers.push({
      x: edgeAt(y) + (Math.random() - 0.4) * 14,
      y,
      vx: 0.3 + Math.random() * 0.7,
      vy: -0.3 - Math.random() * 0.7,
      life: 1,
      size: 0.9 + Math.random() * 1.9,
    });
  }

  function frame(time: number): void {
    const dt = Math.min(64, time - t0);
    t0 = time;
    ctx!.clearRect(0, 0, W, H);
    ctx!.save();
    ctx!.translate(W / 2, H / 2);
    ctx!.rotate(-0.022);
    ctx!.translate(-W / 2, -H / 2);

    drawPaper();
    burnEdge(time);
    drawText();

    if (Math.random() < 0.5) spawnEmber();

    ctx!.save();
    ctx!.globalCompositeOperation = 'lighter';
    for (let i = embers.length - 1; i >= 0; i -= 1) {
      const e = embers[i]!;
      e.x += e.vx * (dt / 16);
      e.y += e.vy * (dt / 16);
      e.vy -= 0.003;
      e.life -= 0.0055 * (dt / 16);
      if (e.life <= 0) {
        embers.splice(i, 1);
        continue;
      }
      ctx!.fillStyle = `rgba(${EMBER}, ${0.85 * e.life})`;
      ctx!.shadowColor = `rgba(${EMBER}, ${e.life})`;
      ctx!.shadowBlur = 7;
      ctx!.fillRect(e.x, e.y, e.size, e.size);
    }
    ctx!.restore();
    ctx!.restore();

    raf = requestAnimationFrame(frame);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.022);
    ctx.translate(-W / 2, -H / 2);
    drawPaper();
    burnEdge(0);
    drawText();
    ctx.restore();
  } else {
    raf = requestAnimationFrame(frame);
  }

  return {
    destroy: () => {
      cancelAnimationFrame(raf);
    },
  };
}

function mulberry(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
