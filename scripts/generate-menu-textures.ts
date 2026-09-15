/**
 * 飘逸毛笔：干净浓墨 + 轻渗边（不做重模糊/彩噪）。
 * 起顿、中提、收尖上扬；四变体手感不同。
 * npm run gen:menu-ui
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const OUT = path.resolve('assets/resources/ui/menu');

type Variant = {
  name: string;
  seed: number;
  arch: number;
  startFat: number;
  midFat: number;
  endFat: number;
  endLift: number;
  ink: number;
  tilt: number;
};

const MAIN_VARIANTS: Variant[] = [
  { name: 'btn_ink_main.png', seed: 2, arch: 15, startFat: 42, midFat: 50, endFat: 5, endLift: 22, ink: 0.9, tilt: -1.6 },
  { name: 'btn_ink_main_b.png', seed: 7, arch: 10, startFat: 36, midFat: 46, endFat: 4, endLift: 26, ink: 0.84, tilt: 1.9 },
  { name: 'btn_ink_main_c.png', seed: 13, arch: 18, startFat: 40, midFat: 44, endFat: 4, endLift: 17, ink: 0.82, tilt: -2.5 },
  { name: 'btn_ink_main_d.png', seed: 19, arch: 12, startFat: 34, midFat: 48, endFat: 6, endLift: 24, ink: 0.88, tilt: 1.1 },
];

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spine(w: number, h: number, v: Variant, t: number) {
  const x = w * (0.07 + 0.86 * t);
  const cy = h * 0.58;
  const y = cy - Math.sin(t * Math.PI) * v.arch - t * t * v.endLift;
  let fat: number;
  if (t < 0.1) fat = v.startFat * (0.45 + 0.55 * (t / 0.1));
  else if (t < 0.48) fat = v.startFat + (v.midFat - v.startFat) * ((t - 0.1) / 0.38);
  else if (t < 0.72) fat = v.midFat * (1 - 0.2 * ((t - 0.48) / 0.24));
  else {
    const u = (t - 0.72) / 0.28;
    fat = v.midFat * 0.8 * (1 - u) + v.endFat * u;
  }
  return { x, y, fat: Math.max(1.8, fat) };
}

function smoothCurve(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function bodyPath(w: number, h: number, v: Variant): string {
  const rnd = mulberry32(v.seed);
  const n = 18;
  const top: { x: number; y: number }[] = [];
  const bot: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = spine(w, h, v, t);
    // 后段飞白：上下沿交错咬合，露出空隙
    const bite = t > 0.8 ? (t - 0.8) * p.fat * 0.55 : 0;
    const n1 = (rnd() - 0.5) * 1.6;
    const n2 = (rnd() - 0.5) * 1.4;
    top.push({ x: p.x, y: p.y - p.fat / 2 + n1 + bite * (rnd() > 0.5 ? 1 : 0.3) });
    bot.push({ x: p.x, y: p.y + p.fat / 2 + n2 - bite * (rnd() > 0.45 ? 1 : 0.25) });
  }
  const topD = smoothCurve(top);
  const botD = smoothCurve([...bot].reverse()).replace(/^M/, 'L');
  return `${topD} ${botD} Z`;
}

function flowingStrokeSvg(w: number, h: number, v: Variant): string {
  const body = bodyPath(w, h, v);
  const a = v.ink;
  // 中锋稍浓的内轮廓（缩小一圈）
  const inner = bodyPath(w, h, {
    ...v,
    startFat: v.startFat * 0.55,
    midFat: v.midFat * 0.55,
    endFat: v.endFat * 0.7,
    seed: v.seed + 3,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="fade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0a0908" stop-opacity="${(0.55 * a).toFixed(3)}"/>
      <stop offset="8%" stop-color="#070605" stop-opacity="${(0.95 * a).toFixed(3)}"/>
      <stop offset="55%" stop-color="#050403" stop-opacity="${a.toFixed(3)}"/>
      <stop offset="85%" stop-color="#080706" stop-opacity="${(0.75 * a).toFixed(3)}"/>
      <stop offset="100%" stop-color="#0a0908" stop-opacity="0"/>
    </linearGradient>
    <filter id="edge" x="-10%" y="-70%" width="120%" height="240%">
      <feGaussianBlur stdDeviation="1.05"/>
    </filter>
  </defs>
  <g transform="rotate(${v.tilt} ${w / 2} ${h / 2})">
    <!-- 极轻渗边 -->
    <path d="${body}" fill="url(#fade)" opacity="0.35" filter="url(#edge)"/>
    <!-- 主墨：清晰轮廓 -->
    <path d="${body}" fill="url(#fade)"/>
    <!-- 中锋 -->
    <path d="${inner}" fill="#030201" opacity="${(0.45 * a).toFixed(3)}"/>
  </g>
</svg>`;
}

async function write(name: string, svg: string, w: number, h: number) {
  await sharp(Buffer.from(svg), { density: 144 })
    .ensureAlpha()
    .resize(w, h, { fit: 'fill' })
    .png()
    .toFile(path.join(OUT, name));
  console.log('wrote', name, `${w}x${h}`);
}

async function writeMeta(file: string, uuid: string, w: number, h: number) {
  const hw = w / 2;
  const hh = h / 2;
  const display = file.replace('.png', '');
  const meta = {
    ver: '1.0.27',
    importer: 'image',
    imported: true,
    uuid,
    files: ['.json', '.png'],
    subMetas: {
      '6c48a': {
        importer: 'texture',
        uuid: `${uuid}@6c48a`,
        displayName: display,
        id: '6c48a',
        name: 'texture',
        userData: {
          wrapModeS: 'clamp-to-edge',
          wrapModeT: 'clamp-to-edge',
          imageUuidOrDatabaseUri: uuid,
          isUuid: true,
          visible: false,
          minfilter: 'linear',
          magfilter: 'linear',
          mipfilter: 'none',
          anisotropy: 0,
        },
        ver: '1.0.22',
        imported: true,
        files: ['.json'],
        subMetas: {},
      },
      f9941: {
        importer: 'sprite-frame',
        uuid: `${uuid}@f9941`,
        displayName: display,
        id: 'f9941',
        name: 'spriteFrame',
        userData: {
          trimThreshold: 1,
          rotated: false,
          offsetX: 0,
          offsetY: 0,
          trimX: 0,
          trimY: 0,
          width: w,
          height: h,
          rawWidth: w,
          rawHeight: h,
          borderTop: 0,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          packable: true,
          pixelsToUnit: 100,
          pivotX: 0.5,
          pivotY: 0.5,
          meshType: 0,
          vertices: {
            rawPosition: [-hw, -hh, 0, hw, -hh, 0, -hw, hh, 0, hw, hh, 0],
            indexes: [0, 1, 2, 2, 1, 3],
            uv: [0, h, w, h, 0, 0, w, 0],
            nuv: [0, 0, 1, 0, 0, 1, 1, 1],
            minPos: [-hw, -hh, 0],
            maxPos: [hw, hh, 0],
          },
          isUuid: true,
          imageUuidOrDatabaseUri: `${uuid}@6c48a`,
          atlasUuid: '',
          trimType: 'none',
        },
        ver: '1.0.12',
        imported: true,
        files: ['.json'],
        subMetas: {},
      },
    },
    userData: {
      type: 'sprite-frame',
      fixAlphaTransparencyArtifacts: false,
      hasAlpha: true,
      redirect: `${uuid}@6c48a`,
    },
  };
  await fs.writeFile(path.join(OUT, `${file}.meta`), JSON.stringify(meta, null, 2));
}

async function main() {
  const W = 820;
  const H = 168;

  for (const v of MAIN_VARIANTS) await write(v.name, flowingStrokeSvg(W, H, v), W, H);

  const sub: Variant = {
    name: 'sub',
    seed: 29,
    arch: 12,
    startFat: 30,
    midFat: 38,
    endFat: 4,
    endLift: 16,
    ink: 0.74,
    tilt: -1.0,
  };
  const opt: Variant = {
    name: 'opt',
    seed: 37,
    arch: 11,
    startFat: 18,
    midFat: 26,
    endFat: 3,
    endLift: 14,
    ink: 0.5,
    tilt: -1.3,
  };

  await write('btn_ink_sub.png', flowingStrokeSvg(760, 148, sub), 760, 148);
  await write('btn_ink_small.png', flowingStrokeSvg(760, 148, { ...sub, seed: 31, tilt: 1.2 }), 760, 148);
  await write('btn_ink_option.png', flowingStrokeSvg(780, 128, opt), 780, 128);
  await write('row_slip.png', flowingStrokeSvg(780, 128, { ...opt, seed: 41, tilt: 0.8 }), 780, 128);
  await write('btn_wood_primary.png', flowingStrokeSvg(W, H, MAIN_VARIANTS[0]), W, H);
  await write('btn_wood_secondary.png', flowingStrokeSvg(W, H, MAIN_VARIANTS[1]), W, H);
  await write('btn_wood_tertiary.png', flowingStrokeSvg(760, 148, sub), 760, 148);
  await write(
    'btn_wood_quaternary.png',
    flowingStrokeSvg(760, 148, { ...sub, seed: 31, tilt: 1.2 }),
    760,
    148,
  );

  await write(
    'btn_selected_rim.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="168">
      <defs>
        <linearGradient id="zhu" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#8b1a1a" stop-opacity="0"/>
          <stop offset="40%" stop-color="#a03030" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#8b1a1a" stop-opacity="0"/>
        </linearGradient>
        <filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter>
      </defs>
      <path d="M90,132 C240,108 380,142 510,118 C650,90 740,138 780,116"
            fill="none" stroke="url(#zhu)" stroke-width="2.2" stroke-linecap="round" filter="url(#b)"/>
    </svg>`,
    840,
    168,
  );

  await writeMeta('btn_ink_main.png', 'a1111111-1111-4111-8111-111111111101', W, H);
  await writeMeta('btn_ink_main_b.png', 'a1111111-1111-4111-8111-11111111110b', W, H);
  await writeMeta('btn_ink_main_c.png', 'a1111111-1111-4111-8111-11111111110c', W, H);
  await writeMeta('btn_ink_main_d.png', 'a1111111-1111-4111-8111-11111111110d', W, H);
  await writeMeta('btn_ink_sub.png', 'a1111111-1111-4111-8111-111111111102', 760, 148);
  await writeMeta('btn_ink_small.png', 'a1111111-1111-4111-8111-111111111103', 760, 148);
  await writeMeta('btn_ink_option.png', 'a1111111-1111-4111-8111-11111111110a', 780, 128);

  console.log('clean flowing brush done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
