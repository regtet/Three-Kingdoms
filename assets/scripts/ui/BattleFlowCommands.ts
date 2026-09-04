import { Node } from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import type { BattleInput, BattleResult } from '../core/models/types';
import { findCity, findGeneral, getDefendingGeneral } from '../core/utils/helpers';
import { audioManager } from './AudioManager';
import { flashCity, pulseCapture } from './BattleFx';
import { playBattleCutscene } from './BattleCutscene';
import { buildTacticalBattlePanel } from './TacticalBattle';
import type { GameSettings } from './GameSettings';
import { MODAL_BATTLE, MODAL_DEPLOY, UIManager } from './UIManager';

/** GameRoot 战斗流程宿主 */
export interface BattleFlowHost {
  root: Node;
  battlePanel: Node;
  mapNodes: Map<string, Node>;
  deployFromCityId: string | null;
  deployGeneralId: string | null;
  deploySecondaryId: string | null;
  deployTroopRatio: number;
  deployUseAmbush: boolean;
  deployTryDuel: boolean;
  battleResult: BattleResult | null;
  gameSettings: GameSettings;
  uiManager: UIManager;
  toast(msg: string): void;
  setLabelText(parent: Node, name: string, text: string): void;
  refreshMap(): void;
  showEndScreen(): void;
}

export function launchAttack(host: BattleFlowHost, targetId: string): void {
  if (!host.deployFromCityId || !host.deployGeneralId) return;
  const state = gameEngine.state!;
  const from = findCity(state, host.deployFromCityId);
  const target = findCity(state, targetId);
  const attacker = findGeneral(state, host.deployGeneralId);
  const defender = getDefendingGeneral(state, targetId);
  const atkFaction = state.factions.find((f) => f.id === attacker.factionId);
  const defFaction = state.factions.find((f) => f.id === target.factionId);

  const troops = Math.min(Math.max(Math.floor(from.troops * host.deployTroopRatio), 500), from.troops);
  const input: BattleInput = {
    attackerGeneralId: host.deployGeneralId,
    attackerTroops: troops,
    fromCityId: host.deployFromCityId,
    targetCityId: targetId,
    stratagemId: host.deployUseAmbush ? 'ambush' : undefined,
    secondaryGeneralId: host.deploySecondaryId ?? undefined,
    tryDuel: host.deployTryDuel,
  };

  host.uiManager.closeModal(MODAL_DEPLOY);

  const runBattle = (modifier = 1) => {
    input.tacticalModifier = modifier;
    if (host.gameSettings.battleCutscene) {
      playBattleCutscene({
        parent: host.root,
        attacker,
        defender,
        attackerFactionColor: atkFaction?.color ?? '#3366CC',
        defenderFactionColor: defFaction?.color ?? '#CC3333',
        targetCityName: target.name,
        attackerTroops: troops,
        defenderTroops: target.troops,
        onMidpoint: () => {
          audioManager.playBattle();
          host.battleResult = gameEngine.attack(input);
        },
        onDone: () => finishBattle(host, targetId),
      });
    } else {
      audioManager.playBattle();
      host.battleResult = gameEngine.attack(input);
      finishBattle(host, targetId);
    }
  };

  if (host.gameSettings.tacticalBattle) {
    buildTacticalBattlePanel(host.root, state, input, (res) => {
      if (res.retreated) {
        host.toast('全军退却，取消进攻');
        return;
      }
      runBattle(res.modifier);
    });
  } else {
    runBattle(1);
  }
}

export function finishBattle(host: BattleFlowHost, targetId: string): void {
  const result = host.battleResult;
  host.battleResult = null;
  if (!result) return;

  const cityNode = host.mapNodes.get(targetId);
  const done = () => {
    if (result.cityCaptured) {
      audioManager.playCapture();
      if (cityNode) pulseCapture(cityNode);
    }
    host.refreshMap();
    showBattleReport(host, result);
  };

  if (cityNode) {
    flashCity(cityNode, !!result.cityCaptured, done);
  } else {
    done();
  }
}

export function showBattleReport(host: BattleFlowHost, result: BattleResult): void {
  host.setLabelText(host.battlePanel, 'Report', result.log.join('\n'));
  host.uiManager.openModal(MODAL_BATTLE, host.battlePanel, () => {
    host.refreshMap();
    if (gameEngine.state?.phase === 'ended') host.showEndScreen();
  });
}

export function closeBattleReport(host: BattleFlowHost): void {
  host.uiManager.closeModal(MODAL_BATTLE);
}
