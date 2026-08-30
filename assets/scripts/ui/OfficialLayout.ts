/**
 * 官方三国志 II 移动版界面布局（竖屏 720×1280）
 * 所有 UI 坐标只在此定义；自上而下：顶栏 → 城池 → 地图 → 日志 → 命令栏
 */
export const L = {
  W: 720,
  H: 1280,
  BG_COLOR: { r: 10, g: 14, b: 24, a: 255 },

  /** 顶栏 */
  HEADER_Y: 608,
  TOP_BAR_Y: 608,
  HEADER_H: 44,

  /** 城池状态（顶栏下方，不与地图重叠） */
  CITY_PANEL_Y: 372,
  CITY_PANEL_H: 104,

  /** 战略地图主区域 */
  MAP_CENTER: { x: -24, y: 85 },
  MAP_W: 552,
  MAP_H: 470,

  /** 右侧竖栏（贴地图右缘） */
  SIDEBAR_X: 268,
  SIDEBAR_BTN_W: 84,
  SIDEBAR_BTN_H: 68,
  SIDEBAR_Y1: 250,
  SIDEBAR_Y2: 175,
  SIDEBAR_Y3: 100,
  SIDEBAR_Y4: 25,

  /** 底部日志 + 五类命令 */
  LOG_Y: -292,
  LOG_H: 44,
  CMD_Y: -362,
  CMD_BAR_H: 72,
  CMD_BTN_W: 120,
  CMD_BTN_H: 46,
  CMD_GAP: 128,
  CMD_START_X: -256,

  /** 命令子面板（bottom sheet，打开时盖住日志+命令栏） */
  SUB_PANEL_Y: -410,
  SUB_PANEL_H: 460,
  SUB_TITLE_Y: 195,
  SUB_INFO_Y: 162,
  SUB_INFO_H: 26,
  SUB_BTNS_Y: 0,
  SUB_FOOTER_Y: -210,
  SUB_SORT_Y: 125,
  SUB_LIST_TOP_Y: 65,
  SUB_ACTION_Y: -105,
  SUB_EXTRA_Y: -157,
  SUB_DIP_START_Y: 36,
  SUB_DIP_ROW_GAP: 46,

  DEPLOY_PORTRAIT_X: -250,
  DEPLOY_PORTRAIT_Y: 260,
  DEPLOY_CTRL_X: 90,

  MODAL_TITLE_Y: 380,
  MODAL_BODY_Y: 80,
  MODAL_BTN_Y: -360,
  TOAST_Y: 340,

  SLOT_MODAL_W: 620,
  SLOT_MODAL_H: 520,
  SLOT_BTN_START_Y: 70,
  SLOT_BTN_GAP: 80,

  FACTION_TITLE_Y: 480,
  FACTION_START_Y: 280,
  FACTION_GAP: 100,

  MENU_TITLE_Y: 360,
  MENU_ICON_Y: 480,
  MENU_ICON_SIZE: 112,
  MENU_LOGO_Y: 340,
  MENU_LOGO_W: 560,
  MENU_LOGO_H: 150,
  MENU_BUILD_TAG_Y: 250,
  MENU_CARD_Y: 30,
  MENU_CARD_W: 360,
  MENU_CARD_H: 340,
  MENU_BTN1_Y: 90,
  MENU_BTN2_Y: 0,
  MENU_BTN3_Y: -90,
  MENU_NOTE_Y: -175,
  MENU_BG_BTN_Y: -230,
  MENU_BG_BTN_X: -100,
  MENU_ICON_BTN_X: 100,

  SETTINGS_TITLE_Y: 400,
  SETTINGS_ROW_START_Y: 280,
  SETTINGS_ROW_GAP: 58,
  SETTINGS_CLEAR_Y: -300,
  SETTINGS_EDITOR_Y: -380,
  SETTINGS_MENU_Y: -460,
  SETTINGS_BACK_Y: -540,

  GEN_PANEL_TITLE_Y: 460,
  GEN_PANEL_BODY_Y: 80,

  GEN_LIST_ROW_H: 52,
  GEN_LIST_W: 640,
} as const;

