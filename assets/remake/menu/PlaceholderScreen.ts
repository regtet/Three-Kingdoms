import { Color, Node, Sprite, UITransform } from 'cc';
import { MENU_TEX, RL } from '../shared/RemakeLayout';
import {
  createClassicButton,
  loadSpriteFrame,
  makeLabel,
  setOpacity,
} from '../shared/MenuChrome';
import {
  applyDesignUiTransform,
  getVisibleDesignSize,
  matchVisibleSize,
  safeClearChildren,
} from '../shared/ScreenAdapt';

export async function buildPlaceholderScreen(
  layer: Node,
  title: string,
  onBack: () => void,
): Promise<void> {
  safeClearChildren(layer);

  const vis = getVisibleDesignSize();
  const root = new Node('Placeholder');
  layer.addChild(root);
  matchVisibleSize(root, vis);
  setOpacity(root, 255);

  const dim = new Node('Dim');
  root.addChild(dim);
  matchVisibleSize(dim, vis);
  const dimSp = dim.addComponent(Sprite);
  dimSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const white = await loadSpriteFrame(MENU_TEX.pixel);
  if (white) dimSp.spriteFrame = white;
  dimSp.color = new Color(12, 14, 18, 230);

  const titleLabel = makeLabel(root, 'Title', title, {
    fontSize: 48,
    color: new Color(232, 200, 120, 255),
    y: 0,
    bold: true,
  });
  applyDesignUiTransform(titleLabel.node, 0, 200, vis.height);

  const hint = makeLabel(root, 'Hint', '内容页尚未实现 · 精致重开按屏推进', {
    fontSize: 26,
    color: new Color(180, 170, 150, 200),
    y: 0,
  });
  applyDesignUiTransform(hint.node, 0, 100, vis.height);

  const backWrap = new Node('BtnBackWrap');
  root.addChild(backWrap);
  applyDesignUiTransform(backWrap, 0, -200, vis.height);
  await createClassicButton(backWrap, {
    name: 'BtnBack',
    label: '返回',
    style: 'settings',
    width: RL.btnSettingsW,
    height: RL.btnSettingsH,
    y: 0,
    onClick: onBack,
  });
}
