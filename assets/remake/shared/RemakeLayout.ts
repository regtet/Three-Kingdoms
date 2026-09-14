/** 设计基准：竖屏 9:16，1080×1920 px。坐标仅写于此。 */
export const RL = {
  W: 1080,
  H: 1920,
  /** 安全区上下内边距 */
  safeTop: 64,
  safeBottom: 48,

  logoY: 480,
  logoMaxW: 780,
  logoMaxH: 320,

  menuCenterY: -220,
  gapPrimary: 40,
  btnNewW: 720,
  btnNewH: 140,
  btnContinueW: 640,
  btnContinueH: 112,
  btnGalleryW: 600,
  btnGalleryH: 108,
  btnSettingsW: 420,
  btnSettingsH: 88,

  mistY: 100,
  mistH: 480,

  pressScale: 0.97,
  pressMs: 120,
  transitionMs: 400,
  introStepMs: 450,
} as const;

export const MENU_BG_PATH = 'ui/backgrounds/bg_great_wall';
export const MENU_LOGO_PATH = 'ui/brand/logo';
export const MENU_CLICK_SFX = 'audio/click';
export const MENU_BGM_PATH = 'audio/menu_bgm';

export const MENU_TEX = {
  woodPrimary: 'ui/menu/btn_wood_primary',
  woodSecondary: 'ui/menu/btn_wood_secondary',
  scroll: 'ui/menu/btn_scroll',
  bronze: 'ui/menu/btn_bronze_small',
  rim: 'ui/menu/btn_selected_rim',
  mist: 'ui/menu/mist_band',
  seal: 'ui/menu/seal_zhu',
  pixel: 'ui/menu/pixel_white',
} as const;
