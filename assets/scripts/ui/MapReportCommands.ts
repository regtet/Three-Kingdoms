import { Node } from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import { buildCityStatusPanel, refreshCityStatusPanel } from './OfficialPanels';
import { MODAL_DIP, MODAL_INTEL, UIManager } from './UIManager';

/** 情报 / 外交只读弹窗宿主 */
export interface MapReportHost {
  selectedCityId: string | null;
  intelPanel: Node;
  intelCityPanel: Node;
  dipPanel: Node;
  uiManager: UIManager;
  toast(msg: string): void;
  setLabelText(parent: Node, name: string, text: string): void;
}

export function openIntelPanel(host: MapReportHost): void {
  if (!host.selectedCityId) {
    host.toast('请先选择城池');
    return;
  }
  showIntelForCity(host, host.selectedCityId);
}

export function showIntelForCity(host: MapReportHost, cityId: string): void {
  const state = gameEngine.state;
  if (!state) return;
  host.intelCityPanel.destroyAllChildren();
  const inner = buildCityStatusPanel(host.intelCityPanel, 0);
  inner.setPosition(0, 0, 0);
  refreshCityStatusPanel(inner, state, cityId);
  const view = gameEngine.getCityState(cityId);
  const extra = view.split('--- 邻接 ---')[1] ?? '';
  host.setLabelText(host.intelPanel, 'IntelExtra', extra ? `--- 邻接 ---${extra}` : '');
  host.uiManager.openModal(MODAL_INTEL, host.intelPanel);
}

export function openDipPanel(host: MapReportHost): void {
  host.setLabelText(host.dipPanel, 'DipBody', gameEngine.getDiplomacyReport());
  host.uiManager.openModal(MODAL_DIP, host.dipPanel);
}
