/**
 * 导入 stitch_three_kingdoms_strategic_hegemony 人物彩绘
 * 运行: npm run import:portraits
 * 可选: STITCH_DIRS 环境变量，分号分隔多个源目录
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SCENARIO_001 } from '../assets/scripts/core/data/scenario_001';
import { SCENARIO_002 } from '../assets/scripts/core/data/scenario_002';
import {
  MISSING_GAME_PORTRAITS,
  PORTRAIT_ID_ALIASES,
  PORTRAIT_POOL_LABELS,
  STITCH_PORTRAIT_TO_GAME_ID,
  STITCH_PORTRAIT_TO_POOL_ID,
} from '../assets/scripts/core/data/portraitMap';

const OUT_DIR = path.join(__dirname, '../assets/resources/portraits');
const POOL_DIR = path.join(OUT_DIR, 'pool');

function resolveStitchDirs(): string[] {
  const fromEnv = process.env.STITCH_DIRS?.split(';').map((s) => s.trim()).filter(Boolean) ?? [];
  const defaults = [
    path.join(__dirname, '../stitch_three_kingdoms_strategic_hegemony'),
    path.join(os.homedir(), 'Downloads/stitch_three_kingdoms_strategic_hegemony'),
  ];
  const seen = new Set<string>();
  const dirs: string[] = [];
  for (const d of [...defaults, ...fromEnv]) {
    const abs = path.resolve(d);
    if (!fs.existsSync(abs) || seen.has(abs)) continue;
    seen.add(abs);
    dirs.push(abs);
  }
  return dirs;
}

function collectGamePortraitIds(): string[] {
  const ids = new Set<string>();
  for (const sc of [SCENARIO_001, SCENARIO_002]) {
    for (const g of sc.generals) ids.add(g.id);
    for (const w of sc.wildGenerals ?? []) ids.add(w.id);
  }
  return [...ids];
}

function stitchSlugToPoolKey(folderName: string): string {
  const m = folderName.match(/^professional_game_portrait_of_(.+?)_(?:the_|legendary|masterful|a_wise)/);
  if (m) return m[1];
  return folderName.replace(/^professional_game_portrait_of_/, '').slice(0, 40);
}

function resolvePoolKey(folder: string): string {
  return STITCH_PORTRAIT_TO_POOL_ID[folder] ?? stitchSlugToPoolKey(folder);
}

function removeMeta(filePath: string): void {
  const meta = `${filePath}.meta`;
  if (fs.existsSync(meta)) fs.unlinkSync(meta);
}

function main() {
  const stitchDirs = resolveStitchDirs();
  if (stitchDirs.length === 0) {
    console.error('未找到任何 Stitch 源目录。请设置 STITCH_DIRS 或将文件夹放到项目根或 Downloads。');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(POOL_DIR, { recursive: true });

  const gameIds = collectGamePortraitIds();
  const processedFolders = new Set<string>();
  let gameCount = 0;
  let poolCount = 0;
  let skipCount = 0;
  let unmappedCount = 0;

  console.log('源目录:');
  for (const d of stitchDirs) console.log(`  · ${d}`);
  console.log('');

  for (const stitchDir of stitchDirs) {
    const folders = fs.readdirSync(stitchDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const folder of folders) {
      if (processedFolders.has(folder)) continue;
      processedFolders.add(folder);

      const src = path.join(stitchDir, folder, 'screen.png');
      if (!fs.existsSync(src)) {
        console.warn(`  跳过（无 screen.png）: ${folder}`);
        skipCount++;
        continue;
      }

      const gameId = STITCH_PORTRAIT_TO_GAME_ID[folder];
      if (gameId) {
        const dest = path.join(OUT_DIR, `${gameId}.png`);
        fs.copyFileSync(src, dest);
        removeMeta(dest);
        console.log(`  ✓ 游戏 ${gameId}.png`);
        gameCount++;
        continue;
      }

      const poolKey = resolvePoolKey(folder);
      const label = PORTRAIT_POOL_LABELS[poolKey] ?? poolKey;
      const poolName = `pool_${poolKey}.png`;
      const dest = path.join(POOL_DIR, poolName);
      fs.copyFileSync(src, dest);
      removeMeta(dest);

      const mapped = STITCH_PORTRAIT_TO_POOL_ID[folder] ? '映射' : '推断';
      if (!STITCH_PORTRAIT_TO_POOL_ID[folder]) unmappedCount++;
      console.log(`  ○ 储备 ${poolName} (${label}) [${mapped}]`);
      poolCount++;
    }
  }

  for (const [aliasId, sourceId] of Object.entries(PORTRAIT_ID_ALIASES)) {
    const src = path.join(OUT_DIR, `${sourceId}.png`);
    const dest = path.join(OUT_DIR, `${aliasId}.png`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      removeMeta(dest);
      console.log(`  ↪ 别名 ${aliasId}.png ← ${sourceId}.png`);
    }
  }

  const covered = new Set([
    ...Object.values(STITCH_PORTRAIT_TO_GAME_ID),
    ...Object.keys(PORTRAIT_ID_ALIASES),
  ]);
  const missing = gameIds.filter((id) => !covered.has(id));
  const poolFiles = fs.existsSync(POOL_DIR)
    ? fs.readdirSync(POOL_DIR).filter((f) => f.endsWith('.png')).length
    : 0;

  console.log('\n── 汇总 ──');
  console.log(`处理文件夹: ${processedFolders.size}`);
  console.log(`导入游戏立绘: ${gameCount} + 别名 ${Object.keys(PORTRAIT_ID_ALIASES).length}`);
  console.log(`本次储备导入: ${poolCount}（pool/ 总计 ${poolFiles} 张）`);
  console.log(`跳过: ${skipCount}`);
  if (unmappedCount) console.warn(`未显式映射（靠 slug 推断）: ${unmappedCount}，建议补进 portraitMap.ts`);

  console.log('\n── 重名处理 ──');
  console.log('  zhang_bao = 张宝（黄巾） | zhang_bao_son = 张苞（关家）');
  console.log('  yu_jin = 于禁 | yu_ji = 于吉');
  console.log('  gongsun_yuan = 公孙渊 | gongsun_du = 公孙度');

  console.log('\n── 测试剧本仍缺立绘 ──');
  if (missing.length === 0) {
    console.log('  （无）');
  } else {
    for (const id of missing) {
      const known = MISSING_GAME_PORTRAITS.find((m) => m.id === id);
      console.log(`  ✗ ${id}.png  ${known?.name ?? id}`);
    }
  }

  console.log('\n请在 Cocos 中刷新资源（或重新打开项目）以导入新 PNG。');
}

main();
