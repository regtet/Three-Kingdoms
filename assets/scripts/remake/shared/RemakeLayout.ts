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

  /**
   * 战略地图主框架（对齐官方：日期条 + 立绘信息板 + 全宽地图 + 右三键 + 底五键）
   * 侧栏叠在地图右侧；无常驻日志条
   */
  MAP_DATE_Y: 608,
  MAP_DATE_H: 34,
  MAP_STATUS_Y: 505,
  MAP_STATUS_H: 118,
  MAP_STATUS_W: 700,
  MAP_PORTRAIT_X: -292,
  MAP_PORTRAIT_W: 88,
  MAP_PORTRAIT_H: 100,
  MAP_STAT_ORIGIN_X: -230,
  MAP_STAT_ORIGIN_Y: 34,
  MAP_STAT_CELL_W: 118,
  MAP_STAT_CELL_H: 26,
  MAP_STAT_COLS: 4,
  MAP_STAT_GAP_X: 4,
  MAP_STAT_GAP_Y: 4,
  MAP_AREA_Y: -40,
  MAP_AREA_W: 700,
  MAP_AREA_H: 680,
  MAP_SIDE_X: 304,
  MAP_SIDE_W: 78,
  MAP_SIDE_H: 70,
  MAP_SIDE_Y1: 160,
  MAP_SIDE_Y2: 70,
  MAP_SIDE_Y3: -20,
  MAP_CMD_Y: -520,
  MAP_CMD_SIZE: 100,
  MAP_CMD_GAP: 128,
  MAP_CMD_START_X: -256,
  MAP_CITY_HIT: 48,
  MAP_BUBBLE_H: 28,

  /** 设置页（阶段3） */
  SETTINGS_SCROLL_Y: 40,
  SETTINGS_SCROLL_W: 640,
  SETTINGS_SCROLL_H: 720,
  SETTINGS_ROW_GAP: 56,

  /** 命令子面板（阶段5） */
  PANEL_Y: -360,
  PANEL_W: 696,
  PANEL_H: 520,
  PANEL_TITLE_Y: 210,
  PANEL_INFO_Y: 172,
  PANEL_SCROLL_Y: 20,
  PANEL_SCROLL_W: 640,
  PANEL_SCROLL_H: 200,
  PANEL_ROW_H: 52,
  PANEL_ROW_GAP: 8,
  PANEL_ACTION_Y: -130,
  PANEL_CLOSE_Y: -220,
  PANEL_BTN_W: 120,
  PANEL_BTN_H: 44,
  PANEL_BTN_GAP: 140,
  PANEL_CLOSE_W: 160,
  PANEL_MIL_ROW1_Y: -115,
  PANEL_MIL_ROW2_Y: -168,

  /** 占位 / toast */
  TOAST_Y: 340,
  PLACEHOLDER_Y: 40,
} as const;

export type RemakeColor = { r: number; g: number; b: number; a: number };

export const RC = {
  bg: { r: 36, g: 40, b: 48, a: 255 },
  panel: { r: 22, g: 28, b: 42, a: 240 },
  border: { r: 198, g: 168, b: 90, a: 255 },
  text: { r: 236, g: 228, b: 210, a: 255 },
  textDim: { r: 150, g: 145, b: 130, a: 255 },
  textGold: { r: 232, g: 196, b: 110, a: 255 },
  danger: { r: 200, g: 90, b: 80, a: 255 },
  /** 地图区：浅绿灰，告别大黑框 */
  mapBg: { r: 72, g: 92, b: 78, a: 255 },
  mapLand: { r: 88, g: 110, b: 90, a: 255 },
  road: { r: 210, g: 200, b: 170, a: 160 },
  selectRing: { r: 255, g: 245, b: 120, a: 255 },
  /** 官方风浅色信息板 */
  chrome: { r: 214, g: 214, b: 218, a: 250 },
  chromeDark: { r: 180, g: 180, b: 186, a: 255 },
  chromeBorder: { r: 110, g: 110, b: 120, a: 255 },
  chromeText: { r: 28, g: 28, b: 34, a: 255 },
  chromeLabel: { r: 150, g: 115, b: 40, a: 255 },
  chromeField: { r: 245, g: 245, b: 248, a: 255 },
  dim: { r: 0, g: 0, b: 0, a: 160 },
  rowIdle: { r: 28, g: 34, b: 48, a: 230 },
  rowActive: { r: 48, g: 58, b: 42, a: 240 },
  cmdFace: { r: 195, g: 195, b: 200, a: 255 },
  cmdFaceTop: { r: 230, g: 230, b: 235, a: 255 },
} as const;

export const MAP_CMD_CATEGORIES = ['内政', '军事', '人才', '计谋', '外交'] as const;
export type MapCmdCategory = (typeof MAP_CMD_CATEGORIES)[number];

export const MAP_CMD_COLORS: Record<MapCmdCategory, RemakeColor> = {
  内政: { r: 90, g: 160, b: 110, a: 255 },
  军事: { r: 200, g: 90, b: 80, a: 255 },
  人才: { r: 100, g: 140, b: 200, a: 255 },
  计谋: { r: 160, g: 110, b: 190, a: 255 },
  外交: { r: 110, g: 160, b: 190, a: 255 },
};

/** 剧本坐标 → 地图区内本地坐标 */
export function remakeMapCoord(x: number, y: number): { x: number; y: number } {
  const minX = 120;
  const maxX = 640;
  const minY = 160;
  const maxY = 520;
  const nx = ((x - minX) / (maxX - minX) - 0.5) * (RL.MAP_AREA_W - 100);
  const ny = ((y - minY) / (maxY - minY) - 0.5) * (RL.MAP_AREA_H - 100);
  return { x: nx, y: ny };
}
