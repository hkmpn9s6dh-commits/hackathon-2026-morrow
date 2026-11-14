/**
 * 房间。整件作品的"形象"都在这一层：窗、雨、灯、桌子、一把椅子、一个人。
 *
 * 一条规矩：**记忆就是屋里的东西**。留住一件，那件东西才在；删掉一件，
 * 它就在原位烧掉。屋里越满，老人越清楚自己是谁；屋里空了，他连自己叫什么都想不起来。
 *
 * 坐标固定在 1440×900 的舞台上，外面按 cover 缩放，所以构图不会因为窗口大小变形。
 */

const W = 1440;
const H = 900;

const C = {
  wallTop: '#171d26',
  wallBottom: '#10141a',
  floor: '#0a0d11',
  rug: '#101216',
  windowSky: '#0d1721',
  windowFar: '#16232e',
  street: '#2c4353',
  frame: '#1b2028',
  wood: '#201a14',
  woodTop: '#2a221a',
  amber: '#e3a95f',
  ember: '255, 176, 92',
  rim: '154, 186, 208',
  figure: '#050609',
};

/** 一条记忆对应屋里的哪件东西。 */
const OBJECT_BY_FACT: Record<string, string> = {
  hands: 'watch',
  lamp: 'lamp',
  chair: 'chair',
  kettle: 'kettle',
  teacup: 'cup',
  sunday: 'radio',
  shop: 'sign',
  bell: 'bell',
  hospital: 'flowers',
  ruth: 'photo',
  grave: 'curtain',
  clock: 'clock',
  name: 'portrait',
  street: 'sign',
  recipe: 'salt',
  hands2: 'watch',
  echo: 'mirror',
  ask: 'window-warm',
};

/** 每件东西落在舞台上的位置（底边中点）。 */
const ANCHOR: Record<string, [number, number]> = {
  lamp: [150, 512],
  kettle: [204, 512],
  cup: [282, 512],
  salt: [330, 512],
  bell: [382, 512],
  radio: [462, 512],
  photo: [334, 512],
  watch: [508, 512],
  clock: [214, 140],
  portrait: [400, 160],
  sign: [86, 268],
  mirror: [520, 156],
  chair: [1006, 560],
  flowers: [918, 366],
  curtain: [940, 170],
  'window-warm': [770, 210],
};

type Rect = [number, number, number, number];

const WINDOW_RECT: Rect = [596, 56, 360, 300];
const TABLE_TOP = 512;

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  warm: boolean;
}

