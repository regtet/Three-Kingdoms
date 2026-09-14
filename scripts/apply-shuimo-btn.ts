/**
 * 水墨菜单按钮：深墨匾 + 哑光金线 + 朱砂印；切角透明干净（无棋盘格）。
 */
import path from 'path';
import sharp from 'sharp';

const SRC = path.resolve(
  'C:/Users/Administrator/.cursor/projects/c-Users-Administrator-Desktop-Three-Kingdoms/assets/btn_ink_opaque.png',
);
const OUT = path.resolve('assets/resources/ui/menu');
const W = 620;
const H = 96;

function octagonMask(w: number, h: number): Buffer {
  const cut = Math.round(h * 0.22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <path fill="white" d="M${cut},0 L${w - cut},0 L${w},${cut} L${w},${h - cut} L${w - cut},${h} L${cut},${h} L0,${h - cut} L0,${cut} Z"/>
</svg>`;
  return Buffer.from(svg);
}

async function main() {
  // 先铺一层深墨底，再盖水墨图，避免透明处透出棋盘/花边
  const under = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 18, g: 14, b: 10, alpha: 255 },
    },
  })
    .png()
    .toBuffer();

  const art = await sharp(SRC)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .png()
    .toBuffer();

  const composed = await sharp(under)
    .composite([{ input: art, blend: 'over' }])
    .png()
    .toBuffer();

  const masked = await sharp(composed)
    .composite([{ input: octagonMask(W, H), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 把完全透明像素 RGB 清零，避免预乘花边
  const { data, info } = await sharp(masked).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else if (data[i + 3] < 255) {
      // 半透明边缘压到实心，减少毛边
      data[i + 3] = 255;
    }
  }
  const cleaned = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
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
    await sharp(cleaned).toFile(path.join(OUT, n));
    console.log('wrote', n);
  }

  const cut = Math.round(H * 0.22);
  const rim = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="108">
    <path d="M${cut + 10},4 L${630 - cut},4 L636,${cut} L636,${108 - cut} L${630 - cut},104 L${cut + 10},104 L4,${108 - cut} L4,${cut} Z"
      fill="none" stroke="#c9a040" stroke-width="2.2" stroke-opacity="0.9"/>
  </svg>`;
  await sharp(Buffer.from(rim)).png().toFile(path.join(OUT, 'btn_selected_rim.png'));
  console.log('ink menu buttons optimized');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
