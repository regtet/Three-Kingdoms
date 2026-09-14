import { createEmptyCity, type City } from './City';
import { createDefaultFactions, type Faction, type FactionId } from './Faction';
import { createOfficer, type Officer } from './Officer';
import { createTurn, type TurnState } from './Turn';

/**
 * 整局游戏快照。仅存数据；推进规则后续按屏往 core 加。
 * 禁止 import 任何 Cocos / cc 模块。
 */
export interface GameState {
  turn: TurnState;
  factions: Faction[];
  cities: City[];
  officers: Officer[];
  playerFactionId: FactionId | null;
}

export function createInitialGameState(options?: {
  year?: number;
  month?: number;
  playerFactionId?: FactionId | null;
}): GameState {
  const year = options?.year ?? 200;
  const month = options?.month ?? 1;
  const playerFactionId = options?.playerFactionId ?? null;

  const factions = createDefaultFactions();
  if (playerFactionId) {
    for (const f of factions) {
      f.isPlayer = f.id === playerFactionId;
    }
  }

  return {
    turn: createTurn(year, month),
    factions,
    cities: [],
    officers: [],
    playerFactionId,
  };
}

/** 浅拷贝快照，避免测试/UI 误改同一引用 */
export function cloneGameState(state: GameState): GameState {
  return {
    turn: { ...state.turn },
    factions: state.factions.map((f) => ({ ...f })),
    cities: state.cities.map((c) => ({ ...c, neighbors: [...c.neighbors] })),
    officers: state.officers.map((o) => ({ ...o })),
    playerFactionId: state.playerFactionId,
  };
}

export { createEmptyCity, createOfficer };
