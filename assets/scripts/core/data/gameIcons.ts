/** 游戏图标配置（resources/icons/<id>.webp） */
export type GameIconDef = { id: string; label: string };

export const GAME_ICONS: GameIconDef[] = [
  { id: 'icon_01', label: '龙纹夜军' },
  { id: 'icon_02', label: '蜀旗浴血' },
  { id: 'icon_03', label: '攻城破阵' },
  { id: 'icon_04', label: '熔河关隘' },
  { id: 'icon_05', label: '黎民避祸' },
  { id: 'icon_06', label: '落日征途' },
  { id: 'icon_07', label: '寒夜围营' },
];

export const DEFAULT_GAME_ICON_ID = GAME_ICONS[0].id;
export const GAME_LOGO_ID = 'logo2';

export function normalizeGameIconId(id: string | undefined | null): string {
  if (id && GAME_ICONS.some((i) => i.id === id)) return id;
  return DEFAULT_GAME_ICON_ID;
}

export function getGameIconLabel(id: string): string {
  return GAME_ICONS.find((i) => i.id === id)?.label ?? id;
}

export function nextGameIconId(current: string): string {
  const norm = normalizeGameIconId(current);
  const idx = GAME_ICONS.findIndex((i) => i.id === norm);
  return GAME_ICONS[(idx + 1) % GAME_ICONS.length].id;
}
