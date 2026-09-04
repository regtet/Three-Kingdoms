import { Node, tween, Vec3 } from 'cc';
import { L } from './OfficialLayout';

/** 地图层控件引用（子面板开关时显隐） */
export interface MapChromeTargets {
  mapLayer: Node;
  subPanel: Node;
  subDimNode: Node | null;
  mapLogBar: Node | null;
  logLabelNode: Node | null;
  logMoreNode: Node | null;
  cmdBarNode: Node | null;
  cmdBtnNodes: Node[];
  sidebarBtnNodes: Node[];
}

/**
 * 命令子面板开关 + 防堆叠契约（见 cocos-ui-layout 规则）。
 * 坐标仍只读 OfficialLayout.L.*
 */
export class MapSubPanelController {
  constructor(private readonly targets: MapChromeTargets) {}

  suppressMapChrome(): void {
    this.setMapLogVisible(false);
    this.setMapCmdVisible(false);
    this.setMapSidebarVisible(false);
  }

  restoreMapChrome(): void {
    this.setMapLogVisible(true);
    this.setMapCmdVisible(true);
    this.setMapSidebarVisible(true);
  }

  /** 打开子面板：隐藏地图 HUD/命令栏，显示遮罩并置顶 */
  open(): void {
    this.suppressMapChrome();
    const { mapLayer, subPanel, subDimNode } = this.targets;
    if (subDimNode) {
      subDimNode.active = true;
      subDimNode.setSiblingIndex(mapLayer.children.length - 1);
    }
    subPanel.active = true;
    subPanel.setSiblingIndex(mapLayer.children.length - 1);
    subPanel.setPosition(0, L.SUB_PANEL_Y - 48, 0);
    tween(subPanel)
      .to(0.18, { position: new Vec3(0, L.SUB_PANEL_Y, 0) }, { easing: 'quadOut' })
      .start();
  }

  /** 关闭子面板并恢复地图控件 */
  close(): void {
    const { subPanel, subDimNode } = this.targets;
    subPanel.active = false;
    subPanel.setPosition(0, L.SUB_PANEL_Y, 0);
    if (subDimNode) subDimNode.active = false;
    this.restoreMapChrome();
  }

  private setMapLogVisible(visible: boolean): void {
    const { mapLogBar, logLabelNode, logMoreNode } = this.targets;
    if (mapLogBar) mapLogBar.active = visible;
    if (logLabelNode) logLabelNode.active = visible;
    if (logMoreNode) logMoreNode.active = visible;
  }

  private setMapCmdVisible(visible: boolean): void {
    const { cmdBarNode, cmdBtnNodes } = this.targets;
    if (cmdBarNode) cmdBarNode.active = visible;
    for (const node of cmdBtnNodes) node.active = visible;
  }

  private setMapSidebarVisible(visible: boolean): void {
    for (const node of this.targets.sidebarBtnNodes) node.active = visible;
  }
}
