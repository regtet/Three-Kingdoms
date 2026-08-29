/**
 * 官方三国志 II 移动版界面布局（竖屏 720×1280）
 *
 * ┌────────────────────────────────────┐
 * │ 220年1月          成都              │  日期 + 城名
 * ├────────────────────────────────────┤
 * │ [肖像] │ 势力 魏  太守 曹操  金 300 │  城池状态面板
 * │        │ 现役 3   兵 2000  粮 400  │
 * ├──────────────────────────┬───────┤
 * │                          │ 情報  │
 * │       战略地图            │ 機能  │
 * │                          │ 進行  │
 * ├──────────────────────────┴───────┤
 * │ 消息日志                            │
 * ├────────────────────────────────────┤
 * │ [内政][军事][人才][计谋][外交]       │
 * └────────────────────────────────────┘
 */
export const L = {
  W: 720,
  H: 1280,
  BG_COLOR: { r: 8, g: 12, b: 22, a: 255 },

  /** 顶栏：日期 + 城名 */
  HEADER_Y: 620,
  TOP_BAR_Y: 620,
  HEADER_H: 36,

  /** 官方城池状态面板（肖像 + 属性格） */
  CITY_PANEL_Y: 530,
  CITY_PANEL_H: 150,

  /** 地图（右侧留 sidebar） */
  MAP_CENTER: { x: -40, y: 100 },
  MAP_W: 580,
  MAP_H: 480,

  /** 右侧竖栏：情報 / 機能 / 進行 */
  SIDEBAR_X: 310,
  SIDEBAR_BTN_W: 88,
  SIDEBAR_BTN_H: 72,
  SIDEBAR_Y1: 300,
  SIDEBAR_Y2: 220,
  SIDEBAR_Y3: 140,
  SIDEBAR_Y4: 60,

  /** 消息栏 */
  LOG_Y: -268,
  LOG_H: 64,

  /** 底部五类命令 */
  CMD_Y: -360,
  CMD_BAR_H: 80,
  CMD_BTN_W: 124,
  CMD_BTN_H: 48,
  CMD_GAP: 132,
  CMD_START_X: -264,

  /** 命令子面板 */
  SUB_PANEL_Y: -300,
  SUB_PANEL_H: 280,
  SUB_TITLE_Y: 108,
  SUB_INFO_Y: 58,
  SUB_BTNS_Y: -30,

  MODAL_TITLE_Y: 420,
  MODAL_BODY_Y: 180,
  MODAL_BTN_Y: -380,
  TOAST_Y: -200,

  FACTION_TITLE_Y: 480,
  FACTION_START_Y: 280,
  FACTION_GAP: 100,
  MENU_TITLE_Y: 350,
  MENU_BTN1_Y: 80,
  MENU_BTN2_Y: -20,
  MENU_BTN3_Y: -120,
  SETTINGS_TITLE_Y: 420,
  SETTINGS_ROW_START_Y: 280,
  SETTINGS_ROW_GAP: 70,

  /** 武将情報面板 */
  GEN_PANEL_TITLE_Y: 460,
  GEN_PANEL_BODY_Y: 80,

  /** 武将列表行 */
  GEN_LIST_ROW_H: 52,
  GEN_LIST_W: 640,
  SUB_FOOTER_Y: -118,
} as const;

/** 官方灰白配色 */
export const COL = {
  panelBg: { r: 20, g: 28, b: 48, a: 220 },
  topBar: { r: 45, g: 50, b: 58, a: 255 },
  cityPanel: { r: 55, g: 58, b: 65, a: 255 },
  fieldBg: { r: 225, g: 228, b: 232, a: 255 },
  fieldLabel: { r: 100, g: 105, b: 115, a: 255 },
  cmdBar: { r: 40, g: 48, b: 62, a: 255 },
  subPanel: { r: 16, g: 24, b: 42, a: 252 },
  mapBg: { r: 14, g: 20, b: 36, a: 255 },
  mapInner: { r: 18, g: 26, b: 44, a: 255 },
  mapBorder: { r: 90, g: 110, b: 150, a: 200 },
  borderGold: { r: 180, g: 150, b: 80, a: 255 },
  accent: { r: 120, g: 80, b: 40, a: 255 },
  btn: { r: 48, g: 68, b: 108, a: 255 },
  btnHighlight: { r: 72, g: 100, b: 150, a: 255 },
  btnDanger: { r: 130, g: 55, b: 55, a: 255 },
  sidebarBtn: { r: 70, g: 78, b: 92, a: 255 },
  text: { r: 235, g: 238, b: 245, a: 255 },
  textDark: { r: 40, g: 45, b: 55, a: 255 },
  textGold: { r: 255, g: 215, b: 90, a: 255 },
  textDim: { r: 165, g: 175, b: 195, a: 255 },
  resGold: { r: 255, g: 200, b: 80, a: 255 },
  resFood: { r: 140, g: 210, b: 120, a: 255 },
  turnPlayer: { r: 120, g: 200, b: 255, a: 255 },
  turnAi: { r: 255, g: 160, b: 120, a: 255 },
} as const;

export const CAT_COL: Record<(typeof CMD_CATEGORIES)[number], { r: number; g: number; b: number; a: number }> = {
  内政: { r: 60, g: 110, b: 80, a: 255 },
  军事: { r: 130, g: 60, b: 60, a: 255 },
  人才: { r: 70, g: 90, b: 140, a: 255 },
  计谋: { r: 100, g: 70, b: 130, a: 255 },
  外交: { r: 90, g: 120, b: 150, a: 255 },
};

export const CMD_CATEGORIES = ['内政', '军事', '人才', '计谋', '外交'] as const;
export type CmdCategory = (typeof CMD_CATEGORIES)[number];

export function mapScenarioCoord(x: number, y: number): { x: number; y: number } {
  const minX = 120;
  const maxX = 640;
  const minY = 160;
  const maxY = 520;
  const nx = ((x - minX) / (maxX - minX) - 0.5) * (L.MAP_W - 80);
  const ny = ((y - minY) / (maxY - minY) - 0.5) * (L.MAP_H - 80);
  return { x: nx, y: ny };
}
