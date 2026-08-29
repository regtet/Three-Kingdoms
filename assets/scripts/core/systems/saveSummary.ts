import type { GameState } from '../models/types';
import { deserializeGame, peekSlotRaw } from './save';

export interface SaveSummary {
  factionName: string;
  year: number;
  month: number;
  turn: number;
  cityCount: number;
  generalCount: number;
  goldTotal: number;
  foodTotal: number;
}

export function summarizeState(state: GameState): SaveSummary {
  const faction = state.factions.find((f) => f.id === state.playerFactionId);
  const playerCities = state.cities.filter((c) => c.factionId === state.playerFactionId);
  return {
    factionName: faction?.name ?? '?',
    year: state.year,
    month: state.month,
    turn: state.turn,
    cityCount: playerCities.length,
    generalCount: state.generals.filter((g) => g.factionId === state.playerFactionId).length,
    goldTotal: playerCities.reduce((s, c) => s + c.gold, 0),
    foodTotal: playerCities.reduce((s, c) => s + c.food, 0),
  };
}

export function formatSaveSummary(s: SaveSummary): string {
  return `${s.factionName} · ${s.year}年${s.month}月 · 第${s.turn}回合 · ${s.cityCount}城`;
}

export function formatSaveSummaryDetail(s: SaveSummary): string {
  return `${formatSaveSummary(s)}\n武将${s.generalCount} · 金${s.goldTotal} · 粮${s.foodTotal}`;
}

export function peekSaveSummary(slot = 0): SaveSummary | null {
  const raw = peekSlotRaw(slot);
  if (!raw) return null;
  const state = deserializeGame(raw);
  if (!state) return null;
  return summarizeState(state);
}

export function formatAllSaveSlots(): string[] {
  const lines: string[] = [];
  for (let i = 0; i < 3; i++) {
    const s = peekSaveSummary(i);
    lines.push(s ? `槽${i + 1}: ${formatSaveSummary(s)}` : `槽${i + 1}: （空）`);
  }
  return lines;
}

/** 各势力资源与兵力概况（用于情报/统计面板） */
export function formatFactionStatsReport(state: GameState): string {
  const lines: string[] = ['── 势力概况 ──'];
  for (const f of state.factions.filter((x) => !x.isEliminated)) {
    const cities = state.cities.filter((c) => c.factionId === f.id);
    const gold = cities.reduce((s, c) => s + c.gold, 0);
    const food = cities.reduce((s, c) => s + c.food, 0);
    const troops = cities.reduce((s, c) => s + c.troops, 0);
    const gens = state.generals.filter((g) => g.factionId === f.id).length;
    const tag = f.isPlayer ? ' ★' : '';
    lines.push(`${f.name}${tag}: ${cities.length}城 · 武${gens} · 金${gold} · 粮${food} · 兵${troops}`);
  }
  return lines.join('\n');
}
