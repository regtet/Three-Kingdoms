/**
 * 最小主菜单产品规格（写死，禁止扩功能）。
 * 标题屏仅四入口；子页字段在此锁定。
 */

/** 标题层 / 子层 id，与 RemakeRoot 一致 */
export type MenuLayerId =
  | 'title'
  | 'scenario'
  | 'ruler'
  | 'continue'
  | 'gallery'
  | 'settings'
  | 'play';

export type TitleEntryId = 'newGame' | 'continue' | 'gallery' | 'settings';

export const MENU_BRAND_SUB = '三国志·天下争锋';

/** 标题屏入口：文案 + 目标层。继续游戏由 hasSave 决定是否显示（无存档隐藏，不灰显） */
export const TITLE_ENTRIES: ReadonlyArray<{
  id: TitleEntryId;
  label: string;
  layer: Exclude<MenuLayerId, 'title' | 'ruler' | 'play'>;
  /** 仅 continue 为 true：无存档时整项隐藏 */
  requireSave?: boolean;
}> = [
  { id: 'newGame', label: '新游戏', layer: 'scenario' },
  { id: 'continue', label: '继续游戏', layer: 'continue', requireSave: true },
  { id: 'gallery', label: '武将图鉴', layer: 'gallery' },
  { id: 'settings', label: '设置', layer: 'settings' },
];

/** 新游戏流：选剧本 → 选君主 → 开始 */
export const NEW_GAME_FLOW = ['scenario', 'ruler', 'start'] as const;

export const PLACEHOLDER_TITLES: Record<
  Exclude<MenuLayerId, 'title'>,
  string
> = {
  scenario: '选择剧本',
  ruler: '选择君主',
  continue: '继续游戏',
  gallery: '武将图鉴',
  settings: '设置',
  play: '开局',
};

/** 子页最小字段 */
export const SCREEN_FIELDS = {
  scenario: ['name', 'era', 'blurb', 'confirm', 'back'] as const,
  ruler: ['factionColor', 'rulerName', 'factionBlurb', 'confirm', 'back'] as const,
  continue: ['slotTime', 'ruler', 'turnSummary', 'load', 'delete', 'back'] as const,
  gallery: ['listAvatar', 'listName', 'detailAvatar', 'attrs', 'faction', 'bio'] as const,
  settings: ['musicToggle', 'musicVolume', 'sfxToggle', 'sfxVolume', 'display', 'language', 'back'] as const,
} as const;

export const SETTINGS_KEYS = {
  musicEnabled: 'tk_set_music_on',
  musicVolume: 'tk_set_music_vol',
  sfxEnabled: 'tk_set_sfx_on',
  sfxVolume: 'tk_set_sfx_vol',
  language: 'tk_set_lang',
} as const;

export const SETTINGS_DEFAULTS = {
  musicEnabled: true,
  musicVolume: 0.55,
  sfxEnabled: true,
  sfxVolume: 1,
  language: 'zh-Hans',
} as const;

export function titleEntryVisible(
  entry: (typeof TITLE_ENTRIES)[number],
  hasSaveSlot: boolean,
): boolean {
  if (entry.requireSave) return hasSaveSlot;
  return true;
}
