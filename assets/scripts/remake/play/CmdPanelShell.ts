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
import { audioManager } from '../../ui/AudioManager';
import { drawButton, drawPanel, toColor } from '../../ui/UiDraw';
import { RL, RC } from '../shared/RemakeLayout';
import { remakeColor, remakeLabel } from '../shared/RemakeWidgets';

export type CmdSheetParts = {
  root: Node;
  sheet: Node;
  titleLb: Label;
  infoLb: Label;
  content: Node;
  contentTf: UITransform;
  scrollView: ScrollView;
  actionRoot: Node;
  destroy: () => void;
};

/** 命令子面板公共壳：遮罩 + bottom sheet + ScrollView + 返回 */
export function createCmdSheet(
  parent: Node,
  host: Component,
  onClose: () => void,
): CmdSheetParts {
  const root = new Node('CmdSheet');
  parent.addChild(root);
  root.setSiblingIndex(parent.children.length - 1);

  const dim = new Node('Dim');
  root.addChild(dim);
  dim.addComponent(UITransform).setContentSize(RL.W, RL.H);
  dim.addComponent(BlockInputEvents);
  const dimG = dim.addComponent(Graphics);
  dimG.fillColor = toColor(RC.dim);
  dimG.rect(-RL.W / 2, -RL.H / 2, RL.W, RL.H);
  dimG.fill();
  dim.addComponent(Button);
  dim.on(Button.EventType.CLICK, () => onClose(), host);

  const sheet = new Node('Sheet');
  root.addChild(sheet);
  sheet.setPosition(0, RL.PANEL_Y, 0);
  sheet.addComponent(UITransform).setContentSize(RL.PANEL_W, RL.PANEL_H);
  sheet.addComponent(BlockInputEvents);
  drawPanel(sheet.addComponent(Graphics), RL.PANEL_W, RL.PANEL_H, toColor(RC.panel), toColor(RC.border), 10);

  const titleLb = remakeLabel(sheet, 'Title', '', 22, new Vec3(0, RL.PANEL_TITLE_Y, 0), RL.PANEL_W - 40);
  titleLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  titleLb.color = remakeColor(RC.textGold);

  const infoLb = remakeLabel(sheet, 'Info', '', 14, new Vec3(0, RL.PANEL_INFO_Y, 0), RL.PANEL_W - 48);
  infoLb.horizontalAlign = Label.HorizontalAlign.CENTER;
  infoLb.color = remakeColor(RC.textDim);

  const viewport = new Node('GenScroll');
  sheet.addChild(viewport);
  viewport.setPosition(0, RL.PANEL_SCROLL_Y, 0);
  viewport.addComponent(UITransform).setContentSize(RL.PANEL_SCROLL_W, RL.PANEL_SCROLL_H);
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
    onClose();
  }, host);

  return {
    root,
    sheet,
    titleLb,
    infoLb,
    content,
    contentTf,
    scrollView,
    actionRoot,
    destroy: () => root.destroy(),
  };
}

export function remakeActionButton(
  parent: Node,
  name: string,
  text: string,
  x: number,
  y: number,
  host: Component,
  onClick: () => void,
  w = RL.PANEL_BTN_W,
  h = RL.PANEL_BTN_H,
  highlight = false,
): Node {
  const btn = new Node(name);
  parent.addChild(btn);
  btn.setPosition(x, y, 0);
  btn.addComponent(UITransform).setContentSize(w, h);
  drawButton(btn.addComponent(Graphics), w, h, highlight, false);
  const lb = remakeLabel(btn, 'L', text, 16, new Vec3(0, 0, 0), w - 8);
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  btn.addComponent(Button);
  btn.on(Button.EventType.CLICK, () => {
    audioManager.playClick();
    onClick();
  }, host);
  return btn;
}

export function fillScrollRows(
  content: Node,
  contentTf: UITransform,
  scrollView: ScrollView,
  rowCount: number,
  buildRow: (i: number, y: number) => void,
): void {
  content.destroyAllChildren();
  const rowPitch = RL.PANEL_ROW_H + RL.PANEL_ROW_GAP;
  const contentH = Math.max(rowCount * rowPitch, RL.PANEL_SCROLL_H);
  contentTf.setContentSize(RL.PANEL_SCROLL_W, contentH);
  for (let i = 0; i < rowCount; i++) {
    buildRow(i, -i * rowPitch - RL.PANEL_ROW_H / 2);
  }
  scrollView.scrollToTop(0);
}
