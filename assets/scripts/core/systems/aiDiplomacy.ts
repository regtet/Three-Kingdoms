import type { EnvoyPurpose, GameState } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { getFactionCities } from '../utils/helpers';
import { getActableGeneralsInCity } from './actionGuard';
import { getRelation } from './diplomacy';
import { dispatchEnvoy } from './envoy';

function pickAiEnvoyPurpose(
  relation: ReturnType<typeof getRelation>,
  gold: number,
  rng: () => number,
): EnvoyPurpose | null {
  if (relation === 'allied') return null;
  if (relation === 'hostile') {
    return rng() < 0.55 ? 'truce' : (gold >= FORMULAS.diplomacy.giftGoldCost ? 'gift' : 'truce');
  }
  if (gold >= FORMULAS.diplomacy.giftGoldCost && rng() < 0.45) return 'gift';
  if (relation === 'neutral' || relation === 'truce') return 'alliance';
  return null;
}

/**
 * AI 外交：派使者出行（赠礼/停战/结盟），与玩家同一套 EnvoyMission。
 * 不在此文件引入 GameEngine，避免 UI 依赖。
 */
export function runAiDiplomacy(state: GameState, rng: () => number = Math.random): void {
  const living = state.factions.filter((f) => !f.isEliminated);
  const aiFactions = living.filter((f) => !f.isPlayer);

  for (const f of aiFactions) {
    if (rng() >= FORMULAS.ai.diplomacyChance) continue;

    const cities = getFactionCities(state, f.id);
    const from = cities.find((c) => getActableGeneralsInCity(state, c.id, f.id).length > 0);
    if (!from) continue;

    const general = getActableGeneralsInCity(state, from.id, f.id)
      .sort((a, b) => b.intelligence - a.intelligence || b.charm - a.charm)[0];
    if (!general) continue;

    const others = living.filter((o) => o.id !== f.id);
    const player = others.find((o) => o.isPlayer);
    const hostile = others.find((o) => getRelation(state, f.id, o.id) === 'hostile');
    const target = player ?? hostile ?? others[0];
    if (!target) continue;

    const purpose = pickAiEnvoyPurpose(getRelation(state, f.id, target.id), from.gold, rng);
    if (!purpose) continue;

    dispatchEnvoy(state, from.id, general.id, target.id, purpose, f.id);
  }
}
