import { DEFAULT_MENU_BACKGROUND_ID, normalizeMenuBackgroundId } from '../core/data/menuBackgrounds';
import { DEFAULT_GAME_ICON_ID, normalizeGameIconId } from '../core/data/gameIcons';

export interface GameSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
  confirmEndTurn: boolean;
  skipAiOverlay: boolean;
  battleCutscene: boolean;
  tacticalBattle: boolean;
  menuBackgroundId: string;
  gameIconId: string;
}

const SETTINGS_KEY = 'tk_settings';

export const DEFAULT_SETTINGS: GameSettings = {
  bgmEnabled: true,
  sfxEnabled: true,
  bgmVolume: 0.6,
  sfxVolume: 0.8,
  confirmEndTurn: true,
  skipAiOverlay: false,
  battleCutscene: true,
  tacticalBattle: true,
  menuBackgroundId: DEFAULT_MENU_BACKGROUND_ID,
  gameIconId: DEFAULT_GAME_ICON_ID,
};

export function loadSettings(): GameSettings {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const data = JSON.parse(raw) as Partial<GameSettings>;
    return {
      bgmEnabled: data.bgmEnabled ?? DEFAULT_SETTINGS.bgmEnabled,
      sfxEnabled: data.sfxEnabled ?? DEFAULT_SETTINGS.sfxEnabled,
      bgmVolume: clamp01(data.bgmVolume ?? DEFAULT_SETTINGS.bgmVolume),
      sfxVolume: clamp01(data.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
      confirmEndTurn: data.confirmEndTurn ?? DEFAULT_SETTINGS.confirmEndTurn,
      skipAiOverlay: data.skipAiOverlay ?? DEFAULT_SETTINGS.skipAiOverlay,
      battleCutscene: data.battleCutscene ?? DEFAULT_SETTINGS.battleCutscene,
      tacticalBattle: data.tacticalBattle ?? DEFAULT_SETTINGS.tacticalBattle,
      menuBackgroundId: normalizeMenuBackgroundId(data.menuBackgroundId ?? DEFAULT_SETTINGS.menuBackgroundId),
      gameIconId: normalizeGameIconId(data.gameIconId ?? DEFAULT_SETTINGS.gameIconId),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch { /* ignore */ }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
