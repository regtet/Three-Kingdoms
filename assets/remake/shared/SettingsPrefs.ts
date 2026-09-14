/**
 * 设置读写（localStorage）。供设置页与 MenuChrome 音量共用。
 */
import {
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
} from './MenuSpec';
import { getDefaultStorage, type StorageLike } from './SaveProbe';

export type SettingsState = {
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  language: string;
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function readBool(storage: StorageLike, key: string, fallback: boolean): boolean {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  return raw === '1' || raw === 'true';
}

function readNum(storage: StorageLike, key: string, fallback: number): number {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? clamp01(n) : fallback;
}

export function loadSettings(storage: StorageLike = getDefaultStorage()): SettingsState {
  return {
    musicEnabled: readBool(storage, SETTINGS_KEYS.musicEnabled, SETTINGS_DEFAULTS.musicEnabled),
    musicVolume: readNum(storage, SETTINGS_KEYS.musicVolume, SETTINGS_DEFAULTS.musicVolume),
    sfxEnabled: readBool(storage, SETTINGS_KEYS.sfxEnabled, SETTINGS_DEFAULTS.sfxEnabled),
    sfxVolume: readNum(storage, SETTINGS_KEYS.sfxVolume, SETTINGS_DEFAULTS.sfxVolume),
    language: storage.getItem(SETTINGS_KEYS.language) ?? SETTINGS_DEFAULTS.language,
  };
}

export function saveSettings(
  next: SettingsState,
  storage: StorageLike = getDefaultStorage(),
): void {
  storage.setItem(SETTINGS_KEYS.musicEnabled, next.musicEnabled ? '1' : '0');
  storage.setItem(SETTINGS_KEYS.musicVolume, String(clamp01(next.musicVolume)));
  storage.setItem(SETTINGS_KEYS.sfxEnabled, next.sfxEnabled ? '1' : '0');
  storage.setItem(SETTINGS_KEYS.sfxVolume, String(clamp01(next.sfxVolume)));
  storage.setItem(SETTINGS_KEYS.language, next.language);
}
