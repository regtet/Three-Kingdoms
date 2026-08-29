/** 武将状态 */
export type GeneralStatus = 'idle' | 'governor' | 'marching' | 'injured';

/** 灾难类型 */
export type DisasterType = 'none' | 'flood' | 'plague' | 'locusts';

/** 外交关系 */
export type DiplomaticStatus = 'hostile' | 'neutral' | 'allied' | 'truce';

/** 玩家回合内的命令阶段（官方：选城→选大类→执行） */
export type CommandCategory = 'domestic' | 'military' | 'personnel' | 'stratagem' | 'diplomacy';

export interface General {
  id: string;
  name: string;
  /** 武力 */
  force: number;
  /** 智力 */
  intelligence: number;
  /** 统率 */
  leadership: number;
  /** 政治 */
  politics: number;
  /** 魅力 */
  charm: number;
  /** 忠诚 0-100 */
  loyalty: number;
  /** 年龄（显示用） */
  age?: number;
  factionId: string;
  cityId: string;
  status: GeneralStatus;
}

export interface City {
  id: string;
  name: string;
  factionId: string;
  x: number;
  y: number;
  /** 人口 */
  population: number;
  /** 金钱（本城） */
  gold: number;
  /** 粮食（本城） */
  food: number;
  /** 兵力 */
  troops: number;
  /** 商业 0-999 */
  commerce: number;
  /** 农业 0-999 */
  agriculture: number;
  /** 民忠 0-100 */
  loyalty: number;
  /** 治安 0-100 */
  order: number;
  disaster: DisasterType;
  /** 太守武将 id */
  governorId: string | null;
  generalIds: string[];
  neighbors: string[];
  /** 本回合是否已执行内政（官方：每城每月通常限一次主要内政） */
  domesticDone: boolean;
}

export interface Faction {
  id: string;
  name: string;
  color: string;
  rulerName: string;
  isPlayer: boolean;
  isEliminated: boolean;
}

export interface DiplomaticRelation {
  factionA: string;
  factionB: string;
  status: DiplomaticStatus;
  /** 剩余停战/同盟回合 */
  duration: number;
  /** 友好度 0-100，影响关系升降 */
  relationScore?: number;
}

export type GamePhase = 'player' | 'ai' | 'ended';

export interface LogEntry {
  turn: number;
  message: string;
  type: 'info' | 'battle' | 'domestic' | 'military' | 'personnel' | 'diplomacy' | 'stratagem' | 'ai' | 'victory' | 'defeat';
}

export interface BattleInput {
  attackerGeneralId: string;
  attackerTroops: number;
  fromCityId: string;
  targetCityId: string;
  /** 可选计谋 */
  stratagemId?: string;
  /** 战术战修正 0.8~1.2 */
  tacticalModifier?: number;
  /** 副将（联合军） */
  secondaryGeneralId?: string;
  /** 是否尝试一骑讨 */
  tryDuel?: boolean;
}

export interface BattleResult {
  attackerWins: boolean;
  attackerLoss: number;
  defenderLoss: number;
  defenderGeneralId: string | null;
  log: string[];
  cityCaptured: boolean;
}

export interface TransportInput {
  fromCityId: string;
  toCityId: string;
  gold: number;
  food: number;
  troops: number;
}

export interface WildGeneral {
  id: string;
  name: string;
  force: number;
  intelligence: number;
  leadership: number;
  politics: number;
  charm: number;
  cityId: string;
  recruitGold: number;
}

export interface GameState {
  saveVersion: number;
  scenarioId: string;
  turn: number;
  year: number;
  month: number;
  phase: GamePhase;
  factions: Faction[];
  cities: City[];
  generals: General[];
  relations: DiplomaticRelation[];
  playerFactionId: string;
  actionLog: LogEntry[];
  /** 在野武将（可登用） */
  wildGenerals: WildGeneral[];
  winnerFactionId?: string;
  endReason?: 'conquest' | 'eliminated';
}