export interface SceneApi {
  /** 现在窗口里有哪些记忆（事实 id） */
  setMemories: (factIds: string[]) => void;
  /** 某件东西正在被烧掉：从它的位置冒火星 */
  burn: (factId: string) => void;
  /** 结局时把整个房间的亮度调低一点 */
  fade: (to: number) => void;
  destroy: () => void;
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

export function createScene(canvas: HTMLCanvasElement): SceneApi {
  const ctx = canvas.getContext('2d');
  const presence = new Map<string, number>();
  const motes: Mote[] = [];
  const embers: Mote[] = [];
  let raf = 0;
  let t0 = performance.now();
  let time = 0;
  let dim = 1;
  let dimTarget = 1;
  const rand = mulberry(71207);

  const rain: { x: number; y: number; len: number; speed: number }[] = [];
  for (let i = 0; i < 90; i += 1) {
    rain.push({
      x: WINDOW_RECT[0] + rand() * WINDOW_RECT[2],
      y: WINDOW_RECT[1] + rand() * WINDOW_RECT[3],
      len: 8 + rand() * 22,
      speed: 260 + rand() * 420,
    });
  }

  function size(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const scale = Math.max(w / W, h / H) * 1.02;
    ctx?.setTransform(dpr * scale, 0, 0, dpr * scale, (w - W * scale) / 2, (h - H * scale) / 2);
  }

  /* ————— 房间 ————— */

  function wall(): void {
    const g = ctx!.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.wallTop);
    g.addColorStop(0.62, C.wallBottom);
    g.addColorStop(1, C.floor);
    ctx!.fillStyle = g;
    ctx!.fillRect(0, 0, W, H);

    // 墙纸的竖纹：很淡，只是让大面积不死
    ctx!.strokeStyle = 'rgba(255,255,255,0.014)';
    ctx!.lineWidth = 2;
    for (let x = 24; x < W; x += 46) {
      ctx!.beginPath();
      ctx!.moveTo(x, 0);
      ctx!.lineTo(x, TABLE_TOP + 40);
      ctx!.stroke();
    }
    // 踢脚线
    ctx!.fillStyle = 'rgba(255,255,255,0.03)';
    ctx!.fillRect(0, TABLE_TOP + 26, W, 6);
    // 地板
    ctx!.fillStyle = C.floor;
    ctx!.fillRect(0, TABLE_TOP + 32, W, H - TABLE_TOP - 32);
    ctx!.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx!.lineWidth = 1;
    for (let i = 0; i < 12; i += 1) {
      const y = TABLE_TOP + 60 + i * 26;
      ctx!.beginPath();
      ctx!.moveTo(0, y);
      ctx!.lineTo(W, y + 6);
      ctx!.stroke();
    }
    // 地毯
    ctx!.fillStyle = C.rug;
    ctx!.beginPath();
    ctx!.ellipse(760, 800, 560, 110, 0, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.strokeStyle = 'rgba(227,169,95,0.05)';
    ctx!.lineWidth = 2;
    ctx!.stroke();
  }

  function windowFrame(): void {
    const [x, y, w, h] = WINDOW_RECT;
    // 玻璃外的夜
    const sky = ctx!.createLinearGradient(x, y, x, y + h);
    sky.addColorStop(0, C.windowSky);
    sky.addColorStop(0.7, C.windowFar);
    sky.addColorStop(1, '#0f1a23');
    ctx!.fillStyle = sky;
    ctx!.fillRect(x, y, w, h);

    // 窗外：街灯的一团光 + 远处房子的轮廓
    const lampX = x + w * 0.24;
    const lampY = y + h * 0.62;
    const glow = ctx!.createRadialGradient(lampX, lampY, 0, lampX, lampY, 150);
    glow.addColorStop(0, 'rgba(150, 186, 208, 0.34)');
    glow.addColorStop(0.45, 'rgba(120, 156, 180, 0.10)');
    glow.addColorStop(1, 'rgba(120, 156, 180, 0)');
    ctx!.fillStyle = glow;
    ctx!.fillRect(x, y, w, h);

    ctx!.fillStyle = 'rgba(9, 14, 19, 0.9)';
    for (let i = 0; i < 5; i += 1) {
      const bw = 60 + ((i * 37) % 50);
      const bh = 90 + ((i * 53) % 120);
      ctx!.fillRect(x + 20 + i * 78, y + h - bh, bw, bh);
    }
    ctx!.fillStyle = 'rgba(200, 214, 226, 0.18)';
    for (let i = 0; i < 9; i += 1) {
      ctx!.fillRect(x + 34 + ((i * 61) % (w - 60)), y + h - 150 + ((i * 37) % 120), 4, 6);
    }

    // 雨
    ctx!.save();
    ctx!.beginPath();
    ctx!.rect(x, y, w, h);
    ctx!.clip();
    ctx!.strokeStyle = 'rgba(178, 204, 222, 0.16)';
    ctx!.lineWidth = 1;
    for (const drop of rain) {
      ctx!.beginPath();
      ctx!.moveTo(drop.x, drop.y);
      ctx!.lineTo(drop.x - 2, drop.y + drop.len);
      ctx!.stroke();
    }
    ctx!.restore();

    // 窗框：外框 + 十字
    ctx!.strokeStyle = C.frame;
    ctx!.lineWidth = 14;
    ctx!.strokeRect(x, y, w, h);
    ctx!.lineWidth = 8;
    ctx!.beginPath();
    ctx!.moveTo(x + w / 2, y);
    ctx!.lineTo(x + w / 2, y + h);
    ctx!.moveTo(x, y + h * 0.46);
    ctx!.lineTo(x + w, y + h * 0.46);
    ctx!.stroke();
    // 玻璃反光
    ctx!.fillStyle = 'rgba(190, 214, 232, 0.05)';
    ctx!.beginPath();
    ctx!.moveTo(x + 12, y + h - 12);
    ctx!.lineTo(x + w * 0.4, y + 12);
    ctx!.lineTo(x + w * 0.55, y + 12);
    ctx!.lineTo(x + 12, y + h * 0.62);
    ctx!.closePath();
    ctx!.fill();
    // 窗台
    ctx!.fillStyle = '#1b2229';
    ctx!.fillRect(x - 14, y + h, w + 28, 12);

    // 窗光洒到墙上（冷）
    const spill = ctx!.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 1.15);
    spill.addColorStop(0, 'rgba(150, 186, 208, 0.10)');
    spill.addColorStop(0.5, 'rgba(140, 176, 200, 0.04)');
    spill.addColorStop(1, 'rgba(140, 176, 200, 0)');
    ctx!.fillStyle = spill;
    ctx!.fillRect(x - w * 0.8, y - h * 0.5, w * 2.6, h * 2.4);
  }

  /* ————— 家具 ————— */

