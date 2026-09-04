import { Color, Label, Node, Vec3, tween } from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import { audioManager } from './AudioManager';
import { COL } from './OfficialLayout';
import type { GameSettings } from './GameSettings';
import { MODAL_CONFIRM, UIManager } from './UIManager';

/** 结束回合 / 终局宿主 */
export interface EndTurnHost {
  selectedCityId: string | null;
  confirmPanel: Node;
  confirmCallback: (() => void) | null;
  turnOverlay: Node;
  monthBanner: Node;
  endLayer: Node;
  gameSettings: GameSettings;
  uiManager: UIManager;
  toast(msg: string): void;
  setLabelText(parent: Node, name: string, text: string): void;
  getLabel(parent: Node, name: string): Label | null;
  c(col: { r: number; g: number; b: number; a: number }): Color;
  closeSubPanel(): void;
  refreshMap(): void;
  showMonthBanner(text: string): void;
  showScreen(s: 'end' | string): void;
  scheduleOnce(fn: () => void, delay: number): void;
  showConfirm(msg: string, onYes: () => void): void;
}

export function onEndTurn(host: EndTurnHost): void {
  const summary = gameEngine.getTurnEndSummary();
  const msg = summary
    ? `${summary}\n\n结束本回合？\n电脑将行动并进行月结算`
    : '结束本回合？\n电脑将行动并进行月结算';
  if (host.gameSettings.confirmEndTurn) {
    host.showConfirm(msg, () => doEndTurn(host));
  } else {
    doEndTurn(host);
  }
}

export function doEndTurn(host: EndTurnHost): void {
  host.closeSubPanel();
  host.selectedCityId = null;
  audioManager.playTurnEnd();
  const delay = host.gameSettings.skipAiOverlay ? 0.05 : 0.75;
  if (!host.gameSettings.skipAiOverlay) host.turnOverlay.active = true;
  host.scheduleOnce(() => {
    const before = gameEngine.state;
    const r = gameEngine.endTurn();
    host.turnOverlay.active = false;
    host.toast(r.message);
    const after = gameEngine.state;
    if (before && after && (before.year !== after.year || before.month !== after.month)) {
      host.showMonthBanner(`${after.year}年 ${after.month}月`);
    }
    host.refreshMap();
    if (gameEngine.state?.phase === 'ended') showEndScreen(host);
  }, delay);
}

export function showEndScreen(host: EndTurnHost): void {
  const state = gameEngine.state;
  if (!state) return;
  const won = state.winnerFactionId === state.playerFactionId;
  const summary = gameEngine.getTurnEndSummary();
  const titleLb = host.getLabel(host.endLayer, 'EndTitle');
  if (titleLb) {
    titleLb.string = won ? '天下统一！' : '势力覆灭';
    titleLb.color = won ? host.c(COL.textGold) : host.c({ r: 255, g: 130, b: 100, a: 255 });
  }
  host.setLabelText(
    host.endLayer,
    'EndMsg',
    won
      ? `历经 ${state.turn} 回合，群雄尽伏\n${summary}`
      : `第 ${state.turn} 回合，国祚已尽\n${summary}`,
  );
  if (titleLb) {
    titleLb.node.setScale(0.5, 0.5, 1);
    tween(titleLb.node)
      .to(0.45, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start();
  }
  host.showScreen('end');
}

export function showConfirm(host: EndTurnHost, msg: string, onYes: () => void): void {
  host.setLabelText(host.confirmPanel, 'ConfirmMsg', msg);
  host.confirmCallback = onYes;
  host.uiManager.openModal(MODAL_CONFIRM, host.confirmPanel);
}
