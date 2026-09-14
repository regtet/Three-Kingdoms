/**
 * 将生成的水墨按钮图裁切为透明八边形，写入 menu 按钮路径。
 */
import path from 'path';
import sharp from 'sharp';

const SRC = path.resolve(
  'C:/Users/Administrator/.cursor/projects/c-Users-Administrator-Desktop-Three-Kingdoms/assets/btn_shuimo_plate.png',
);
const OUT = path.resolve('assets/resources/ui/menu');
const W = 620;
const H = 96;

function octagonMask(w: number, h: number): Buffer {
  const cut = Math.round(h * 0.28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <path d="M${cut},0 L${w - cut},0 L${w},${cut} L${w},${h - cut} L${w - cut},${h} L${cut},${h} L0,${h - cut} L0,${cut} Z" fill="white"/>
</svg>`;
  return Buffer.from(svg);
}

async function main() {
  const resized = await sharp(SRC)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .png()
    .toBuffer();

  const masked = await sharp(resized)
    .composite([{ input: octagonMask(W, H), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const names = [
    'btn_ink_main.png',
    'btn_ink_sub.png',
    'btn_ink_small.png',
    'btn_wood_primary.png',
    'btn_wood_secondary.png',
    'btn_wood_tertiary.png',
    'btn_wood_quaternary.png',
  ];
  for (const n of names) {
    await sharp(masked).toFile(path.join(OUT, n));
    console.log('wrote', n);
  }

  // 选中框：朱砂细线八边形
  const cut = Math.round(H * 0.28);
  const rim = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="108">
    <path d="M${cut + 8},4 L${640 - cut - 8},4 L636,${cut} L636,${108 - cut} L${640 - cut - 8},104 L${cut + 8},104 L4,${108 - cut} L4,${cut} Z"
      fill="none" stroke="#a02828" stroke-width="2.4" stroke-opacity="0.9"/>
  </svg>`;
  await sharp(Buffer.from(rim)).png().toFile(path.join(OUT, 'btn_selected_rim.png'));
  console.log('shuimo masked buttons ready');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
