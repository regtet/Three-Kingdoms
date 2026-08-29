import type { GameState } from '../models/types';
import { FORMULAS } from '../data/formulas';
import { findCity, getCityGenerals, getFactionCities } from '../utils/helpers';
import { canAttackFaction } from './diplomacy';
import { getStratagemGenerals, aiFireAttack, aiDisrupt, aiSowDiscord, aiFakeReport } from './stratagem';
import { aiGovernCity } from './domestic';

/** AI 回合：对相邻敌城施计 */
export function runAiStratagem(state: GameState, factionId: string): void {
  if (Math.random() > FORMULAS.ai.stratagemChance) return;

  const cities = getFactionCities(state, factionId);
  for (const city of cities) {
    const gens = getStratagemGenerals(state, city.id, 55);
    if (!gens.length) continue;

    const gen = gens[0];
    const enemies = city.neighbors
      .map((id) => findCity(state, id))
      .filter((c) => c.factionId !== factionId && canAttackFaction(state, factionId, c.factionId));

    if (!enemies.length) continue;

    const target = enemies.sort((a, b) => b.troops - a.troops)[0];
    const roll = Math.random();

    if (gen.intelligence >= 60 && roll < 0.35) {
      aiFireAttack(state, factionId, city.id, gen.id, target.id);
    } else if (gen.intelligence >= 58 && roll < 0.55) {
      aiFakeReport(state, factionId, city.id, gen.id, target.id);
    } else if (gen.intelligence >= 55 && roll < 0.75) {
      aiDisrupt(state, factionId, city.id, gen.id, target.id);
    } else {
      aiSowDiscord(state, factionId, city.id, gen.id, target.id);
    }
    return;
  }
}

/** AI 治理低民忠/治安城池 */
export function runAiGovern(state: GameState, factionId: string): void {
  const cities = getFactionCities(state, factionId);
  for (const city of cities) {
    if (city.loyalty >= 60 && city.order >= 60) continue;
    if (Math.random() > FORMULAS.ai.governChance) continue;
    if (aiGovernCity(state, city.id)) return;
  }
}

/** 为 AI 进攻挑选副将 */
export function pickAiSecondaryGeneral(state: GameState, cityId: string, primaryId: string): string | undefined {
  const gens = getCityGenerals(state, cityId)
    .filter((g) => g.id !== primaryId && g.status !== 'marching' && g.status !== 'injured')
    .sort((a, b) => b.leadership - a.leadership);
  return gens[0]?.id;
}
