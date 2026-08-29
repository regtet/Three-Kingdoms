import type { BattleInput, BattleResult, GameState, General } from '../models/types';
import { canAttackFaction, breakAllianceOnAttack } from './diplomacy';
import { applyAmbush } from './stratagem';
import { FORMULAS } from '../data/formulas';
import {
  addLog,
  areNeighbors,
  findCity,
  findGeneral,
  getDefendingGeneral,
  randomVariance,
} from '../utils/helpers';

function calcAttackPower(troops: number, force: number, leadership: number, multiplier = 1): number {
  const f = FORMULAS.battle;
  return troops * (1 + leadership * f.leadershipWeight) * (1 + force * f.attackerForceWeight) * multiplier;
}

function calcDefensePower(
  troops: number,
  leadership: number,
  intelligence: number,
  isCity: boolean,
  multiplier = 1,
): number {
  const f = FORMULAS.battle;
  let power = troops * (1 + leadership * f.leadershipWeight) * (1 + intelligence * f.defenderIntelligenceWeight);
  if (isCity) power *= f.cityDefenseBonus;
  return power * multiplier;
}

function tryDuel(
  attacker: General,
  defender: General | null,
  enabled: boolean,
): { log: string; atkMul: number; defMul: number } {
  const f = FORMULAS.battle;
  if (!enabled || !defender) return { log: '', atkMul: 1, defMul: 1 };
  if (attacker.force < f.duelMinForce || defender.force < f.duelMinForce) {
    return { log: '双方武力不足，未发生一骑讨', atkMul: 1, defMul: 1 };
  }
  const atkScore = attacker.force + Math.random() * 25;
  const defScore = defender.force + Math.random() * 25;
  const bonus = 1 + f.duelPowerBonus;
  if (atkScore >= defScore) {
    return { log: `一骑讨：${attacker.name} 胜！`, atkMul: bonus, defMul: 1 };
  }
  return { log: `一骑讨：${defender.name} 胜！`, atkMul: 1, defMul: bonus };
}

function jointArmyPower(state: GameState, input: BattleInput, troops: number): number {
  if (!input.secondaryGeneralId) return 0;
  const sec = findGeneral(state, input.secondaryGeneralId);
  if (sec.cityId !== input.fromCityId || sec.status === 'marching' || sec.status === 'injured') return 0;
  if (sec.id === input.attackerGeneralId) return 0;
  const f = FORMULAS.battle;
  return troops * f.jointArmyBonus * (1 + sec.leadership * f.leadershipWeight);
}

export function canAttack(state: GameState, input: BattleInput): { ok: boolean; reason: string } {
  if (state.phase !== 'player') {
    return { ok: false, reason: '当前不是玩家回合' };
  }
  const from = findCity(state, input.fromCityId);
  const to = findCity(state, input.targetCityId);
  const attacker = findGeneral(state, input.attackerGeneralId);

  if (from.factionId !== state.playerFactionId) {
    return { ok: false, reason: '只能从己方城池出兵' };
  }
  if (to.factionId === state.playerFactionId) {
    return { ok: false, reason: '不能攻击己方城池' };
  }
  if (!canAttackFaction(state, from.factionId, to.factionId)) {
    return { ok: false, reason: '与该势力处于同盟或停战，无法攻击' };
  }
  breakAllianceOnAttack(state, from.factionId, to.factionId);
  if (!areNeighbors(state, input.fromCityId, input.targetCityId)) {
    return { ok: false, reason: '只能攻击相邻城池' };
  }
  if (attacker.cityId !== input.fromCityId) {
    return { ok: false, reason: '该武将不在此城' };
  }
  if (attacker.status === 'marching') {
    return { ok: false, reason: '武将在外，无法出征' };
  }
  if (attacker.status === 'injured') {
    return { ok: false, reason: '武将负伤，无法出征' };
  }
  if (input.attackerTroops <= 0) {
    return { ok: false, reason: '出兵数量须大于 0' };
  }
  if (from.troops < input.attackerTroops) {
    return { ok: false, reason: '兵力不足' };
  }
  if (input.secondaryGeneralId) {
    const sec = findGeneral(state, input.secondaryGeneralId);
    if (sec.cityId !== input.fromCityId) return { ok: false, reason: '副将须在同一城池' };
    if (sec.status === 'injured' || sec.status === 'marching') return { ok: false, reason: '副将无法出征' };
  }
  return { ok: true, reason: '' };
}

