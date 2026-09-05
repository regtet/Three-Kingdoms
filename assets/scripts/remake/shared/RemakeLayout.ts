/**
 * 复刻 UI 布局唯一坐标源（720×1280）
 * 新界面禁止写魔法数字；legacy OfficialLayout 仅旧代码过渡用
 */
export const RL = {
  W: 720,
  H: 1280,

  /** 标题屏 */
  TITLE_LOGO_Y: 420,
  TITLE_LOGO_W: 480,
  TITLE_LOGO_H: 176,
  TITLE_NAME_Y: 280,
  TITLE_ITEMS_START_Y: 80,
  TITLE_ITEM_GAP: 64,
  TITLE_ITEM_W: 420,
  TITLE_ITEM_H: 52,
  TITLE_BUILD_X: 300,
  TITLE_BUILD_Y: -600,

  /** 二级页通用 */
  PAGE_TITLE_Y: 520,
  PAGE_SUB_Y: 460,
  PAGE_LIST_START_Y: 300,
  PAGE_LIST_GAP: 64,
  PAGE_BODY_Y: 40,
  PAGE_BODY_W: 640,
  PAGE_ACTION_Y: -100,
  PAGE_BACK_Y: -560,

  /** 占位 / toast */
  TOAST_Y: 340,
  PLACEHOLDER_Y: 40,
} as const;

export const RC = {
  bg: { r: 10, g: 14, b: 24, a: 255 },
  panel: { r: 22, g: 28, b: 42, a: 240 },
  border: { r: 198, g: 168, b: 90, a: 255 },
  text: { r: 236, g: 228, b: 210, a: 255 },
  textDim: { r: 150, g: 145, b: 130, a: 255 },
  textGold: { r: 232, g: 196, b: 110, a: 255 },
  danger: { r: 200, g: 90, b: 80, a: 255 },
} as const;

export type RemakeColor = { r: number; g: number; b: number; a: number };
