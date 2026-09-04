import { MapSubPanelController, type MapChromeTargets } from './MapSubPanelController';
import { UIStack, type UIStackEntry } from './UIStack';

export const SUB_PANEL_STACK_ID = 'map-sub-panel';
export const MODAL_CONFIRM = 'modal-confirm';
export const MODAL_DEPLOY = 'modal-deploy';
export const MODAL_BATTLE = 'modal-battle';
export const MODAL_INTEL = 'modal-intel';
export const MODAL_DIP = 'modal-dip';

/**
 * 地图 UI 编排：子面板栈 + 模态栈 + 防堆叠显隐。
 */
export class UIManager {
  readonly stack = new UIStack();
  readonly subPanel: MapSubPanelController;

  constructor(targets: MapChromeTargets) {
    this.subPanel = new MapSubPanelController(targets);
  }

  openSubPanel(onOpen: () => void, onClose: () => void): void {
    const entry: UIStackEntry = {
      id: SUB_PANEL_STACK_ID,
      close: () => {
        this.subPanel.close();
        onClose();
      },
    };
    this.stack.push(entry);
    this.subPanel.open();
    onOpen();
  }

  closeSubPanel(): void {
    if (this.stack.has(SUB_PANEL_STACK_ID)) {
      this.stack.close(SUB_PANEL_STACK_ID);
    } else {
      this.subPanel.close();
    }
  }

  /** 打开全屏/半屏模态，纳入 UI 栈 */
  openModal(id: string, node: { active: boolean }, onClose?: () => void): void {
    if (this.stack.has(id)) this.stack.close(id);
    this.stack.push({
      id,
      close: () => {
        node.active = false;
        onClose?.();
      },
    });
    node.active = true;
  }

  closeModal(id: string): void {
    if (this.stack.has(id)) {
      this.stack.close(id);
    }
  }

  dismissAll(): void {
    this.stack.clear(true);
  }
}
