import { describe, expect, it } from 'vitest';
import {
  NEW_GAME_FLOW,
  PLACEHOLDER_TITLES,
  TITLE_ENTRIES,
  titleEntryVisible,
} from '../assets/remake/shared/MenuSpec';
import {
  MENU_BG_PATH,
  MENU_BGM_PATH,
  MENU_CLICK_SFX,
  RL,
} from '../assets/remake/shared/RemakeLayout';
import { REMAKE_BUILD_TAG } from '../assets/remake/version';
import { SCENARIOS, GALLERY_OFFICERS, rulersForScenario } from '../assets/remake/shared/MenuCatalog';
import {
  addSave,
  deleteSave,
  listSaves,
  writeSaves,
} from '../assets/remake/shared/SaveStore';
import { SAVE_STORAGE_KEY, type StorageLike } from '../assets/remake/shared/SaveProbe';
import { loadSettings, saveSettings } from '../assets/remake/shared/SettingsPrefs';

function mem(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

describe('MenuSpec', () => {
  it('标题屏仅四入口', () => {
    expect(TITLE_ENTRIES).toHaveLength(4);
  });

  it('无存档时隐藏继续游戏', () => {
    const cont = TITLE_ENTRIES.find((e) => e.id === 'continue')!;
    expect(titleEntryVisible(cont, false)).toBe(false);
    expect(titleEntryVisible(cont, true)).toBe(true);
  });

  it('新游戏流与占位标题', () => {
    expect([...NEW_GAME_FLOW]).toEqual(['scenario', 'ruler', 'start']);
    expect(PLACEHOLDER_TITLES.play).toBe('开局');
  });
});

describe('MenuCatalog', () => {
  it('至少 3 个剧本且有君主', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(3);
    expect(rulersForScenario(SCENARIOS[0].id).length).toBeGreaterThan(0);
  });

  it('图鉴有头像与五维', () => {
    expect(GALLERY_OFFICERS.length).toBeGreaterThanOrEqual(10);
    const o = GALLERY_OFFICERS[0];
    expect(o.portrait).toBeTruthy();
    expect(o.force).toBeGreaterThan(0);
  });
});

describe('SaveStore', () => {
  it('增删存档', () => {
    const s = mem();
    writeSaves([], s);
    expect(listSaves(s)).toHaveLength(0);
    addSave(
      {
        scenarioId: 'y200',
        scenarioName: '官渡之战',
        rulerName: '曹操',
        factionId: 'wei',
        year: 200,
        month: 8,
      },
      s,
    );
    expect(listSaves(s)).toHaveLength(1);
    expect(s.getItem(SAVE_STORAGE_KEY)).toContain('曹操');
    deleteSave(listSaves(s)[0].id, s);
    expect(listSaves(s)).toHaveLength(0);
  });
});

describe('SettingsPrefs', () => {
  it('读写音量', () => {
    const s = mem();
    saveSettings(
      {
        musicEnabled: true,
        musicVolume: 0.4,
        sfxEnabled: false,
        sfxVolume: 0.8,
        language: 'zh-Hans',
      },
      s,
    );
    const loaded = loadSettings(s);
    expect(loaded.musicVolume).toBe(0.4);
    expect(loaded.sfxEnabled).toBe(false);
  });
});

describe('Title art paths', () => {
  it('背景为水墨卷轴、点击为 ui_tap、BGM 为 menu_bgm', () => {
    expect(MENU_BG_PATH).toBe('ui/backgrounds/bg_ink_scroll');
    expect(MENU_CLICK_SFX).toBe('audio/ui_tap');
    expect(MENU_BGM_PATH).toBe('audio/menu_bgm');
  });

  it('设计分辨率、统一按钮与构建号', () => {
    expect(RL.W).toBe(1080);
    expect(RL.H).toBe(1920);
    expect(RL.btnPrimaryW).toBe(RL.btnSecondaryW);
    expect(RL.btnPrimaryH).toBe(RL.btnQuaternaryH);
    expect(RL.btnFontSize).toBe(40);
    expect(REMAKE_BUILD_TAG).toBe('REMAKE-v0.3.5-flow-brush');
  });
});