  function table(): void {
    const x0 = 56;
    const x1 = 552;
    ctx!.fillStyle = C.wood;
    ctx!.fillRect(x0, TABLE_TOP, x1 - x0, 12);
    ctx!.fillStyle = C.woodTop;
    ctx!.fillRect(x0, TABLE_TOP - 3, x1 - x0, 4);
    ctx!.fillStyle = '#141010';
    ctx!.fillRect(x0 + 26, TABLE_TOP + 12, 16, 160);
    ctx!.fillRect(x1 - 42, TABLE_TOP + 12, 16, 160);
    // 台面被灯照亮的那一块
    const lit = ctx!.createRadialGradient(150, TABLE_TOP, 0, 150, TABLE_TOP, 380);
    lit.addColorStop(0, 'rgba(227,169,95,0.30)');
    lit.addColorStop(0.45, 'rgba(227,169,95,0.10)');
    lit.addColorStop(1, 'rgba(227,169,95,0)');
    ctx!.fillStyle = lit;
    ctx!.fillRect(x0 - 40, TABLE_TOP - 90, x1 - x0 + 80, 120);
  }

  function armchair(): void {
    const cx = 770;
    // 椅背在后、两臂在前：一张普通的扶手椅，别做成王座
    ctx!.fillStyle = C.figure;
    ctx!.beginPath();
    ctx!.roundRect(cx - 106, 356, 212, 248, 26);
    ctx!.fill();
    ctx!.beginPath();
    ctx!.roundRect(cx - 128, 486, 26, 116, 13);
    ctx!.roundRect(cx + 102, 486, 26, 116, 13);
    ctx!.fill();
    // 椅背顶上的月光
    ctx!.strokeStyle = `rgba(${C.rim}, 0.26)`;
    ctx!.lineWidth = 2;
    ctx!.beginPath();
    ctx!.moveTo(cx - 102, 382);
    ctx!.quadraticCurveTo(cx - 100, 360, cx - 70, 358);
    ctx!.lineTo(cx + 70, 358);
    ctx!.quadraticCurveTo(cx + 100, 360, cx + 102, 382);
    ctx!.stroke();
  }

