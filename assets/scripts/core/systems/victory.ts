import type { GameState } from '../models/types';
import { addLog, getFactionCities } from '../utils/helpers';

export function updateElimination(state: GameState): void {
  for (const faction of state.factions) {
    if (faction.isEliminated) continue;
    const cities = getFactionCities(state, faction.id);
    if (cities.length === 0) {
      faction.isEliminated = true;
      addLog(state, `${faction.name} 势力灭亡！`, faction.isPlayer ? 'defeat' : 'info');
    }
  }
}

export function checkVictory(state: GameState): boolean {
  updateElimination(state);

  const playerCities = getFactionCities(state, state.playerFactionId);
  if (playerCities.length === 0) {
    state.phase = 'ended';
    state.endReason = 'eliminated';
    const winner = state.factions.find((f) => !f.isEliminated && f.id !== state.playerFactionId);
    state.winnerFactionId = winner?.id;
    addLog(state, '你的势力被消灭了……', 'defeat');
    return true;
  }

  const aliveEnemies = state.factions.filter(
    (f) => f.id !== state.playerFactionId && !f.isEliminated,
  );
  if (aliveEnemies.length === 0) {
    state.phase = 'ended';
    state.endReason = 'conquest';
    state.winnerFactionId = state.playerFactionId;
    addLog(state, '天下统一！恭喜胜利！', 'victory');
    return true;
  }

  if (playerCities.length === state.cities.length) {
    state.phase = 'ended';
    state.endReason = 'conquest';
    state.winnerFactionId = state.playerFactionId;
    addLog(state, '占领全部城池，天下统一！', 'victory');
    return true;
  }

  return false;
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'ended';
}
