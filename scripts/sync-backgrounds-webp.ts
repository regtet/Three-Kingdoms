/**
 * 同步 WebP 主菜单背景到 assets/resources/backgrounds/
 * 运行: npm run sync:backgrounds
 * 可选: BACKGROUND_SRC 源目录（默认 Downloads 下含 bg_*.webp 的文件夹）
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DST = path.join(__dirname, '../assets/resources/backgrounds');

function resolveSrcDir(): string {
  if (process.env.BACKGROUND_SRC) return path.resolve(process.env.BACKGROUND_SRC);
  const downloads = path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(downloads)) return downloads;
  for (const entry of fs.readdirSync(downloads, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(downloads, entry.name);
    if (fs.readdirSync(dir).some((f) => /^bg_.*\.webp$/i.test(f))) return dir;
  }
  return path.join(downloads, 'backgrounds');
}

function removeIfExists(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function main() {
  const SRC = resolveSrcDir();
  if (!fs.existsSync(SRC)) {
    console.error(`未找到源目录: ${SRC}`);
    process.exit(1);
  }

  fs.mkdirSync(DST, { recursive: true });
  let count = 0;

  for (const name of fs.readdirSync(SRC)) {
    if (!/^bg_.*\.webp$/i.test(name)) continue;
    const src = path.join(SRC, name);
    const dst = path.join(DST, name);
    fs.copyFileSync(src, dst);
    const base = dst.replace(/\.webp$/i, '');
    removeIfExists(`${base}.png`);
    removeIfExists(`${base}.png.meta`);
    removeIfExists(`${dst}.meta`);
    console.log(`  ✓ ${name}`);
    count++;
  }

  console.log(`\n同步背景 WebP: ${count}`);
  console.log('请在 Cocos 中刷新资源。');
}

main();
