/**
 * 水墨 UI 布局：标题屏深墨金边按钮；二级页顶栏+正文卡。
 */
export const RL = {
  W: 1080,
  H: 1920,

  safeTop: 72,
  safeBottom: 56,

  logoY: 560,
  logoMaxW: 700,
  logoMaxH: 270,

  /** 按钮区偏下，中间露山水（参考图） */
  menuCenterY: -220,
  footerY: -960 + 56 + 40,
  /** 按钮间距加大，背景可透出 */
  gapPrimary: 44,

  /** 毛笔横笔尺寸（略宽，容纳飘逸收笔） */
  btnPrimaryW: 760,
  btnPrimaryH: 140,
  btnSecondaryW: 760,
  btnSecondaryH: 140,
  btnTertiaryW: 760,
  btnTertiaryH: 140,
  btnQuaternaryW: 760,
  btnQuaternaryH: 140,
  btnFontSize: 40,

  mistY: 20,
  mistH: 320,

  pressScale: 0.985,
  pressMs: 65,
  transitionMs: 200,
  introStepMs: 240,
} as const;

export const MENU_BG_PATH = 'ui/backgrounds/bg_ink_scroll';
export const MENU_LOGO_PATH = 'ui/brand/logo';
export const MENU_CLICK_SFX = 'audio/ui_tap';
export const MENU_BGM_PATH = 'audio/menu_bgm';
export const MENU_BGM_VOLUME = 0.55;

/** 按钮字：宣纸米白（落在浓墨笔触上） */
export const BTN_LABEL_COLOR = { r: 245, g: 236, b: 214, a: 255 } as const;
/** 二级顶栏字：泥金偏暖 */
export const BANNER_LABEL_COLOR = { r: 232, g: 210, b: 150, a: 255 } as const;
/** 正文：浓墨（宣纸底上必可读） */
export const BODY_TEXT_COLOR = { r: 28, g: 24, b: 18, a: 255 } as const;

export const MENU_TEX = {
  /** 主菜单飘逸笔触（多变体） */
  inkMain: 'ui/menu/btn_ink_main',
  inkMainB: 'ui/menu/btn_ink_main_b',
  inkMainC: 'ui/menu/btn_ink_main_c',
  inkMainD: 'ui/menu/btn_ink_main_d',
  /** 确认/返回稍淡 */
  inkSub: 'ui/menu/btn_ink_sub',
  inkSmall: 'ui/menu/btn_ink_small',
  /** 列表淡墨笔痕 */
  inkOption: 'ui/menu/btn_ink_option',
  /** 兼容旧 style 映射 */
  woodPrimary: 'ui/menu/btn_ink_main',
  woodSecondary: 'ui/menu/btn_ink_main_b',
  woodTertiary: 'ui/menu/btn_ink_sub',
  woodQuaternary: 'ui/menu/btn_ink_small',
  rim: 'ui/menu/btn_selected_rim',
  mist: 'ui/menu/mist_band',
  vignette: 'ui/menu/vignette',
  seal: 'ui/menu/seal_zhu',
  titleBanner: 'ui/menu/title_banner',
  pageSheet: 'ui/menu/page_sheet',
  rowSlip: 'ui/menu/row_slip',
  inkWash: 'ui/menu/ink_wash',
  paperDim: 'ui/menu/paper_dim',
  scrollPanel: 'ui/menu/page_sheet',
  pixel: 'ui/menu/pixel_white',
} as const;

/** 标题四键笔触变体，避免四条一模一样 */
export const TITLE_BRUSH_TEX = [
  MENU_TEX.inkMain,
  MENU_TEX.inkMainB,
  MENU_TEX.inkMainC,
  MENU_TEX.inkMainD,
] as const;
