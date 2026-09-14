/**
 * 水墨风八边形按钮贴图：墨晕底 + 笔触金线 + 左右朱砂圆印。
 * npm run gen:menu-ui
 */
import path from 'path';
import sharp from 'sharp';

const OUT = path.resolve('assets/resources/ui/menu');

function octagonPath(w: number, h: number, cut: number): string {
  const c = cut;
  return `M${c},0 L${w - c},0 L${w},${c} L${w},${h - c} L${w - c},${h} L${c},${h} L0,${h - c} L0,${c} Z`;
}

/** 水墨匾：宣纸墨晕，非金属浮雕 */
function shuimoOctagon(w: number, h: number): string {
  const cut = Math.round(h * 0.28);
  const inset = 4;
  const innerCut = Math.max(4, cut - 2);
  const cxL = 38;
  const cxR = w - 38;
  const cy = h / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <!-- 淡墨外框（焦墨笔触感） -->
    <linearGradient id="inkFrame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a342c"/>
      <stop offset="50%" stop-color="#1a1612"/>
      <stop offset="100%" stop-color="#0e0c0a"/>
    </linearGradient>
    <!-- 匾面：浓淡墨晕 -->
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2c2620"/>
      <stop offset="35%" stop-color="#181410"/>
      <stop offset="70%" stop-color="#0c0a08"/>
      <stop offset="100%" stop-color="#1e1a16"/>
    </linearGradient>
    <radialGradient id="bleed" cx="30%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#4a4038" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="#1a1612" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bleed2" cx="75%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#2a2218" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <!-- 泥金笔触（哑光，非金属高光） -->
    <linearGradient id="inkGold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8a6a30" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#c9a858" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#8a6a30" stop-opacity="0.55"/>
    </linearGradient>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.35  0 0 0 0.22 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="softEdge">
      <feGaussianBlur stdDeviation="0.6"/>
    </filter>
  </defs>

  <!-- 外层焦墨框 -->
  <path d="${octagonPath(w, h, cut)}" fill="url(#inkFrame)"/>

  <!-- 内层墨晕 -->
  <path d="${octagonPath(w - inset * 2, h - inset * 2, innerCut)}"
        transform="translate(${inset},${inset})" fill="url(#wash)"/>
  <path d="${octagonPath(w - inset * 2, h - inset * 2, innerCut)}"
        transform="translate(${inset},${inset})" fill="url(#bleed)"/>
  <path d="${octagonPath(w - inset * 2, h - inset * 2, innerCut)}"
        transform="translate(${inset},${inset})" fill="url(#bleed2)"/>

  <!-- 宣纸肌理叠在墨上 -->
  <path d="${octagonPath(w - inset * 2, h - inset * 2, innerCut)}"
        transform="translate(${inset},${inset})" filter="url(#paper)" opacity="0.35"/>

  <!-- 内圈泥金笔线（细、哑） -->
  <path d="${octagonPath(w - inset * 2 - 8, h - inset * 2 - 8, Math.max(3, innerCut - 3))}"
        transform="translate(${inset + 4},${inset + 4})"
        fill="none" stroke="url(#inkGold)" stroke-width="1.8"/>

  <!-- 外沿淡金飞白 -->
  <path d="${octagonPath(w - 2, h - 2, cut - 1)}"
        transform="translate(1,1)"
        fill="none" stroke="#d4b060" stroke-opacity="0.35" stroke-width="1.2" filter="url(#softEdge)"/>

  <!-- 左右朱砂小印（水墨卷常见） -->
  <circle cx="${cxL}" cy="${cy}" r="13" fill="#8b1a1a" fill-opacity="0.88"/>
  <circle cx="${cxL}" cy="${cy}" r="13" fill="none" stroke="#c9a858" stroke-opacity="0.5" stroke-width="1"/>
  <circle cx="${cxL}" cy="${cy}" r="5" fill="#f0d0a0" fill-opacity="0.25"/>

  <circle cx="${cxR}" cy="${cy}" r="13" fill="#8b1a1a" fill-opacity="0.88"/>
  <circle cx="${cxR}" cy="${cy}" r="13" fill="none" stroke="#c9a858" stroke-opacity="0.5" stroke-width="1"/>
  <circle cx="${cxR}" cy="${cy}" r="5" fill="#f0d0a0" fill-opacity="0.25"/>
</svg>`;
}

async function write(name: string, svg: string) {
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, name));
  console.log('wrote', name);
}

async function main() {
  const svg = shuimoOctagon(620, 96);
  for (const name of [
    'btn_ink_main.png',
    'btn_ink_sub.png',
    'btn_ink_small.png',
    'btn_wood_primary.png',
    'btn_wood_secondary.png',
    'btn_wood_tertiary.png',
    'btn_wood_quaternary.png',
  ]) {
    await write(name, svg);
  }

  await write(
    'btn_selected_rim.png',
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="108">
      <path d="M28,2 L612,2 L638,26 L638,82 L612,106 L28,106 L2,82 L2,26 Z"
            fill="none" stroke="#a02828" stroke-width="2.2" stroke-opacity="0.85"/>
      <path d="M32,6 L608,6 L632,28 L632,80 L608,102 L32,102 L8,80 L8,28 Z"
            fill="none" stroke="#c9a858" stroke-width="1" stroke-opacity="0.45"/>
    </svg>`,
  );

  console.log('shuimo button textures done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
