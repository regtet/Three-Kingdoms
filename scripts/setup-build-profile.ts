/**
 * 写入 Cocos 构建默认配置：竖屏 + 自定义启动图标
 * 运行: npm run setup:build
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const PROFILE_DIR = path.join(ROOT, 'profiles/v2/packages');
const ANDROID_PROFILE = path.join(PROFILE_DIR, 'android.json');
const ICON_DEFAULT = path.join(ROOT, 'build-assets/icons/app-icon.png');
const NATIVE_RES = path.join(ROOT, 'native/engine/android/res');

const PORTRAIT = {
  portrait: true,
  upsideDown: false,
  landscapeLeft: false,
  landscapeRight: false,
};

const MIPMAP_SIZES: Record<string, number> = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

function patchOrientation(obj: Record<string, unknown> | undefined): void {
  if (!obj || typeof obj !== 'object') return;
  if ('orientation' in obj && typeof obj.orientation === 'object' && obj.orientation) {
    Object.assign(obj.orientation as Record<string, unknown>, PORTRAIT);
  }
}

function patchAndroidManifest(): void {
  const manifest = path.join(ROOT, 'native/engine/android/app/AndroidManifest.xml');
  if (!fs.existsSync(manifest)) {
    console.warn('未找到 AndroidManifest.xml，请先完成一次 Android 构建');
    return;
  }
  let xml = fs.readFileSync(manifest, 'utf8');
  const next = xml.replace(
    /android:screenOrientation="(?:sensorLandscape|landscape|sensorLandscape|userLandscape)"/g,
    'android:screenOrientation="portrait"',
  );
  if (next !== xml) {
    fs.writeFileSync(manifest, next, 'utf8');
    console.log('已更新 AndroidManifest.xml → screenOrientation=portrait');
  }
}

function patchAndroidProfile(): void {
  if (!fs.existsSync(ANDROID_PROFILE)) {
    console.warn('未找到 profiles/v2/packages/android.json，请在 Cocos 中先构建一次 Android');
    return;
  }

  const profile = JSON.parse(fs.readFileSync(ANDROID_PROFILE, 'utf8')) as {
    builder?: {
      options?: { android?: Record<string, unknown> };
      taskOptionsMap?: Record<string, Record<string, unknown>>;
    };
  };

  patchOrientation(profile.builder?.options?.android);
  const map = profile.builder?.taskOptionsMap;
  if (map) {
    for (const task of Object.values(map)) patchOrientation(task);
  }

  fs.writeFileSync(ANDROID_PROFILE, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  console.log('已更新 profiles/v2/packages/android.json → 竖屏 Portrait');
}

async function copyNativeLauncherIcons(): Promise<void> {
  if (!fs.existsSync(ICON_DEFAULT)) return;

  let sharp: typeof import('sharp').default;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('跳过 native 图标复制（缺少 sharp）');
    return;
  }

  if (!fs.existsSync(NATIVE_RES)) {
    console.warn('未找到 native/engine/android/res，请先完成一次 Android 构建');
    return;
  }

  let count = 0;
  for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
    const dir = path.join(NATIVE_RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, 'ic_launcher.png');
    await sharp(ICON_DEFAULT).resize(size, size, { fit: 'cover' }).png().toFile(dest);
    count++;
  }
  console.log(`已替换 native/engine/android/res 下 ${count} 个 ic_launcher.png`);
}

function main() {
  if (!fs.existsSync(ICON_DEFAULT)) {
    console.error('未找到 build-assets/icons/app-icon.png，请先运行: npm run prepare:icons');
    process.exit(1);
  }

  patchAndroidProfile();
  patchAndroidManifest();
  copyNativeLauncherIcons().then(() => {
    console.log('\n默认启动图标: build-assets/icons/app-icon.png（icon_01）');
    console.log('请重新打开 Cocos 构建面板，确认「屏幕方向」仅勾选 Portrait，然后重新打包。');
  });
}

main();