/** 战前战力预估（供 UI 显示） */
export function estimateBattle(
  state: GameState,
  input: BattleInput,
): { atkPower: number; defPower: number; advantage: 'attacker' | 'defender' | 'even'; label: string } | null {
  const to = findCity(state, input.targetCityId);
  const attacker = findGeneral(state, input.attackerGeneralId);
  const defender = getDefendingGeneral(state, input.targetCityId);
  if (!attacker) return null;

  let atkPower = calcAttackPower(input.attackerTroops, attacker.force, attacker.leadership);
  atkPower += jointArmyPower(state, input, input.attackerTroops);
  const defPower = calcDefensePower(
    to.troops,
    defender?.leadership ?? 50,
    defender?.intelligence ?? 50,
    true,
  );
  const ratio = atkPower / Math.max(defPower, 1);
  let advantage: 'attacker' | 'defender' | 'even' = 'even';
  let label = '势均力敌';
  if (ratio >= 1.15) { advantage = 'attacker'; label = '我方占优'; }
  else if (ratio <= 0.85) { advantage = 'defender'; label = '敌方占优'; }

  return { atkPower: Math.round(atkPower), defPower: Math.round(defPower), advantage, label };
}

export function resolveBattle(state: GameState, input: BattleInput): BattleResult {
  const from = findCity(state, input.fromCityId);
  const to = findCity(state, input.targetCityId);
  const attacker = findGeneral(state, input.attackerGeneralId);
  const defender = getDefendingGeneral(state, input.targetCityId);
  const log: string[] = [];

  log.push(`${attacker.name} 率 ${input.attackerTroops} 兵从 ${from.name} 进攻 ${to.name}`);
  if (input.secondaryGeneralId) {
    const sec = findGeneral(state, input.secondaryGeneralId);
    log.push(`副将 ${sec.name} 协同作战`);
  }

  if (input.stratagemId === 'ambush') {
    const ambush = applyAmbush(state, input.fromCityId, input.attackerGeneralId, input.targetCityId);
    if (ambush) log.push(ambush.log);
  }

  attacker.status = 'marching';
  if (input.secondaryGeneralId) {
    const sec = findGeneral(state, input.secondaryGeneralId);
    sec.status = 'marching';
  }

  const duel = tryDuel(attacker, defender, input.tryDuel ?? false);
  if (duel.log) log.push(duel.log);

  from.troops -= input.attackerTroops;
  let remainingAttackers = input.attackerTroops;
  let totalAttackerLoss = 0;
  let totalDefenderLoss = 0;
  let attackerWins = false;
  let cityCaptured = false;
  const maxRounds = FORMULAS.battle.siegeMaxRounds;

  for (let round = 1; round <= maxRounds; round++) {
    if (remainingAttackers <= 0 || to.troops <= 0) break;
    if (round > 1) log.push(`第 ${round} 轮攻城`);

    const defTroops = to.troops;
    if (defender && round === 1) {
      log.push(`守将 ${defender.name}，守军 ${defTroops}`);
    } else if (round === 1) {
      log.push(`守军 ${defTroops}（无武将）`);
    }

    let atkPower = calcAttackPower(remainingAttackers, attacker.force, attacker.leadership, duel.atkMul);
    if (input.tacticalModifier) atkPower *= input.tacticalModifier;
    atkPower += jointArmyPower(state, input, remainingAttackers);
    const defPower = calcDefensePower(
      defTroops,
      defender?.leadership ?? 50,
      defender?.intelligence ?? 50,
      true,
      duel.defMul,
    );

    const ratio = (atkPower / Math.max(defPower, 1)) * randomVariance(FORMULAS.battle.randomVariance);
    const roundWin = ratio >= 1.0;

    let roundAtkLoss: number;
    let roundDefLoss: number;

    if (roundWin) {
      roundDefLoss = defTroops;
      roundAtkLoss = Math.floor(remainingAttackers * (0.08 + Math.random() * 0.15));
      log.push(round === maxRounds || defTroops <= remainingAttackers ? '攻城得胜！' : '守军溃退');
    } else {
      roundDefLoss = Math.floor(defTroops * (0.12 + Math.random() * 0.2));
      roundAtkLoss = Math.floor(remainingAttackers * (0.35 + Math.random() * 0.25));
      log.push('进攻受挫');
    }

    roundAtkLoss = Math.min(roundAtkLoss, remainingAttackers);
    roundDefLoss = Math.min(roundDefLoss, defTroops);

    remainingAttackers -= roundAtkLoss;
    totalAttackerLoss += roundAtkLoss;
    totalDefenderLoss += roundDefLoss;
    to.troops -= roundDefLoss;
    attackerWins = roundWin;

    if (roundWin && to.troops <= 0) {
      cityCaptured = true;
      break;
    }
    if (!roundWin) break;
  }

  if (cityCaptured) {
    const oldFaction = to.factionId;
    to.factionId = from.factionId;
    to.troops = Math.max(remainingAttackers, 100);

    if (defender) {
      defender.status = 'idle';
      const defCity = state.cities.find((c) => c.factionId === oldFaction && c.id !== to.id);
      if (defCity) {
        defender.cityId = defCity.id;
        if (!defCity.generalIds.includes(defender.id)) defCity.generalIds.push(defender.id);
      }
    }

    attacker.cityId = to.id;
    attacker.status = 'idle';
    if (!to.generalIds.includes(attacker.id)) to.generalIds.push(attacker.id);
    const fromIdx = from.generalIds.indexOf(attacker.id);
    if (fromIdx >= 0) from.generalIds.splice(fromIdx, 1);

    if (input.secondaryGeneralId) {
      const sec = findGeneral(state, input.secondaryGeneralId);
      sec.cityId = to.id;
      if (!to.generalIds.includes(sec.id)) to.generalIds.push(sec.id);
      const secIdx = from.generalIds.indexOf(sec.id);
      if (secIdx >= 0) from.generalIds.splice(secIdx, 1);
    }

    log.push(`${to.name} 被占领！`);
  } else if (attackerWins) {
    from.troops += remainingAttackers;
    log.push(`${to.name} 仍有守军 ${to.troops}，未能完全占领`);
  } else {
    from.troops += remainingAttackers;
    log.push(`进攻方损失 ${totalAttackerLoss}，退回 ${from.name}`);
  }

  const lossRatio = totalAttackerLoss / Math.max(input.attackerTroops, 1);
  if (lossRatio >= FORMULAS.battle.injuredLossRatio) {
    attacker.status = 'injured';
    log.push(`${attacker.name} 负伤`);
  } else if (!cityCaptured) {
    attacker.status = 'idle';
    if (input.secondaryGeneralId) {
      findGeneral(state, input.secondaryGeneralId).status = 'idle';
    }
  }

  return {
    attackerWins: cityCaptured || (attackerWins && totalDefenderLoss > 0),
    attackerLoss: totalAttackerLoss,
    defenderLoss: totalDefenderLoss,
    defenderGeneralId: defender?.id ?? null,
    log,
    cityCaptured,
  };
}

