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
  gapPrimary: 36,

  /** 四键统一尺寸与字号（不再分主次大小） */
  btnPrimaryW: 620,
  btnPrimaryH: 96,
  btnSecondaryW: 620,
  btnSecondaryH: 96,
  btnTertiaryW: 620,
  btnTertiaryH: 96,
  btnQuaternaryW: 620,
  btnQuaternaryH: 96,
  btnFontSize: 36,

  mistY: 20,
  mistH: 320,

  pressScale: 0.98,
  pressMs: 65,
  transitionMs: 200,
  introStepMs: 240,
} as const;

export const MENU_BG_PATH = 'ui/backgrounds/bg_ink_scroll';
export const MENU_LOGO_PATH = 'ui/brand/logo';
export const MENU_CLICK_SFX = 'audio/ui_tap';
export const MENU_BGM_PATH = 'audio/menu_bgm';
export const MENU_BGM_VOLUME = 0.55;

/** 按钮字：亮金（深墨水墨匾） */
export const BTN_LABEL_COLOR = { r: 242, g: 214, b: 120, a: 255 } as const;
/** 二级顶栏字：亮金（深墨匾上） */
export const BANNER_LABEL_COLOR = { r: 242, g: 210, b: 110, a: 255 } as const;
/** 正文：浓墨（宣纸底上必可读） */
export const BODY_TEXT_COLOR = { r: 28, g: 24, b: 18, a: 255 } as const;

export const MENU_TEX = {
  inkMain: 'ui/menu/btn_ink_main',
  inkSub: 'ui/menu/btn_ink_sub',
  inkSmall: 'ui/menu/btn_ink_small',
  /** 兼容旧 style 映射 */
  woodPrimary: 'ui/menu/btn_ink_main',
  woodSecondary: 'ui/menu/btn_ink_sub',
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