/** Cocos Y-up：由中心 Y 与高度得上下缘 */
export function layoutBand(centerY: number, height: number) {
  const half = height / 2;
  return { top: centerY + half, bottom: centerY - half, center: centerY, height };
}

/** above 在 below 上方时的间距；负值 = 重叠 */
export function layoutGapAbove(
  above: { top: number; bottom: number },
  below: { top: number; bottom: number },
) {
  return above.bottom - below.top;
}

/** 地图可用区上下缘（供遮罩/测试） */
export function mapScreenBands() {
  return {
    header: layoutBand(L.HEADER_Y, L.HEADER_H),
    city: layoutBand(L.CITY_PANEL_Y, L.CITY_PANEL_H),
    map: layoutBand(L.MAP_CENTER.y, L.MAP_H),
    log: layoutBand(L.LOG_Y, L.LOG_H),
    cmd: layoutBand(L.CMD_Y, L.CMD_BAR_H),
    subPanel: layoutBand(L.SUB_PANEL_Y, L.SUB_PANEL_H),
  };
}

/** 三国志风格：墨色底 + 铜金点缀 */
export const COL = {
  panelBg: { r: 18, g: 26, b: 42, a: 245 },
  topBar: { r: 22, g: 30, b: 48, a: 255 },
  cityPanel: { r: 24, g: 32, b: 50, a: 255 },
  fieldBg: { r: 32, g: 42, b: 62, a: 255 },
  fieldBorder: { r: 100, g: 120, b: 150, a: 140 },
  fieldLabel: { r: 200, g: 180, b: 120, a: 255 },
  fieldValue: { r: 220, g: 228, b: 240, a: 255 },
  cmdBar: { r: 16, g: 22, b: 36, a: 255 },
  subPanel: { r: 14, g: 20, b: 34, a: 255 },
  subPanelInner: { r: 20, g: 28, b: 44, a: 255 },
  mapBg: { r: 12, g: 18, b: 32, a: 255 },
  mapInner: { r: 16, g: 24, b: 40, a: 255 },
  mapBorder: { r: 120, g: 100, b: 60, a: 160 },
  borderGold: { r: 196, g: 160, b: 88, a: 255 },
  borderGoldDim: { r: 140, g: 115, b: 70, a: 180 },
  accent: { r: 160, g: 110, b: 50, a: 255 },
  btn: { r: 38, g: 52, b: 78, a: 255 },
  btnTop: { r: 52, g: 68, b: 98, a: 255 },
  btnHighlight: { r: 72, g: 58, b: 36, a: 255 },
  btnHighlightTop: { r: 120, g: 95, b: 50, a: 255 },
  btnDanger: { r: 100, g: 45, b: 45, a: 255 },
  sidebarBtn: { r: 34, g: 44, b: 64, a: 255 },
  sidebarAccent: { r: 196, g: 160, b: 88, a: 255 },
  text: { r: 232, g: 236, b: 244, a: 255 },
  textDark: { r: 180, g: 188, b: 200, a: 255 },
  textGold: { r: 255, g: 220, b: 130, a: 255 },
  textDim: { r: 140, g: 152, b: 172, a: 255 },
  resGold: { r: 255, g: 210, b: 90, a: 255 },
  resFood: { r: 130, g: 200, b: 130, a: 255 },
  turnPlayer: { r: 160, g: 210, b: 255, a: 255 },
  turnAi: { r: 255, g: 170, b: 120, a: 255 },
  rowBg: { r: 28, g: 38, b: 56, a: 255 },
  rowBgSel: { r: 48, g: 58, b: 82, a: 255 },
  logBg: { r: 14, g: 20, b: 32, a: 255 },
} as const;

/** 命令类仅作左侧色条点缀，不再整块高饱和填色 */
export const CAT_COL: Record<(typeof CMD_CATEGORIES)[number], { r: number; g: number; b: number; a: number }> = {
  内政: { r: 90, g: 160, b: 110, a: 255 },
  军事: { r: 200, g: 90, b: 80, a: 255 },
  人才: { r: 100, g: 140, b: 200, a: 255 },
  计谋: { r: 160, g: 110, b: 190, a: 255 },
  外交: { r: 110, g: 160, b: 190, a: 255 },
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