  function figure(breathe: number): void {
    const cx = 770;
    const headY = 302 + breathe;

    ctx!.save();
    // 肩膀与躯干：斜肩，不要平顶
    ctx!.fillStyle = '#161c25';
    ctx!.beginPath();
    ctx!.moveTo(cx - 100, 604);
    ctx!.quadraticCurveTo(cx - 96, 396, cx - 56, 352);
    ctx!.quadraticCurveTo(cx - 4, 330, cx + 56, 352);
    ctx!.quadraticCurveTo(cx + 96, 396, cx + 100, 604);
    ctx!.closePath();
    ctx!.fill();

    // 脖子
    ctx!.fillStyle = '#232b36';
    ctx!.fillRect(cx - 16, headY + 26, 32, 26);

    // 头：侧面剪影（朝左，看着那张纸）——侧脸是人一眼就认得出的东西
    ctx!.fillStyle = '#1c232d';
    ctx!.beginPath();
    ctx!.moveTo(cx + 30, headY - 6);
    ctx!.quadraticCurveTo(cx + 26, headY - 34, cx - 2, headY - 36);
    ctx!.quadraticCurveTo(cx - 26, headY - 36, cx - 32, headY - 12);
    ctx!.lineTo(cx - 40, headY + 2);
    ctx!.quadraticCurveTo(cx - 41, headY + 5, cx - 35, headY + 6);
    ctx!.lineTo(cx - 33, headY + 12);
    ctx!.quadraticCurveTo(cx - 36, headY + 15, cx - 32, headY + 18);
    ctx!.lineTo(cx - 30, headY + 22);
    ctx!.quadraticCurveTo(cx - 31, headY + 30, cx - 24, headY + 32);
    ctx!.quadraticCurveTo(cx - 4, headY + 36, cx + 14, headY + 26);
    ctx!.quadraticCurveTo(cx + 30, headY + 16, cx + 30, headY - 6);
    ctx!.closePath();
    ctx!.fill();

    // 后脑的头发
    ctx!.fillStyle = '#11161d';
    ctx!.beginPath();
    ctx!.ellipse(cx + 14, headY - 8, 22, 24, 0.12, 0, Math.PI * 2);
    ctx!.fill();

    // 两条前臂搭到纸上
    ctx!.strokeStyle = '#1b222c';
    ctx!.lineWidth = 30;
    ctx!.lineCap = 'round';
    ctx!.beginPath();
    ctx!.moveTo(cx - 66, 420);
    ctx!.quadraticCurveTo(cx - 86, 452, cx - 68, 470);
    ctx!.stroke();
    ctx!.beginPath();
    ctx!.moveTo(cx + 66, 420);
    ctx!.quadraticCurveTo(cx + 86, 452, cx + 62, 470);
    ctx!.stroke();

    // 手上那张纸：屋里最亮的一块，也是他低头看的东西
    ctx!.save();
    ctx!.shadowColor = 'rgba(227,169,95,0.6)';
    ctx!.shadowBlur = 30;
    const g = ctx!.createLinearGradient(cx - 70, 412, cx + 70, 496);
    g.addColorStop(0, '#f2e9d6');
    g.addColorStop(1, '#cdbfa4');
    ctx!.fillStyle = g;
    ctx!.beginPath();
    ctx!.moveTo(cx - 72, 414);
    ctx!.lineTo(cx + 58, 412);
    ctx!.lineTo(cx + 70, 492);
    ctx!.lineTo(cx - 82, 496);
    ctx!.closePath();
    ctx!.fill();
    ctx!.restore();

    ctx!.strokeStyle = 'rgba(40,34,26,0.40)';
    ctx!.lineWidth = 1.1;
    for (let i = 0; i < 6; i += 1) {
      const y = 428 + i * 11;
      const inset = i === 5 ? 28 : 6;
      ctx!.beginPath();
      ctx!.moveTo(cx - 66 + inset, y);
      ctx!.lineTo(cx + 52, y - 2);
      ctx!.stroke();
    }

    // 膝
    ctx!.fillStyle = '#10161d';
    ctx!.beginPath();
    ctx!.ellipse(cx - 58, 545, 46, 34, -0.2, 0, Math.PI * 2);
    ctx!.ellipse(cx + 56, 545, 46, 34, 0.2, 0, Math.PI * 2);
    ctx!.fill();

    // 纸的光打回他脸上（很淡，但这是"他在读"的证据）
    ctx!.save();
    ctx!.globalCompositeOperation = 'lighter';
    const glow = ctx!.createRadialGradient(cx - 4, 430, 0, cx - 4, 430, 150);
    glow.addColorStop(0, 'rgba(227,169,95,0.18)');
    glow.addColorStop(1, 'rgba(227,169,95,0)');
    ctx!.fillStyle = glow;
    ctx!.fillRect(cx - 160, 300, 320, 240);
    ctx!.restore();

    // 逆光边：右边（窗）冷，左边（灯）暖
    ctx!.strokeStyle = `rgba(${C.rim}, 0.6)`;
    ctx!.lineWidth = 2;
    ctx!.beginPath();
    ctx!.moveTo(cx - 30, headY - 22);
    ctx!.quadraticCurveTo(cx - 2, headY - 38, cx + 22, headY - 20);
    ctx!.quadraticCurveTo(cx + 31, headY - 8, cx + 29, headY + 10);
    ctx!.stroke();
    ctx!.beginPath();
    ctx!.moveTo(cx + 44, headY + 34);
    ctx!.quadraticCurveTo(cx + 78, headY + 62, cx + 88, 420);
    ctx!.stroke();

    ctx!.strokeStyle = 'rgba(227,169,95,0.55)';
    ctx!.lineWidth = 1.8;
    ctx!.beginPath();
    ctx!.moveTo(cx - 32, headY - 12);
    ctx!.lineTo(cx - 40, headY + 2);
    ctx!.quadraticCurveTo(cx - 41, headY + 5, cx - 35, headY + 6);
    ctx!.lineTo(cx - 33, headY + 12);
    ctx!.quadraticCurveTo(cx - 36, headY + 15, cx - 32, headY + 18);
    ctx!.stroke();
    ctx!.beginPath();
    ctx!.moveTo(cx - 54, 356);
    ctx!.quadraticCurveTo(cx - 88, 392, cx - 94, 470);
    ctx!.stroke();

    ctx!.restore();
  }

  /* ————— 屋里的东西：留住才有 ————— */

  function objLamp(): void {
    // 铜台灯：灯罩 + 灯柱 + 底座
    ctx!.fillStyle = '#3a2f22';
    ctx!.beginPath();
    ctx!.roundRect(-26, -118, 52, 30, 6);
    ctx!.fill();
    ctx!.fillStyle = '#2a2219';
    ctx!.fillRect(-4, -90, 8, 76);
    ctx!.beginPath();
    ctx!.ellipse(0, -12, 22, 8, 0, 0, Math.PI * 2);
    ctx!.fill();
    // 灯罩内壁的暖
    ctx!.fillStyle = 'rgba(227,169,95,0.55)';
    ctx!.beginPath();
    ctx!.moveTo(-24, -116);
    ctx!.lineTo(24, -116);
    ctx!.lineTo(16, -92);
    ctx!.lineTo(-16, -92);
    ctx!.closePath();
    ctx!.fill();
  }