export function executeAttack(state: GameState, input: BattleInput): BattleResult {
  const check = canAttack(state, input);
  if (!check.ok) {
    return {
      attackerWins: false,
      attackerLoss: 0,
      defenderLoss: 0,
      defenderGeneralId: null,
      log: [check.reason],
      cityCaptured: false,
    };
  }
  const result = resolveBattle(state, input);
  const to = findCity(state, input.targetCityId);
  addLog(state, result.log.join('；'), 'battle');
  if (result.cityCaptured) {
    addLog(state, `占领 ${to.name}！`, 'battle');
  }
  return result;
}

/** AI 进攻（跳过 phase 与 player 检查） */
export function aiExecuteAttack(state: GameState, input: BattleInput): BattleResult | null {
  const from = findCity(state, input.fromCityId);
  const to = findCity(state, input.targetCityId);
  if (from.factionId === to.factionId) return null;
  if (!areNeighbors(state, input.fromCityId, input.targetCityId)) return null;
  if (from.troops < input.attackerTroops) return null;

  const attacker = findGeneral(state, input.attackerGeneralId);
  if (attacker.cityId !== input.fromCityId || attacker.status === 'marching' || attacker.status === 'injured') {
    return null;
  }

  const result = resolveBattle(state, input);
  addLog(state, `[AI] ${result.log.join('；')}`, 'ai');
  return result;
}
