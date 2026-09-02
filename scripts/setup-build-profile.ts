/**
 * 写入 Cocos 构建默认配置：竖屏、中文应用名、关闭 Cocos 闪屏、启动图标
 * 运行: npm run setup:build
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const PROFILE_DIR = path.join(ROOT, 'profiles/v2/packages');
const ANDROID_PROFILE = path.join(PROFILE_DIR, 'android.json');
const BUILDER_PROFILE = path.join(PROFILE_DIR, 'builder.json');
const ICON_DEFAULT = path.join(ROOT, 'build-assets/icons/app-icon.png');
const STRINGS_TEMPLATE = path.join(ROOT, 'build-assets/android/values/strings.xml');
const NATIVE_RES = path.join(ROOT, 'native/engine/android/res');
const APP_DISPLAY_NAME = '三国志 · 天下争锋';

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
  let next = xml.replace(
    /android:screenOrientation="(?:sensorLandscape|landscape|sensorLandscape|userLandscape)"/g,
    'android:screenOrientation="portrait"',
  );
  if (!next.includes('android:label="@string/app_name"')) {
    next = next.replace(/android:label="[^"]*"/, 'android:label="@string/app_name"');
  }
  if (next !== xml) {
    fs.writeFileSync(manifest, next, 'utf8');
    console.log('已更新 AndroidManifest.xml → portrait + app_name');
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
  console.log('已更新 android.json → 竖屏 Portrait');
}

function patchBuilderProfile(): void {
  if (!fs.existsSync(BUILDER_PROFILE)) {
    console.warn('未找到 builder.json，跳过闪屏/应用名补丁');
    return;
  }

  const profile = JSON.parse(fs.readFileSync(BUILDER_PROFILE, 'utf8')) as {
    BuildTaskManager?: { taskMap?: Record<string, { options?: Record<string, unknown> }> };
  };

  const taskMap = profile.BuildTaskManager?.taskMap;
  if (taskMap) {
    for (const task of Object.values(taskMap)) {
      if (!task.options) continue;
      task.options.useSplashScreen = false;
      task.options.name = APP_DISPLAY_NAME;
      if (task.options.packages && typeof task.options.packages === 'object') {
        const pkgs = task.options.packages as Record<string, unknown>;
        if (pkgs.android && typeof pkgs.android === 'object') {
          patchOrientation(pkgs.android as Record<string, unknown>);
        }
      }
    }
  }

  fs.writeFileSync(BUILDER_PROFILE, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  console.log('已更新 builder.json → 关闭 Cocos 闪屏、应用名');
}

function copyStringsXml(): void {
  if (!fs.existsSync(STRINGS_TEMPLATE)) return;
  const valuesDir = path.join(NATIVE_RES, 'values');
  if (!fs.existsSync(NATIVE_RES)) {
    console.warn('未找到 native/engine/android/res，请先完成一次 Android 构建');
    return;
  }
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.copyFileSync(STRINGS_TEMPLATE, path.join(valuesDir, 'strings.xml'));
  console.log(`已写入 strings.xml → ${APP_DISPLAY_NAME}`);
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
  patchBuilderProfile();
  patchAndroidManifest();
  copyStringsXml();
  copyNativeLauncherIcons().then(() => {
    console.log('\n打包前请确认：');
    console.log('  1. Cocos 构建面板 → 屏幕方向仅 Portrait');
    console.log('  2. 构建面板 → 取消勾选「使用 Splash Screen」');
    console.log('  3. 设计分辨率 720×1280，适配 fitHeight');
    console.log(`  4. 应用名：${APP_DISPLAY_NAME}`);
    console.log('然后重新构建 APK。');
  });
}

main();
