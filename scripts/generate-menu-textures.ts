/**
 * 生成主菜单「匾额」按钮族：细铜框 + 暗漆面 + 角饰，偏三国志古典，避免厚金边塑料感。
 * 运行：npm run gen:menu-ui
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUT = path.resolve('assets/resources/ui/menu');

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function plaqueSvg(
  w: number,
  h: number,
  tier: 'primary' | 'secondary' | 'tertiary' | 'quaternary',
): string {
  const r = tier === 'primary' ? 10 : 8;
  const pad = tier === 'primary' ? 5 : 4;
  const inner = pad + 3;
  const stud = Math.max(3, Math.round(h * 0.07));
  const barW = Math.max(10, Math.round(h * 0.14));

  // 角饰：小菱形铜钉
  const studs = [
    [pad + 10, pad + 10],
    [w - pad - 10, pad + 10],
    [pad + 10, h - pad - 10],
    [w - pad - 10, h - pad - 10],
  ]
    .map(
      ([x, y]) =>
        `<rect x="${x - stud / 2}" y="${y - stud / 2}" width="${stud}" height="${stud}" transform="rotate(45 ${x} ${y})" fill="url(#bronze)" stroke="#3a2810" stroke-width="0.8"/>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bronze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8c090"/>
      <stop offset="45%" stop-color="#a88848"/>
      <stop offset="100%" stop-color="#5a4020"/>
    </linearGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c9b078"/>
      <stop offset="50%" stop-color="#8a6a38"/>
      <stop offset="100%" stop-color="#4a3418"/>
    </linearGradient>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2c1c10"/>
      <stop offset="40%" stop-color="#1a100a"/>
      <stop offset="100%" stop-color="#0e0906"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6a4a22"/>
      <stop offset="50%" stop-color="#b8924a"/>
      <stop offset="100%" stop-color="#6a4a22"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="35%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.35"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.08  0 0 0 0 0.04  0 0 0 0.28 0"/>
    </filter>
  </defs>

  <!-- 外框：细铜 -->
  <rect width="${w}" height="${h}" rx="${r}" fill="url(#frame)"/>
  <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="${Math.max(2, r - 3)}" fill="#120c08"/>

  <!-- 漆面 -->
  <rect x="${inner}" y="${inner}" width="${w - inner * 2}" height="${h - inner * 2}" rx="${Math.max(2, r - 5)}" fill="url(#face)"/>
  <rect x="${inner}" y="${inner}" width="${w - inner * 2}" height="${h - inner * 2}" rx="${Math.max(2, r - 5)}" filter="url(#grain)" opacity="0.55"/>
  <rect x="${inner}" y="${inner}" width="${w - inner * 2}" height="${h - inner * 2}" rx="${Math.max(2, r - 5)}" fill="url(#sheen)"/>

  <!-- 左右铜柱 -->
  <rect x="${inner + 4}" y="${inner + 8}" width="${barW}" height="${h - inner * 2 - 16}" rx="2" fill="url(#bar)" opacity="0.85"/>
  <rect x="${w - inner - 4 - barW}" y="${inner + 8}" width="${barW}" height="${h - inner * 2 - 16}" rx="2" fill="url(#bar)" opacity="0.85"/>

  <!-- 内细线 -->
  <rect x="${inner + barW + 10}" y="${inner + 10}" width="${w - inner * 2 - barW * 2 - 20}" height="${h - inner * 2 - 20}"
        rx="2" fill="none" stroke="#c9a86a" stroke-opacity="0.28" stroke-width="1.2"/>

  ${studs}
</svg>`;
}

async function writePng(name: string, svg: string) {
  const file = path.join(OUT, name);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log('wrote', file);
}

async function main() {
  ensureDir(OUT);

  // 略扁、更匾额：高度压一点
  await writePng('btn_wood_primary.png', plaqueSvg(640, 112, 'primary'));
  await writePng('btn_wood_secondary.png', plaqueSvg(580, 96, 'secondary'));
  await writePng('btn_wood_tertiary.png', plaqueSvg(520, 88, 'tertiary'));
  await writePng('btn_wood_quaternary.png', plaqueSvg(440, 80, 'quaternary'));
  await writePng('btn_scroll.png', plaqueSvg(520, 88, 'tertiary'));
  await writePng('btn_bronze_small.png', plaqueSvg(440, 80, 'quaternary'));

  await writePng(
    'btn_selected_rim.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="660" height="120">
      <rect x="3" y="3" width="654" height="114" rx="10" fill="none" stroke="#e8c878" stroke-width="2.5" stroke-opacity="0.85"/>
      <rect x="8" y="8" width="644" height="104" rx="7" fill="none" stroke="#a07030" stroke-width="1" stroke-opacity="0.4"/>
    </svg>`,
  );

  await writePng(
    'mist_band.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="520">
      <defs>
        <linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d8c8a8" stop-opacity="0"/>
          <stop offset="40%" stop-color="#c4b090" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="#d8c8a8" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="520" fill="url(#m)"/>
    </svg>`,
  );

  await writePng(
    'vignette.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
      <defs>
        <radialGradient id="v" cx="50%" cy="40%" r="74%">
          <stop offset="35%" stop-color="#000" stop-opacity="0"/>
          <stop offset="75%" stop-color="#000" stop-opacity="0.42"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.72"/>
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#v)"/>
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
  console.log('menu textures done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