  function objKettle(): void {
    ctx!.fillStyle = '#232a30';
    ctx!.beginPath();
    ctx!.moveTo(-20, 0);
    ctx!.lineTo(-16, -34);
    ctx!.quadraticCurveTo(0, -44, 16, -34);
    ctx!.lineTo(20, 0);
    ctx!.closePath();
    ctx!.fill();
    ctx!.strokeStyle = '#2f383f';
    ctx!.lineWidth = 2;
    ctx!.beginPath();
    ctx!.moveTo(16, -30);
    ctx!.quadraticCurveTo(30, -34, 32, -22);
    ctx!.stroke();
  }

  function objCup(): void {
    ctx!.fillStyle = '#7e8b96';
    ctx!.beginPath();
    ctx!.moveTo(-9, 0);
    ctx!.lineTo(-11, -18);
    ctx!.lineTo(11, -18);
    ctx!.lineTo(9, 0);
    ctx!.closePath();
    ctx!.fill();
    ctx!.strokeStyle = '#7e8b96';
    ctx!.lineWidth = 2;
    ctx!.beginPath();
    ctx!.arc(12, -10, 5, -1.2, 1.2);
    ctx!.stroke();
    // 杯口的暖反光
    ctx!.strokeStyle = 'rgba(227,169,95,0.5)';
    ctx!.lineWidth = 1.4;
    ctx!.beginPath();
    ctx!.moveTo(-11, -18);
    ctx!.lineTo(11, -18);
    ctx!.stroke();
  }

  function objSalt(): void {
    ctx!.fillStyle = '#5d666f';
    ctx!.beginPath();
    ctx!.roundRect(-7, -20, 14, 20, 3);
    ctx!.fill();
    ctx!.fillStyle = 'rgba(227,169,95,0.35)';
    ctx!.fillRect(-5, -18, 4, 16);
  }

  function objBell(): void {
    ctx!.fillStyle = '#8a6a35';
    ctx!.beginPath();
    ctx!.moveTo(-12, 0);
    ctx!.quadraticCurveTo(-12, -22, 0, -22);
    ctx!.quadraticCurveTo(12, -22, 12, 0);
    ctx!.closePath();
    ctx!.fill();
    ctx!.fillStyle = '#a8823f';
    ctx!.fillRect(-2, -26, 4, 5);
  }

  function objRadio(): void {
    ctx!.fillStyle = '#2b241c';
    ctx!.beginPath();
    ctx!.roundRect(-34, -44, 68, 44, 5);
    ctx!.fill();
    ctx!.fillStyle = '#171310';
    ctx!.beginPath();
    ctx!.roundRect(-28, -38, 34, 32, 3);
    ctx!.fill();
    ctx!.strokeStyle = 'rgba(227,169,95,0.35)';
    ctx!.lineWidth = 1.2;
    for (let i = 0; i < 4; i += 1) {
      ctx!.beginPath();
      ctx!.moveTo(-26, -34 + i * 8);
      ctx!.lineTo(4, -34 + i * 8);
      ctx!.stroke();
    }
    ctx!.fillStyle = '#4a3c2c';
    ctx!.beginPath();
    ctx!.arc(18, -26, 5, 0, Math.PI * 2);
    ctx!.arc(18, -12, 5, 0, Math.PI * 2);
    ctx!.fill();
    // 天线
    ctx!.strokeStyle = '#4a3c2c';
    ctx!.lineWidth = 1.6;
    ctx!.beginPath();
    ctx!.moveTo(26, -44);
    ctx!.lineTo(44, -76);
    ctx!.stroke();
  }

  function objPhoto(): void {
    ctx!.strokeStyle = '#6b5636';
    ctx!.lineWidth = 3;
    ctx!.beginPath();
    ctx!.moveTo(-16, 0);
    ctx!.lineTo(-12, -30);
    ctx!.lineTo(12, -30);
    ctx!.lineTo(16, 0);
    ctx!.stroke();
    ctx!.fillStyle = 'rgba(196, 214, 226, 0.22)';
    ctx!.beginPath();
    ctx!.moveTo(-10, -3);
    ctx!.lineTo(-8, -27);
    ctx!.lineTo(8, -27);
    ctx!.lineTo(10, -3);
    ctx!.closePath();
    ctx!.fill();
  }

