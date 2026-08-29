/**
 * 同步 WebP 立绘到 assets/resources/portraits/
 * 运行: npm run sync:portraits
 * 可选: PORTRAIT_SRC 源目录（默认 ~/Downloads/portraits）
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SRC = process.env.PORTRAIT_SRC
  ? path.resolve(process.env.PORTRAIT_SRC)
  : path.join(os.homedir(), 'Downloads/portraits');
const DST = path.join(__dirname, '../assets/resources/portraits');

function removeIfExists(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function syncFile(srcFile: string, dstFile: string): void {
  fs.copyFileSync(srcFile, dstFile);
  const base = dstFile.replace(/\.webp$/i, '');
  removeIfExists(`${base}.png`);
  removeIfExists(`${base}.png.meta`);
  removeIfExists(`${dstFile}.meta`);
}

function syncDir(srcDir: string, dstDir: string): { webp: number; skipped: number } {
  fs.mkdirSync(dstDir, { recursive: true });
  let webp = 0;
  let skipped = 0;

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);

    if (entry.isDirectory()) {
      const sub = syncDir(srcPath, dstPath);
      webp += sub.webp;
      skipped += sub.skipped;
      continue;
    }

    if (!entry.name.toLowerCase().endsWith('.webp')) {
      skipped++;
      continue;
    }

    syncFile(srcPath, dstPath);
    webp++;
  }

  return { webp, skipped };
}

function cleanupOrphanPng(dir: string): number {
  let removed = 0;
  if (!fs.existsSync(dir)) return 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removed += cleanupOrphanPng(full);
      continue;
    }
    if (!entry.name.toLowerCase().endsWith('.png')) continue;
    const webp = full.replace(/\.png$/i, '.webp');
    if (fs.existsSync(webp)) {
      removeIfExists(full);
      removeIfExists(`${full}.meta`);
      removed++;
    }
  }
  return removed;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`未找到源目录: ${SRC}`);
    process.exit(1);
  }

  console.log(`源: ${SRC}`);
  console.log(`目标: ${DST}\n`);

  const { webp, skipped } = syncDir(SRC, DST);
  const orphanPng = cleanupOrphanPng(DST);

  console.log('── 汇总 ──');
  console.log(`同步 WebP: ${webp}`);
  console.log(`跳过非 webp: ${skipped}`);
  console.log(`清理残留 PNG: ${orphanPng}`);
  console.log('\n请在 Cocos 中刷新资源以导入 WebP。');
}

main();
