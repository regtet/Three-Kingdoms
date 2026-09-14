/**
 * 生成主菜单古典材质按钮贴图（木牌 / 卷轴 / 铜牌），写入 assets/resources/ui/menu/
 * 运行：npm run gen:menu-ui
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUT = path.resolve('assets/resources/ui/menu');

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

/** 木牌：深色木纹 + 铜边 + 内槽 */
function woodPlaqueSvg(w: number, h: number, opts: { primary: boolean }): string {
  const stroke = opts.primary ? 10 : 7;
  const copper = opts.primary ? '#d4b06a' : '#b8954e';
  const copperDark = '#6a4e28';
  const wood = opts.primary ? '#4a2f18' : '#3d2814';
  const woodHi = opts.primary ? '#6b4424' : '#5a3a1e';
  const r = opts.primary ? 16 : 12;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${woodHi}"/>
      <stop offset="35%" stop-color="${wood}"/>
      <stop offset="70%" stop-color="#2e1c0e"/>
      <stop offset="100%" stop-color="${woodHi}" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0d090"/>
      <stop offset="45%" stop-color="${copper}"/>
      <stop offset="100%" stop-color="${copperDark}"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 0.35 0"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" rx="${r}" fill="url(#copper)"/>
  <rect x="${stroke}" y="${stroke}" width="${w - stroke * 2}" height="${h - stroke * 2}" rx="${r - 4}" fill="url(#wood)"/>
  <rect x="${stroke}" y="${stroke}" width="${w - stroke * 2}" height="${h - stroke * 2}" rx="${r - 4}" filter="url(#grain)" opacity="0.55"/>
  <rect x="${stroke + 6}" y="${stroke + 6}" width="${w - stroke * 2 - 12}" height="${h - stroke * 2 - 12}" rx="${r - 8}"
        fill="none" stroke="#1a1008" stroke-opacity="0.45" stroke-width="2"/>
  <rect x="${stroke + 3}" y="${stroke + 3}" width="${w - stroke * 2 - 6}" height="${Math.max(8, h * 0.18)}" rx="4"
        fill="#ffffff" fill-opacity="0.07"/>
</svg>`;
}

/** 卷轴：两端轴 + 旧纸 */
function scrollSvg(w: number, h: number): string {
  const axle = 28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#efe0c0"/>
      <stop offset="50%" stop-color="#e2cda8"/>
      <stop offset="100%" stop-color="#d2b78c"/>
    </linearGradient>
    <linearGradient id="axle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#5a3a1e"/>
      <stop offset="50%" stop-color="#8a6238"/>
      <stop offset="100%" stop-color="#5a3a1e"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.08  0 0 0 0.22 0"/>
    </filter>
  </defs>
  <rect x="0" y="4" width="${axle}" height="${h - 8}" rx="6" fill="url(#axle)"/>
  <rect x="${w - axle}" y="4" width="${axle}" height="${h - 8}" rx="6" fill="url(#axle)"/>
  <rect x="${axle - 4}" y="10" width="${w - axle * 2 + 8}" height="${h - 20}" rx="4" fill="url(#paper)" stroke="#8a6a3e" stroke-width="3"/>
  <rect x="${axle - 4}" y="10" width="${w - axle * 2 + 8}" height="${h - 20}" rx="4" filter="url(#grain)" opacity="0.5"/>
  <line x1="${axle + 20}" y1="${h / 2}" x2="${w - axle - 20}" y2="${h / 2}" stroke="#b89a6a" stroke-opacity="0.35" stroke-width="1"/>
</svg>`;
}

/** 小铜牌 */
function bronzeSvg(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="br" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a88848"/>
      <stop offset="40%" stop-color="#7a5c2e"/>
      <stop offset="100%" stop-color="#4a3618"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8c878"/>
      <stop offset="100%" stop-color="#8a6a30"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="10" fill="url(#rim)"/>
  <rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="7" fill="url(#br)"/>
  <rect x="8" y="8" width="${w - 16}" height="${h * 0.22}" rx="3" fill="#fff" fill-opacity="0.12"/>
</svg>`;
}

async function writePng(name: string, svg: string) {
  const file = path.join(OUT, name);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log('wrote', file);
}

async function main() {
  ensureDir(OUT);

  await writePng('btn_wood_primary.png', woodPlaqueSvg(720, 140, { primary: true }));
  await writePng('btn_wood_secondary.png', woodPlaqueSvg(640, 112, { primary: false }));
  await writePng('btn_scroll.png', scrollSvg(600, 108));
  await writePng('btn_bronze_small.png', bronzeSvg(420, 88));

  await writePng(
    'btn_selected_rim.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="140">
      <rect x="4" y="4" width="712" height="132" rx="16" fill="none" stroke="#e8c878" stroke-width="8" stroke-opacity="0.95"/>
    </svg>`,
  );

  await writePng(
    'mist_band.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="480">
      <defs>
        <linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dfe8f0" stop-opacity="0"/>
          <stop offset="40%" stop-color="#cfd8e0" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#dfe8f0" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="480" fill="url(#m)"/>
    </svg>`,
  );

  await writePng(
    'seal_zhu.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect x="4" y="4" width="88" height="88" rx="6" fill="#8b1a1a" stroke="#5c0f0f" stroke-width="3"/>
      <text x="48" y="58" text-anchor="middle" font-size="36" fill="#f0d0a0" font-family="serif">争</text>
    </svg>`,
  );

  await sharp({
    create: {
      width: 4,
      height: 4,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(OUT, 'pixel_white.png'));
  console.log('wrote pixel_white.png');
  console.log('menu textures done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