  function objWatch(): void {
    ctx!.fillStyle = '#8a6a35';
    ctx!.beginPath();
    ctx!.arc(0, -8, 11, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = '#11150f';
    ctx!.beginPath();
    ctx!.arc(0, -8, 8, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.strokeStyle = 'rgba(227,169,95,0.9)';
    ctx!.lineWidth = 1;
    ctx!.beginPath();
    ctx!.moveTo(0, -8);
    ctx!.lineTo(0, -14);
    ctx!.moveTo(0, -8);
    ctx!.lineTo(4, -6);
    ctx!.stroke();
    // 链子
    ctx!.strokeStyle = 'rgba(138,106,53,0.7)';
    ctx!.beginPath();
    ctx!.moveTo(8, 0);
    ctx!.quadraticCurveTo(26, 2, 34, -4);
    ctx!.stroke();
  }

  function objClock(): void {
    ctx!.fillStyle = '#1d242b';
    ctx!.beginPath();
    ctx!.roundRect(-38, -40, 76, 96, 4);
    ctx!.fill();
    ctx!.strokeStyle = '#2d3742';
    ctx!.lineWidth = 2;
    ctx!.strokeRect(-38, -40, 76, 96);
    // 钟面
    ctx!.fillStyle = '#0d1216';
    ctx!.beginPath();
    ctx!.arc(0, -4, 26, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.strokeStyle = 'rgba(200,214,226,0.35)';
    ctx!.lineWidth = 1.4;
    ctx!.stroke();
    ctx!.strokeStyle = 'rgba(200,214,226,0.8)';
    ctx!.beginPath();
    ctx!.moveTo(0, -4);
    ctx!.lineTo(0, -20);
    ctx!.moveTo(0, -4);
    ctx!.lineTo(9, -1);
    ctx!.stroke();
    // 摆锤
    ctx!.strokeStyle = 'rgba(200,214,226,0.25)';
    ctx!.beginPath();
    ctx!.moveTo(0, 22);
    ctx!.lineTo(0, 42);
    ctx!.stroke();
    ctx!.fillStyle = 'rgba(200,214,226,0.35)';
    ctx!.beginPath();
    ctx!.arc(0, 46, 6, 0, Math.PI * 2);
    ctx!.fill();
  }

  function objPortrait(): void {
    // 她的相框：唯一有"人"的物件，所以给它一点暖
    ctx!.strokeStyle = '#6b5636';
    ctx!.lineWidth = 4;
    ctx!.strokeRect(-42, -54, 84, 104);
    const g = ctx!.createLinearGradient(-42, -54, 42, 50);
    g.addColorStop(0, 'rgba(227,169,95,0.26)');
    g.addColorStop(1, 'rgba(227,169,95,0.08)');
    ctx!.fillStyle = g;
    ctx!.fillRect(-42, -54, 84, 104);
    // 一个很淡的侧影
    ctx!.fillStyle = 'rgba(20,16,12,0.55)';
    ctx!.beginPath();
    ctx!.ellipse(0, -4, 16, 20, 0, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.beginPath();
    ctx!.moveTo(-26, 50);
    ctx!.quadraticCurveTo(-22, 6, 0, 4);
    ctx!.quadraticCurveTo(22, 6, 26, 50);
    ctx!.closePath();
    ctx!.fill();
  }

  function objMirror(): void {
    ctx!.strokeStyle = '#3a4652';
    ctx!.lineWidth = 3;
    ctx!.beginPath();
    ctx!.roundRect(-30, -44, 60, 88, 30);
    ctx!.stroke();
    const g = ctx!.createLinearGradient(-30, -44, 30, 44);
    g.addColorStop(0, 'rgba(196,214,226,0.10)');
    g.addColorStop(0.5, 'rgba(196,214,226,0.02)');
    g.addColorStop(1, 'rgba(196,214,226,0.08)');
    ctx!.fillStyle = g;
    ctx!.fill();
  }

  function objSign(): void {
    ctx!.fillStyle = '#1a1510';
    ctx!.beginPath();
    ctx!.roundRect(-34, -22, 68, 30, 3);
    ctx!.fill();
    ctx!.strokeStyle = 'rgba(227,169,95,0.30)';
    ctx!.lineWidth = 1.4;
    ctx!.stroke();
    ctx!.fillStyle = 'rgba(227,169,95,0.45)';
    for (let i = 0; i < 5; i += 1) ctx!.fillRect(-26 + i * 11, -16, 7, 3);
    for (let i = 0; i < 5; i += 1) ctx!.fillRect(-26 + i * 11, -9, 7, 3);
  }

  function objChair(): void {
    ctx!.fillStyle = C.figure;
    ctx!.beginPath();
    ctx!.moveTo(-34, 0);
    ctx!.lineTo(-34, -86);
    ctx!.quadraticCurveTo(-32, -100, -18, -100);
    ctx!.lineTo(18, -100);
    ctx!.quadraticCurveTo(32, -100, 34, -86);
    ctx!.lineTo(34, 0);
    ctx!.closePath();
    ctx!.fill();
    ctx!.fillRect(-42, -70, 8, 70);
    ctx!.fillRect(34, -70, 8, 70);
    // 四条腿，落地
    ctx!.fillRect(-36, 0, 7, 46);
    ctx!.fillRect(29, 0, 7, 46);
    ctx!.strokeStyle = `rgba(${C.rim}, 0.28)`;
    ctx!.lineWidth = 1.6;
    ctx!.beginPath();
    ctx!.moveTo(-32, -2);
    ctx!.lineTo(-32, -86);
    ctx!.quadraticCurveTo(-30, -98, -16, -98);
    ctx!.stroke();
  }

  function objFlowers(): void {
    ctx!.strokeStyle = '#2f3a30';
    ctx!.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx!.beginPath();
      ctx!.moveTo(i * 4, 0);
      ctx!.quadraticCurveTo(i * 10, -20, i * 14, -34 + Math.abs(i) * 4);
      ctx!.stroke();
    }
    ctx!.fillStyle = 'rgba(227,169,95,0.6)';
    for (let i = -2; i <= 2; i += 1) {
      ctx!.beginPath();
      ctx!.arc(i * 14, -34 + Math.abs(i) * 4, 4, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function objCurtain(): void {
    ctx!.fillStyle = 'rgba(30,26,22,0.9)';
    ctx!.beginPath();
    ctx!.moveTo(-26, -140);
    ctx!.lineTo(26, -140);
    ctx!.quadraticCurveTo(34, 0, 18, 140);
    ctx!.lineTo(-18, 140);
    ctx!.quadraticCurveTo(-34, 0, -26, -140);
    ctx!.closePath();
    ctx!.fill();
    ctx!.strokeStyle = 'rgba(227,169,95,0.10)';
    ctx!.lineWidth = 2;
    ctx!.beginPath();
    ctx!.moveTo(0, -140);
    ctx!.quadraticCurveTo(8, 0, 0, 140);
    ctx!.stroke();
  }

  function objWindowWarm(): void {
    const [x, y, w, h] = WINDOW_RECT;
    const g = ctx!.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.75);
    g.addColorStop(0, 'rgba(227,169,95,0.18)');
    g.addColorStop(1, 'rgba(227,169,95,0)');
    ctx!.fillStyle = g;
    ctx!.fillRect(x - 60, y - 60, w + 120, h + 120);
  }

  const DRAW: Record<string, () => void> = {
    lamp: objLamp,
    kettle: objKettle,
    cup: objCup,
    salt: objSalt,
    bell: objBell,
    radio: objRadio,
    photo: objPhoto,
    watch: objWatch,
    clock: objClock,
    portrait: objPortrait,
    mirror: objMirror,
    sign: objSign,
    chair: objChair,
    flowers: objFlowers,
    curtain: objCurtain,
    'window-warm': objWindowWarm,
  };

  /** 台灯永远亮着：它是房间本身的一部分 */
  function lampLight(): void {
    const [lx, ly] = ANCHOR.lamp!;
    const flicker = 0.94 + Math.sin(time * 0.0021) * 0.03 + Math.sin(time * 0.0071) * 0.02;
    ctx!.save();
    ctx!.globalCompositeOperation = 'lighter';

    // 灯泡本体
    const bulb = ctx!.createRadialGradient(lx, ly - 104, 0, lx, ly - 104, 26);
    bulb.addColorStop(0, `rgba(255, 226, 176, ${0.9 * flicker})`);
    bulb.addColorStop(1, 'rgba(255, 200, 130, 0)');
    ctx!.fillStyle = bulb;
    ctx!.fillRect(lx - 30, ly - 134, 60, 60);

    // 灯罩下的一团
    const pool = ctx!.createRadialGradient(lx, ly - 40, 0, lx, ly - 40, 340);
    pool.addColorStop(0, `rgba(227, 169, 95, ${0.26 * flicker})`);
    pool.addColorStop(0.45, `rgba(227, 169, 95, ${0.10 * flicker})`);
    pool.addColorStop(1, 'rgba(227, 169, 95, 0)');
    ctx!.fillStyle = pool;
    ctx!.beginPath();
    ctx!.ellipse(lx + 70, ly + 40, 380, 260, 0, 0, Math.PI * 2);
    ctx!.fill();

    // 光锥，打到人身上
    const cone = ctx!.createLinearGradient(lx, ly - 110, lx + 700, ly - 60);
    cone.addColorStop(0, `rgba(255, 210, 150, ${0.10 * flicker})`);
    cone.addColorStop(0.6, `rgba(255, 200, 140, ${0.03 * flicker})`);
    cone.addColorStop(1, 'rgba(255, 200, 140, 0)');
    ctx!.fillStyle = cone;
    ctx!.beginPath();
    ctx!.moveTo(lx - 16, ly - 112);
    ctx!.lineTo(lx + 16, ly - 112);
    ctx!.lineTo(lx + 700, ly + 120);
    ctx!.lineTo(lx + 380, ly + 180);
    ctx!.closePath();
    ctx!.fill();
    ctx!.restore();
  }

  function drawDust(): void {
    ctx!.save();
    ctx!.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      ctx!.fillStyle = m.warm
        ? `rgba(${C.ember}, ${0.55 * m.life})`
        : `rgba(196, 214, 226, ${0.22 * m.life})`;
      ctx!.fillRect(m.x, m.y, m.size, m.size);
    }
    ctx!.restore();
  }

  function spawnMote(): void {
    // 只让灰尘活在灯下那一带
    if (Math.random() > 0.55) return;
    motes.push({
      x: 150 + Math.random() * 620,
      y: 420 + Math.random() * 300,
      vx: 0.08 + Math.random() * 0.16,
      vy: -0.05 - Math.random() * 0.12,
      life: 1,
      size: 0.7 + Math.random() * 1.4,
      warm: true,
    });
  }

  function stepMotes(dt: number): void {
    for (let i = motes.length - 1; i >= 0; i -= 1) {
      const m = motes[i]!;
      m.x += m.vx * (dt / 16);
      m.y += m.vy * (dt / 16);
      m.life -= 0.0022 * (dt / 16);
      if (m.life <= 0) motes.splice(i, 1);
    }
    for (let i = embers.length - 1; i >= 0; i -= 1) {
      const e = embers[i]!;
      e.x += e.vx * (dt / 16);
      e.y += e.vy * (dt / 16);
      e.vy -= 0.004;
      e.life -= 0.008 * (dt / 16);
      if (e.life <= 0) embers.splice(i, 1);
    }
    for (const drop of rain) {
      drop.y += (drop.speed * dt) / 1000;
      if (drop.y > WINDOW_RECT[1] + WINDOW_RECT[3]) {
        drop.y = WINDOW_RECT[1] - 20;
        drop.x = WINDOW_RECT[0] + Math.random() * WINDOW_RECT[2];
      }
    }
  }

  function frame(now: number): void {
    const dt = Math.min(64, now - t0);
    t0 = now;
    time += dt;
    if (!ctx) return;

    dim += (dimTarget - dim) * 0.02;
    stepMotes(dt);
    spawnMote();

    wall();
    windowFrame();

    // 墙上的东西先画（会被桌子/人挡住的部分自然被挡）
    ctx.save();
    for (const key of ['clock', 'portrait', 'mirror', 'sign', 'curtain']) {
      const p = presence.get(key) ?? 0;
      if (p < 0.01) continue;
      const [x, y] = ANCHOR[key]!;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = p;
      DRAW[key]!();
      ctx.restore();
    }
    ctx.restore();

    armchair();
    figure(Math.sin(time * 0.0011) * 2.2);

    table();
    ctx.save();
    for (const key of ['lamp', 'kettle', 'cup', 'salt', 'bell', 'radio', 'photo', 'watch']) {
      const p = presence.get(key) ?? 0;
      if (p < 0.01) continue;
      const [x, y] = ANCHOR[key]!;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = p;
      DRAW[key]!();
      ctx.restore();
    }
    ctx.restore();

    // 窗前的空椅子、窗台的野花
    for (const key of ['chair', 'flowers']) {
      const p = presence.get(key) ?? 0;
      if (p < 0.01) continue;
      const [x, y] = ANCHOR[key]!;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = p;
      DRAW[key]!();
      ctx.restore();
    }

    lampLight();

    // 火星
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) {
      ctx.fillStyle = `rgba(${C.ember}, ${0.9 * e.life})`;
      ctx.fillRect(e.x, e.y, e.size, e.size);
    }
    ctx.restore();

    drawDust();

    // 结局：整间屋子的灯往下压一点
    if (dim < 0.999) {
      ctx.fillStyle = `rgba(4,5,7,${(1 - dim) * 0.75})`;
      ctx.fillRect(0, 0, W, H);
    }
    raf = requestAnimationFrame(frame);
  }

  size();
  window.addEventListener('resize', size);
  raf = requestAnimationFrame(frame);

  return {
    setMemories(factIds: string[]) {
      const want = new Set<string>();
      for (const id of factIds) {
        const key = OBJECT_BY_FACT[id];
        if (key) want.add(key);
      }
      // 灯是房间的一部分，永远在
      want.add('lamp');
      for (const key of Object.keys(ANCHOR)) {
        const target = want.has(key) ? 1 : 0;
        const current = presence.get(key) ?? 0;
        presence.set(key, current + (target - current) * 0.12);
      }
    },
    burn(factId: string) {
      const key = OBJECT_BY_FACT[factId];
      if (!key) return;
      const [x, y] = ANCHOR[key]!;
      for (let i = 0; i < 40; i += 1) {
        embers.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y - 30 + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.4) * 0.7,
          vy: -0.2 - Math.random() * 0.8,
          life: 1,
          size: 0.6 + Math.random() * 1.8,
          warm: true,
        });
      }
      // 立刻开始淡出，不要等下一次 setMemories
      presence.set(key, 0.35);
    },
    fade(to: number) {
      dimTarget = to;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
    },
  };
}