/** 城池完整状态（供 UI / CLI 显示） */
export interface CityStateView {
  city: City;
  factionName: string;
  governor: General | null;
  generals: General[];
  /** 预计下月金钱收入 */
  projectedGoldIncome: number;
  /** 预计下月粮食收入 */
  projectedFoodIncome: number;
  /** 预计下月兵粮消耗 */
  projectedTroopUpkeep: number;
  maxTroops: number;
  canDomestic: boolean;
  neighborSummary: { id: string; name: string; factionName: string; troops: number; relation: DiplomaticStatus }[];
}

export interface Formulas {
  develop: { goldCost: number; commerceGain: number; populationGain: number };
  farm: { goldCost: number; agricultureGain: number };
  govern: { goldCost: number; loyaltyGain: number; orderGain: number; disasterHealChance: number };
  recruit: { goldPerTroop: number; foodPerTroop: number; troopsPerPopulation: number };
  income: { goldPerCommerce: number; foodPerAgriculture: number; populationFactor: number };
  loyalty: { monthlyDecay: number; rewardGoldCost: number; rewardLoyaltyGain: number; generalMonthlyDecay: number; defectionThreshold: number };
  upkeep: { foodPerTroop: number; desertionRatio: number };
  recruitEfficiency: { minOrder: number; minLoyalty: number };
  battle: {
    cityDefenseBonus: number;
    randomVariance: number;
    attackerForceWeight: number;
    defenderIntelligenceWeight: number;
    leadershipWeight: number;
    siegeMaxRounds: number;
    duelMinForce: number;
    duelPowerBonus: number;
    jointArmyBonus: number;
    injuredLossRatio: number;
  };
  search: { goldCost: number; baseSuccessRate: number; charmFactor: number };
  stratagem: {
    baseSuccessRate: number;
    intelligenceFactor: number;
    fireAttack: { goldCost: number; foodCost: number; minIntelligence: number; troopDamageRatio: number };
    sowDiscord: { goldCost: number; minIntelligence: number; loyaltyLoss: number };
    disrupt: { goldCost: number; minIntelligence: number; orderLoss: number };
    ambush: { goldCost: number; foodCost: number; minIntelligence: number; troopDamageRatio: number };
    fakeReport: { goldCost: number; minIntelligence: number; orderLoss: number };
    inspire: { goldCost: number; minIntelligence: number; loyaltyGain: number };
  };
  diplomacy: {
    giftGoldCost: number;
    giftRelationGain: number;
    allianceMinDuration: number;
    truceMinDuration: number;
  };
  ai: {
    developThresholdCommerce: number;
    farmThresholdAgriculture: number;
    recruitTargetTroops: number;
    minTroopsToAttack: number;
    stratagemChance: number;
    governChance: number;
  };
  wildRecruit: { minGold: number };
}

export interface ScenarioCityDef {
  id: string;
  name: string;
  initialFactionId: string;
  x: number;
  y: number;
  population: number;
  gold: number;
  food: number;
  troops: number;
  commerce: number;
  agriculture: number;
  loyalty: number;
  neighbors: string[];
}

export interface ScenarioGeneralDef {
  id: string;
  name: string;
  force: number;
  intelligence: number;
  leadership: number;
  politics: number;
  charm: number;
  loyalty: number;
  factionId: string;
  cityId: string;
}

export interface ScenarioData {
  id: string;
  name: string;
  startYear: number;
  startMonth: number;
  factions: { id: string; name: string; color: string; rulerName: string }[];
  cities: ScenarioCityDef[];
  generals: ScenarioGeneralDef[];
  /** 初始在野武将 */
  wildGenerals?: ScenarioWildDef[];
}

export interface ScenarioWildDef {
  id: string;
  name: string;
  force: number;
  intelligence: number;
  leadership: number;
  politics: number;
  charm: number;
  cityId: string;
  recruitGold: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export const SAVE_VERSION = 4;
export const SAVE_KEY = 'three_kingdoms_save';
