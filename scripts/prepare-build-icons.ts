/**
 * 从 resources/icons 生成构建用 PNG 启动图标
 * 运行: npm run prepare:icons
 */
import * as fs from 'fs';
import * as path from 'path';

const ICONS = [
  { id: 'icon_01', label: '龙纹夜军' },
  { id: 'icon_02', label: '蜀旗浴血' },
  { id: 'icon_03', label: '攻城破阵' },
  { id: 'icon_04', label: '熔河关隘' },
  { id: 'icon_05', label: '黎民避祸' },
  { id: 'icon_06', label: '落日征途' },
  { id: 'icon_07', label: '寒夜围营' },
];

const SRC_DIR = path.join(__dirname, '../assets/resources/icons');
const OUT_DIR = path.join(__dirname, '../build-assets/icons');
const SIZES = [48, 72, 96, 144, 192, 512];

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.error('需要 sharp：npm install sharp --save-dev');
    process.exit(1);
  }
}

async function convertOne(sharp: typeof import('sharp').default, src: string, dest: string, size: number) {
  await sharp(src).resize(size, size, { fit: 'cover' }).png().toFile(dest);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const sharp = await loadSharp();
  let count = 0;

  for (const icon of ICONS) {
    const srcWebp = path.join(SRC_DIR, `${icon.id}.webp`);
    const srcPng = path.join(SRC_DIR, `${icon.id}.png`);
    const src = fs.existsSync(srcWebp) ? srcWebp : srcPng;
    if (!fs.existsSync(src)) {
      console.warn(`  跳过（无源文件）: ${icon.id}`);
      continue;
    }

    for (const size of SIZES) {
      const dest = path.join(OUT_DIR, `${icon.id}-${size}.png`);
      await convertOne(sharp, src, dest, size);
      count++;
    }
    const default512 = path.join(OUT_DIR, `${icon.id}.png`);
    await convertOne(sharp, src, default512, 512);
    count++;
  }

  const defaultSrc = path.join(SRC_DIR, 'icon_01.webp');
  if (fs.existsSync(defaultSrc)) {
    await convertOne(sharp, defaultSrc, path.join(OUT_DIR, 'app-icon.png'), 512);
    count++;
  }

  console.log(`生成构建图标 PNG: ${count} 个 → build-assets/icons/`);
  console.log('默认启动图标: build-assets/icons/app-icon.png（icon_01）');
  console.log('在 Cocos 构建面板 → Android/iOS → 图标 中选择此文件，或运行 npm run setup:build');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
