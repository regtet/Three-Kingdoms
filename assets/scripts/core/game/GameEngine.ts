import type {
  ActionResult,
  BattleInput,
  BattleResult,
  GameState,
  ScenarioData,
  TransportInput,
} from '../models/types';
import { createNewGame, advanceMonth, addLog } from '../utils/helpers';
import { developCity, farmCity, governCity } from '../systems/domestic';
import { recruitTroops } from '../systems/recruit';
import { executeAttack } from '../systems/battle';
import { runAiTurn } from '../systems/ai';
import { checkVictory, isGameOver } from '../systems/victory';
import { saveToStorage, loadFromStorage, hasSave, clearSave, setActiveSlot, getActiveSlot, MAX_SAVE_SLOTS } from '../systems/save';
import { formatSaveSummary, peekSaveSummary, summarizeState, formatSaveSummaryDetail, formatAllSaveSlots, formatFactionStatsReport } from '../systems/saveSummary';
import { monthlySettlement } from '../systems/income';
import {
  proposeAlliance,
  proposeTruce,
  declareWar as doDeclareWar,
  sendGift,
} from '../systems/diplomacy';
import {
  moveGeneral,
  rewardGeneral,
  appointGovernor,
  transport,
  searchTalent,
  recruitWildGeneral,
  getWildGeneralsAtCity,
} from '../systems/personnel';
import { useFireAttack, useSowDiscord, useDisrupt, useFakeReport, useInspire } from '../systems/stratagem';
import { formatCityStateBrief, formatCityStateReport, getCityStateView } from '../utils/cityState';
import { formatDiplomacyReport } from '../systems/diplomacyReport';
import { estimateBattle } from '../systems/battle';

export class GameEngine {
  private _state: GameState | null = null;

  get state(): GameState | null {
    return this._state;
  }

  newGame(scenario: ScenarioData, playerFactionId: string): GameState {
    this._state = createNewGame(scenario, playerFactionId);
    saveToStorage(this._state);
    return this._state;
  }

  loadGame(): GameState | null {
    this._state = loadFromStorage();
    return this._state;
  }

  hasSave(): boolean {
    return hasSave();
  }

  getSaveSummary(slot?: number): string | null {
    const s = peekSaveSummary(slot ?? getActiveSlot());
    return s ? formatSaveSummary(s) : null;
  }

  getAllSaveSlotSummaries(): string[] {
    return formatAllSaveSlots();
  }

  getTurnEndSummary(): string {
    if (!this._state) return '';
    const s = summarizeState(this._state);
    return formatSaveSummaryDetail(s);
  }

  getFactionStatsReport(): string {
    if (!this._state) return '';
    return formatFactionStatsReport(this._state);
  }

  setSaveSlot(slot: number): void {
    setActiveSlot(slot);
  }

  getSaveSlot(): number {
    return getActiveSlot();
  }

  hasSaveInSlot(slot: number): boolean {
    return hasSave(slot);
  }

  loadGameFromSlot(slot: number): GameState | null {
    setActiveSlot(slot);
    this._state = loadFromStorage(slot);
    return this._state;
  }

  clearSaveSlot(slot: number): void {
    clearSave(slot);
    if (getActiveSlot() === slot) this._state = null;
  }

  clearSave(): void {
    clearSave();
    this._state = null;
  }

  /** 获取城池状态（官方信息面板数据） */
  getCityState(cityId: string): string {
    if (!this._state) return '无进行中的游戏';
    return formatCityStateReport(getCityStateView(this._state, cityId));
  }

  // ── 内政 ──
  develop(cityId: string): ActionResult {
    return this.wrap(() => developCity(this._state!, cityId));
  }

  farm(cityId: string): ActionResult {
    return this.wrap(() => farmCity(this._state!, cityId));
  }

  govern(cityId: string): ActionResult {
    return this.wrap(() => governCity(this._state!, cityId));
  }

  recruit(cityId: string, amount: number): ActionResult {
    return this.wrap(() => recruitTroops(this._state!, cityId, amount));
  }

  // ── 军事 ──
  attack(input: BattleInput): BattleResult {
    if (!this._state) return this.emptyBattle('无进行中的游戏');
    const result = executeAttack(this._state, input);
    if (result.attackerWins || result.attackerLoss > 0) {
      checkVictory(this._state);
      saveToStorage(this._state);
    } else if (!result.log[0]?.includes('不能') && !result.log[0]?.includes('不足')) {
      checkVictory(this._state);
      saveToStorage(this._state);
    }
    return result;
  }

  transport(input: TransportInput): ActionResult {
    return this.wrap(() => transport(this._state!, input));
  }

  searchTalent(cityId: string): ActionResult {
    return this.wrap(() => searchTalent(this._state!, cityId));
  }

