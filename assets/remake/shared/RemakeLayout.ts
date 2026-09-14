/**
 * 设计基准：1080×1920（9:16）。UI 坐标写死于此。
 * 适配逻辑见 ScreenAdapt.ts（背景 Cover / UI 设计坐标 + 等比缩放）。
 */
export const RL = {
  W: 1080,
  H: 1920,

  /** Safe Area：只作用于 UI 边距，不改变背景 */
  safeTop: 72,
  safeBottom: 56,

  /** 设计坐标（相对 1080×1920 中心，Y 向上） */
  logoY: 520,
  logoMaxW: 760,
  logoMaxH: 300,

  menuCenterY: -180,
  /** 页脚设计 Y（底边 + safeBottom） */
  footerY: -960 + 56 + 36,
  gapPrimary: 24,

  /** 统一匾额：细铜框暗漆面，仅尺寸分主次 */
  btnPrimaryW: 640,
  btnPrimaryH: 112,
  btnSecondaryW: 580,
  btnSecondaryH: 96,
  btnTertiaryW: 520,
  btnTertiaryH: 88,
  btnQuaternaryW: 440,
  btnQuaternaryH: 80,

  mistY: -40,
  mistH: 520,

  vignetteOpacity: 160,

  pressScale: 0.97,
  pressMs: 110,
  transitionMs: 380,
  introStepMs: 420,
} as const;

/** 月下宫殿：精致开卷气质 */
export const MENU_BG_PATH = 'ui/backgrounds/bg_palace_moon';
export const MENU_LOGO_PATH = 'ui/brand/logo';
export const MENU_CLICK_SFX = 'audio/ui_tap';
/** 大厅 BGM：用户提供的 menu_bgm.mp3 */
export const MENU_BGM_PATH = 'audio/menu_bgm';
export const MENU_BGM_VOLUME = 0.55;

export const MENU_TEX = {
  woodPrimary: 'ui/menu/btn_wood_primary',
  woodSecondary: 'ui/menu/btn_wood_secondary',
  woodTertiary: 'ui/menu/btn_wood_tertiary',
  woodQuaternary: 'ui/menu/btn_wood_quaternary',
  rim: 'ui/menu/btn_selected_rim',
  mist: 'ui/menu/mist_band',
  vignette: 'ui/menu/vignette',
  seal: 'ui/menu/seal_zhu',
  pixel: 'ui/menu/pixel_white',
} as const;
