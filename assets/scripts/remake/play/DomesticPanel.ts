import {
  BlockInputEvents,
  Button,
  Component,
  Graphics,
  Label,
  Mask,
  Node,
  ScrollView,
  UITransform,
  Vec3,
} from 'cc';
import { gameEngine } from '../../core/game/GameEngine';
import { FORMULAS } from '../../core/data/formulas';
import { getActableGeneralsInCity } from '../../core/systems/actionGuard';
import { findCity } from '../../core/utils/helpers';
import { audioManager } from '../../ui/AudioManager';
import { drawButton, drawPanel, toColor } from '../../ui/UiDraw';
import { RL, RC } from '../shared/RemakeLayout';
import { remakeColor, remakeLabel } from '../shared/RemakeWidgets';

export type DomesticPanelCallbacks = {
  onClose: () => void;
  onToast: (msg: string) => void;
  onActionDone: () => void;
};

/** 内政命令面板：ScrollView 选将 + 开发/开垦/治理 */
export function openDomesticPanel(
  parent: Node,
  host: Component,
  cityId: string,
  cb: DomesticPanelCallbacks,
): { destroy: () => void } {
  const root = new Node('DomesticPanel');
  parent.addChild(root);
  root.setSiblingIndex(parent.children.length - 1);

  // 全屏遮罩
  const dim = new Node('Dim');
  root.addChild(dim);
  dim.addComponent(UITransform).setContentSize(RL.W, RL.H);
  dim.addComponent(BlockInputEvents);
  const dimG = dim.addComponent(Graphics);
  dimG.fillColor = toColor(RC.dim);
  dimG.rect(-RL.W / 2, -RL.H / 2, RL.W, RL.H);
  dimG.fill();
  dim.addComponent(Button);
  dim.on(Button.EventType.CLICK, () => cb.onClose(), host);

  // 底栏面板
  const sheet = new Node('Sheet');
  root.addChild(sheet);
  sheet.setPosition(0, RL.PANEL_Y, 0);
  sheet.addComponent(UITransform).setContentSize(RL.PANEL_W, RL.PANEL_H);
  sheet.addComponent(BlockInputEvents);
  const sheetG = sheet.addComponent(Graphics);
  drawPanel(sheetG, RL.PANEL_W, RL.PANEL_H, toColor(RC.panel), toColor(RC.border), 10);

  const titleLb = remakeLabel(sheet, 'Title', '内政', 22, new Vec3(0, RL.PANEL_TITLE_Y, 0), RL.PANEL_W - 40);
  titleLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  titleLb.color = remakeColor(RC.textGold);

  const infoLb = remakeLabel(sheet, 'Info', '', 14, new Vec3(0, RL.PANEL_INFO_Y, 0), RL.PANEL_W - 48);
  infoLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  infoLb.color = remakeColor(RC.textDim);

  // ScrollView 武将列表
  const viewport = new Node('GenScroll');
  sheet.addChild(viewport);
  viewport.setPosition(0, RL.PANEL_SCROLL_Y, 0);
  const viewTf = viewport.addComponent(UITransform);
  viewTf.setContentSize(RL.PANEL_SCROLL_W, RL.PANEL_SCROLL_H);
  viewport.addComponent(Mask).type = Mask.Type.RECT;

  const content = new Node('Content');
  viewport.addChild(content);
  const contentTf = content.addComponent(UITransform);
  contentTf.setAnchorPoint(0.5, 1);
  contentTf.setContentSize(RL.PANEL_SCROLL_W, RL.PANEL_ROW_H);
  content.setPosition(0, RL.PANEL_SCROLL_H / 2, 0);

  const scrollView = viewport.addComponent(ScrollView);
  scrollView.content = content;
  scrollView.vertical = true;
  scrollView.horizontal = false;
  scrollView.inertia = true;
  scrollView.brake = 0.75;
  scrollView.elastic = true;
  scrollView.cancelInnerEvents = true;

  const actionRoot = new Node('Actions');
  sheet.addChild(actionRoot);
  actionRoot.setPosition(0, RL.PANEL_ACTION_Y, 0);

  const closeBtn = new Node('Close');
  sheet.addChild(closeBtn);
  closeBtn.setPosition(0, RL.PANEL_CLOSE_Y, 0);
  closeBtn.addComponent(UITransform).setContentSize(RL.PANEL_CLOSE_W, RL.PANEL_BTN_H);
  drawButton(closeBtn.addComponent(Graphics), RL.PANEL_CLOSE_W, RL.PANEL_BTN_H, false, false);
  const closeLb = remakeLabel(closeBtn, 'L', '返回', 18, new Vec3(0, 0, 0), RL.PANEL_CLOSE_W - 8);
  closeLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  closeBtn.addComponent(Button);
  closeBtn.on(Button.EventType.CLICK, () => {
    audioManager.playClick();
    cb.onClose();
  }, host);

  let selectedGeneralId: string | null = null;

  function runAction(fn: () => { success: boolean; message: string }) {
    if (!selectedGeneralId) {
      cb.onToast('请先选择武将');
      return;
    }
    const r = fn();
    cb.onToast(r.message);
    if (r.success) {
      cb.onActionDone();
      rebuild();
    }
  }

  function rebuildActions() {
    actionRoot.destroyAllChildren();
    const actions: [string, () => void][] = [
      ['开发', () => runAction(() => gameEngine.develop(cityId, selectedGeneralId!))],
      ['开垦', () => runAction(() => gameEngine.farm(cityId, selectedGeneralId!))],
      ['治理', () => runAction(() => gameEngine.govern(cityId, selectedGeneralId!))],
    ];
    actions.forEach(([text, fn], i) => {
      const x = (i - 1) * RL.PANEL_BTN_GAP;
      const btn = new Node(`Act_${text}`);
      actionRoot.addChild(btn);
      btn.setPosition(x, 0, 0);
      btn.addComponent(UITransform).setContentSize(RL.PANEL_BTN_W, RL.PANEL_BTN_H);
      drawButton(btn.addComponent(Graphics), RL.PANEL_BTN_W, RL.PANEL_BTN_H, false, false);
      const lb = remakeLabel(btn, 'L', text, 18, new Vec3(0, 0, 0), RL.PANEL_BTN_W - 8);
      lb.horizontalAlign = Label.HorizontalAlign.CENTER;
      btn.addComponent(Button);
      btn.on(Button.EventType.CLICK, () => {
        audioManager.playClick();
        fn();
      }, host);
    });
  }

  function rebuild() {
    const state = gameEngine.state;
    if (!state) {
      cb.onClose();
      return;
    }
    const city = findCity(state, cityId);
    titleLb.string = `内政 · ${city.name}`;
    const { develop, farm, govern } = FORMULAS;
    infoLb.string =
      `金${city.gold} 商${city.commerce} 农${city.agriculture} 忠${city.loyalty}` +
      `　开发${develop.goldCost}金 / 开垦${farm.goldCost}金 / 治理${govern.goldCost}金`;

    const gens = getActableGeneralsInCity(state, cityId)
      .slice()
      .sort((a, b) => b.politics - a.politics || b.force - a.force);

    if (selectedGeneralId && !gens.some((g) => g.id === selectedGeneralId)) {
      selectedGeneralId = null;
    }
    if (!selectedGeneralId && gens.length) selectedGeneralId = gens[0].id;

    content.destroyAllChildren();
    const rowPitch = RL.PANEL_ROW_H + RL.PANEL_ROW_GAP;
    const contentH = Math.max(gens.length * rowPitch, RL.PANEL_SCROLL_H);
    contentTf.setContentSize(RL.PANEL_SCROLL_W, contentH);

    if (gens.length === 0) {
      const empty = remakeLabel(
        content,
        'Empty',
        '本城无可行动武将',
        16,
        new Vec3(0, -RL.PANEL_ROW_H / 2, 0),
        RL.PANEL_SCROLL_W - 20,
      );
      empty.horizontalAlign = Label.HorizontalAlign.CENTER;
      empty.color = remakeColor(RC.textDim);
    } else {
      gens.forEach((g, i) => {
        const y = -i * rowPitch - RL.PANEL_ROW_H / 2;
        const row = new Node(`Gen_${g.id}`);
        content.addChild(row);
        row.setPosition(0, y, 0);
        row.addComponent(UITransform).setContentSize(RL.PANEL_SCROLL_W - 8, RL.PANEL_ROW_H);
        const gph = row.addComponent(Graphics);
        const active = g.id === selectedGeneralId;
        drawPanel(
          gph,
          RL.PANEL_SCROLL_W - 8,
          RL.PANEL_ROW_H,
          toColor(active ? RC.rowActive : RC.rowIdle),
          toColor(active ? RC.selectRing : RC.border),
          6,
        );
        const status = g.status === 'governor' ? '太守' : '一般';
        const text =
          `${g.name}　政${g.politics} 武${g.force} 智${g.intelligence} 忠${g.loyalty}　${status}`;
        const lb = remakeLabel(row, 'T', text, 15, new Vec3(0, 0, 0), RL.PANEL_SCROLL_W - 24);
        lb.horizontalAlign = Label.HorizontalAlign.LEFT;
        lb.color = remakeColor(active ? RC.textGold : RC.text);
        row.addComponent(Button);
        row.on(Button.EventType.CLICK, () => {
          audioManager.playClick();
          selectedGeneralId = g.id;
          rebuild();
        }, host);
      });
    }

    scrollView.scrollToTop(0);
    rebuildActions();
  }

  rebuild();

  return {
    destroy: () => {
      root.destroy();
    },
  };
}