  recruitWild(cityId: string, wildId: string): ActionResult {
    return this.wrap(() => recruitWildGeneral(this._state!, cityId, wildId));
  }

  getWildAtCity(cityId: string) {
    if (!this._state) return [];
    return getWildGeneralsAtCity(this._state, cityId);
  }

  // ── 人才 ──
  moveGeneral(generalId: string, toCityId: string): ActionResult {
    return this.wrap(() => moveGeneral(this._state!, generalId, toCityId));
  }

  rewardGeneral(generalId: string, cityId: string): ActionResult {
    return this.wrap(() => rewardGeneral(this._state!, generalId, cityId));
  }

  appointGovernor(cityId: string, generalId: string): ActionResult {
    return this.wrap(() => appointGovernor(this._state!, cityId, generalId));
  }

  /** 获取城池精简状态（子面板用） */
  getCityStateBrief(cityId: string): string {
    if (!this._state) return '无进行中的游戏';
    return formatCityStateBrief(getCityStateView(this._state, cityId));
  }

  getDiplomacyReport(): string {
    if (!this._state) return '无进行中的游戏';
    return formatDiplomacyReport(this._state);
  }

  /** 战前战力预估 */
  estimateBattle(input: BattleInput) {
    if (!this._state) return null;
    return estimateBattle(this._state, input);
  }

  // ── 计谋 ──
  fireAttack(cityId: string, generalId: string, targetCityId: string): ActionResult {
    return this.wrap(() => useFireAttack(this._state!, cityId, generalId, targetCityId));
  }

  sowDiscord(cityId: string, generalId: string, targetCityId: string): ActionResult {
    return this.wrap(() => useSowDiscord(this._state!, cityId, generalId, targetCityId));
  }

  disrupt(cityId: string, generalId: string, targetCityId: string): ActionResult {
    return this.wrap(() => useDisrupt(this._state!, cityId, generalId, targetCityId));
  }

  fakeReport(cityId: string, generalId: string, targetCityId: string): ActionResult {
    return this.wrap(() => useFakeReport(this._state!, cityId, generalId, targetCityId));
  }

  inspire(cityId: string, generalId: string): ActionResult {
    return this.wrap(() => useInspire(this._state!, cityId, generalId));
  }

  // ── 外交 ──
  alliance(toFactionId: string): ActionResult {
    if (!this._state) return { success: false, message: '无进行中的游戏' };
    const r = proposeAlliance(this._state, this._state.playerFactionId, toFactionId);
    if (r.success) saveToStorage(this._state);
    return r;
  }

  truce(toFactionId: string): ActionResult {
    if (!this._state) return { success: false, message: '无进行中的游戏' };
    const r = proposeTruce(this._state, this._state.playerFactionId, toFactionId);
    if (r.success) saveToStorage(this._state);
    return r;
  }

  declareWar(toFactionId: string): ActionResult {
    if (!this._state) return { success: false, message: '无进行中的游戏' };
    const r = doDeclareWar(this._state, this._state.playerFactionId, toFactionId);
    if (r.success) saveToStorage(this._state);
    return r;
  }

  gift(toFactionId: string, fromCityId: string): ActionResult {
    if (!this._state) return { success: false, message: '无进行中的游戏' };
    const r = sendGift(this._state, this._state.playerFactionId, toFactionId, fromCityId);
    if (r.success) saveToStorage(this._state);
    return r;
  }

  /** 官方回合结束：AI → 月结算 → 新回合 */
  endTurn(): ActionResult {
    if (!this._state) return { success: false, message: '无进行中的游戏' };
    if (this._state.phase !== 'player') return { success: false, message: '当前不是玩家回合' };
    if (isGameOver(this._state)) return { success: false, message: '游戏已结束' };

    this._state.phase = 'ai';
    runAiTurn(this._state);

    if (!checkVictory(this._state)) {
      advanceMonth(this._state);
      monthlySettlement(this._state);
      this._state.turn += 1;
      this._state.phase = 'player';
      addLog(
        this._state,
        `=== 第 ${this._state.turn} 回合 (${this._state.year}年${this._state.month}月) ===`,
        'info',
      );
    }

    saveToStorage(this._state);
    return { success: true, message: '回合结束，已完成月结算' };
  }

  private wrap(fn: () => ActionResult): ActionResult {
    if (!this._state) return { success: false, message: '无进行中的游戏' };
    const r = fn();
    if (r.success) saveToStorage(this._state);
    return r;
  }

  private emptyBattle(msg: string): BattleResult {
    return {
      attackerWins: false,
      attackerLoss: 0,
      defenderLoss: 0,
      defenderGeneralId: null,
      log: [msg],
      cityCaptured: false,
    };
  }
}

export const gameEngine = new GameEngine();
