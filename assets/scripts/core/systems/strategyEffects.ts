import type { GameState, StrategyEffect, StrategyEffectType } from '../models/types';
import { addLog, findCity, getCityGenerals } from '../utils/helpers';

let effectSeq = 0;

function nextEffectId(state: GameState): string {
  effectSeq += 1;
  return `se_${state.turn}_${effectSeq}`;
}

/** 选取敌城目标武将（默认智力最高守将） */
export function pickStratagemTargetGeneral(state: GameState, targetCityId: string) {
  const defs = getCityGenerals(state, targetCityId);
  if (!defs.length) return null;
  return defs.sort((a, b) => b.intelligence - a.intelligence)[0];
}

export function addStrategyEffect(
  state: GameState,
  input: Omit<StrategyEffect, 'id' | 'status'> & { status?: StrategyEffect['status'] },
): StrategyEffect {
  const effect: StrategyEffect = {
    id: nextEffectId(state),
    status: input.status ?? 'active',
    type: input.type,
    sourceFactionId: input.sourceFactionId,
    sourceGeneralId: input.sourceGeneralId,
    targetGeneralId: input.targetGeneralId,
    magnitude: input.magnitude,
    turnsRemaining: input.turnsRemaining,
  };
  state.strategyEffects.push(effect);
  return effect;
}

export function getActiveEffectsOnGeneral(state: GameState, generalId: string, type?: StrategyEffectType) {
  return state.strategyEffects.filter(
    (e) => e.targetGeneralId === generalId && e.status === 'active' && (!type || e.type === type),
  );
}

/** 月初：忠诚侵蚀等延迟效果结算 */
export function resolveStrategyEffects(state: GameState): void {
  const remaining: StrategyEffect[] = [];

  for (const effect of state.strategyEffects) {
    if (effect.status !== 'active') continue;

    const target = state.generals.find((g) => g.id === effect.targetGeneralId);
    if (!target) {
      effect.status = 'expired';
      continue;
    }

    if (effect.type === 'loyalty_erosion') {
      target.loyalty = Math.max(0, target.loyalty - effect.magnitude);
      addLog(state, `${target.name} 因流言忠诚降至 ${target.loyalty}`, 'stratagem');
    }

    effect.turnsRemaining -= 1;
    if (effect.turnsRemaining <= 0) {
      effect.status = 'expired';
      continue;
    }
    remaining.push(effect);
  }

  state.strategyEffects = remaining;
}

/** 战斗开始：检查寝返 */
export function tryBattleSleeperDefection(
  state: GameState,
  attackerFactionId: string,
  targetCityId: string,
): string[] {
  const logs: string[] = [];
  const defenders = getCityGenerals(state, targetCityId);

  for (const def of defenders) {
    const sleeper = state.strategyEffects.find(
      (e) =>
        e.type === 'sleeper'
        && e.status === 'active'
        && e.targetGeneralId === def.id
        && e.sourceFactionId === attackerFactionId,
    );
    if (!sleeper) continue;

    const rate = Math.min(0.75, 0.15 + (60 - def.loyalty) * 0.008);
    if (Math.random() >= rate) continue;

    const fromCity = findCity(state, targetCityId);
    fromCity.generalIds = fromCity.generalIds.filter((id) => id !== def.id);
    if (fromCity.governorId === def.id) fromCity.governorId = null;

    const attackerCity = state.cities.find(
      (c) => c.factionId === attackerFactionId && c.neighbors.includes(targetCityId),
    ) ?? state.cities.find((c) => c.factionId === attackerFactionId);

    if (attackerCity) {
      def.factionId = attackerFactionId;
      def.cityId = attackerCity.id;
      def.loyalty = 55;
      def.status = 'idle';
      if (!attackerCity.generalIds.includes(def.id)) attackerCity.generalIds.push(def.id);
    }

    sleeper.status = 'triggered';
    logs.push(`${def.name} 寝返！`);
    addLog(state, `${def.name} 在 ${fromCity.name} 阵前寝返`, 'stratagem');
  }

  return logs;
}

export function getSleeperCount(state: GameState, factionId: string): number {
  return state.strategyEffects.filter(
    (e) => e.type === 'sleeper' && e.status === 'active' && e.sourceFactionId === factionId,
  ).length;
}
