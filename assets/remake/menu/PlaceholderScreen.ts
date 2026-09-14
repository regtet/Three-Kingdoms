import { Color, Node, Sprite, UITransform } from 'cc';
import { MENU_TEX, RL } from '../shared/RemakeLayout';
import {
  createClassicButton,
  loadSpriteFrame,
  makeLabel,
  setOpacity,
  stretchFull,
} from '../shared/MenuChrome';

/**
 * 子功能占位页：仅标题 + 返回。正式内容后续按屏补。
 */
export async function buildPlaceholderScreen(
  layer: Node,
  title: string,
  onBack: () => void,
): Promise<void> {
  layer.destroyAllChildren();

  const root = new Node('Placeholder');
  layer.addChild(root);
  stretchFull(root);
  setOpacity(root, 255);

  const dim = new Node('Dim');
  root.addChild(dim);
  stretchFull(dim);
  const dimSp = dim.addComponent(Sprite);
  dimSp.sizeMode = Sprite.SizeMode.CUSTOM;
  dim.getComponent(UITransform)!.setContentSize(RL.W, RL.H);
  const white = await loadSpriteFrame(MENU_TEX.pixel);
  if (white) dimSp.spriteFrame = white;
  dimSp.color = new Color(12, 14, 18, 230);

  makeLabel(root, 'Title', title, {
    fontSize: 48,
    color: new Color(232, 200, 120, 255),
    y: 200,
    bold: true,
  });
  makeLabel(root, 'Hint', '内容页尚未实现 · 精致重开按屏推进', {
    fontSize: 26,
    color: new Color(180, 170, 150, 200),
    y: 100,
  });

  await createClassicButton(root, {
    name: 'BtnBack',
    label: '返回',
    style: 'settings',
    width: RL.btnSettingsW,
    height: RL.btnSettingsH,
    y: -200,
    onClick: onBack,
  });
}
