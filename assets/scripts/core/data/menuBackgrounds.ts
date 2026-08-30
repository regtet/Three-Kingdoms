/** 主菜单背景配置（resources/backgrounds/<id>.png|webp） */
export type MenuBackgroundDef = { id: string; label: string };

export const MENU_BACKGROUNDS: MenuBackgroundDef[] = [
  { id: 'bg_night_march', label: '夜行进军' },
  { id: 'bg_liangzhou', label: '凉州边境' },
  { id: 'bg_bamboo', label: '竹林弈棋' },
  { id: 'bg_palace_moon', label: '月夜宫阙' },
  { id: 'bg_palace_spring', label: '春庭远眺' },
  { id: 'bg_wei_army', label: '魏旗出征' },
  { id: 'bg_battle_stele', label: '战后江面' },
  { id: 'bg_great_wall', label: '关隘烽火' },
  { id: 'bg_wei_navy', label: '魏师渡江' },
  { id: 'bg_tiger_tally', label: '虎符远眺' },
  { id: 'bg_war_tent', label: '军帐筹谋' },
  { id: 'bg_fortress_siege', label: '城下鏖兵' },
  { id: 'bg_hulao_pass', label: '虎牢关' },
];

export const DEFAULT_MENU_BACKGROUND_ID = MENU_BACKGROUNDS[0].id;

export function normalizeMenuBackgroundId(id: string | undefined | null): string {
  if (id && MENU_BACKGROUNDS.some((b) => b.id === id)) return id;
  return DEFAULT_MENU_BACKGROUND_ID;
}

export function getMenuBackgroundLabel(id: string): string {
  return MENU_BACKGROUNDS.find((b) => b.id === id)?.label ?? id;
}

export function nextMenuBackgroundId(current: string): string {
  const norm = normalizeMenuBackgroundId(current);
  const idx = MENU_BACKGROUNDS.findIndex((b) => b.id === norm);
  return MENU_BACKGROUNDS[(idx + 1) % MENU_BACKGROUNDS.length].id;
}
