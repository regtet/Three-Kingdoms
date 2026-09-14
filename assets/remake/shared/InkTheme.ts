/**
 * 水墨视觉规范（已锁定）。
 * 主菜单：卷轴水墨；战略层日后：手绘沙盘地图（同色板）。
 */
export const INK = {
  /** 宣纸 */
  paper: '#e8dfc8',
  paperDeep: '#d4c8a8',
  /** 浓墨 / 淡墨 */
  ink: '#1a1814',
  inkSoft: '#3a342c',
  inkWash: '#6a6258',
  /** 泥金（克制，不作厚金边塑料感） */
  gold: '#c4a86a',
  goldDim: '#8a7340',
  /** 朱印 */
  seal: '#a02828',
  sealDeep: '#6e1818',
  /** 正文 / 副文 */
  textMain: '#2a241c',
  textOnInk: '#f0e6d0',
  textMuted: '#7a7060',
  /** 子页宣纸罩 */
  panelPaper: '#efe6d2',
  panelDim: 0.92,
} as const;

export const INK_FOOTER = '东汉末年，群雄并起';
