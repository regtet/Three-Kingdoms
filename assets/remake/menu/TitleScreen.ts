import { Color, Node, Sprite, UIOpacity, UITransform, Vec3, tween } from 'cc';
import {
  MENU_BG_PATH,
  MENU_LOGO_PATH,
  MENU_TEX,
  RL,
} from '../shared/RemakeLayout';
import {
  createClassicButton,
  fadeOpacity,
  loadSpriteFrame,
  makeLabel,
  setOpacity,
  stretchFull,
  type ClassicButton,
} from '../shared/MenuChrome';
import { hasSave, hasSeenIntro, markIntroSeen } from '../shared/SaveProbe';

export type TitleCallbacks = {
  onNewGame: () => void;
  onContinue: () => void;
  onGallery: () => void;
  onSettings: () => void;
};

/**
 * 主菜单：水墨山河底 + Logo + 四档古典按钮。
 * 节点一次建好，开场只改 UIOpacity / 位移动画。
 */
export async function buildTitleScreen(
  layer: Node,
  callbacks: TitleCallbacks,
  opts?: { forceIntro?: boolean },
): Promise<void> {
  layer.destroyAllChildren();

  const root = new Node('TitleRoot');
  layer.addChild(root);
  stretchFull(root);
  setOpacity(root, 255);

  // —— 背景 ——
  const bg = new Node('Bg');
  root.addChild(bg);
  stretchFull(bg);
  const bgSp = bg.addComponent(Sprite);
  bgSp.sizeMode = Sprite.SizeMode.CUSTOM;
  bg.getComponent(UITransform)!.setContentSize(RL.W, RL.H);
  const bgFrame = await loadSpriteFrame(MENU_BG_PATH);
  if (bgFrame) bgSp.spriteFrame = bgFrame;
  else bgSp.color = new Color(20, 24, 32, 255);

  // 轻雾
  const mist = new Node('Mist');
  root.addChild(mist);
  mist.setPosition(0, RL.mistY, 0);
  mist.addComponent(UITransform).setContentSize(RL.W * 1.4, RL.mistH);
  const mistSp = mist.addComponent(Sprite);
  mistSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const mistFrame = await loadSpriteFrame(MENU_TEX.mist);
  if (mistFrame) mistSp.spriteFrame = mistFrame;
  mistSp.color = new Color(255, 255, 255, 90);
  tween(mist)
    .repeatForever(
      tween(mist)
        .to(18, { position: new Vec3(40, RL.mistY, 0) })
        .to(18, { position: new Vec3(-40, RL.mistY, 0) }),
    )
    .start();

  // —— Logo 区（brand logo 已含「天下·争锋 / 逐鹿山河」，不再叠 Label） ——
  const logoGroup = new Node('LogoGroup');
  root.addChild(logoGroup);
  logoGroup.setPosition(0, 0, 0);

  const logo = new Node('Logo');
  logoGroup.addChild(logo);
  logo.setPosition(0, RL.logoY, 0);
  logo.addComponent(UITransform).setContentSize(RL.logoMaxW, RL.logoMaxH);
  const logoSp = logo.addComponent(Sprite);
  logoSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const logoFrame = await loadSpriteFrame(MENU_LOGO_PATH);
  if (logoFrame) {
    logoSp.spriteFrame = logoFrame;
    // 按设计宽等比适配高度，避免拉伸发糊
    const tw = logoFrame.originalSize?.width || logoFrame.rect.width;
    const th = logoFrame.originalSize?.height || logoFrame.rect.height;
    const aspect = th > 0 ? tw / th : 2.4;
    const w = RL.logoMaxW;
    const h = Math.min(RL.logoMaxH, Math.round(w / aspect));
    logo.getComponent(UITransform)!.setContentSize(w, h);
  }

  // —— 菜单按钮 ——
  const menu = new Node('Menu');
  root.addChild(menu);
  menu.setPosition(0, RL.menuCenterY, 0);

  let y = 220;
  const btnNew = await createClassicButton(menu, {
    name: 'BtnNew',
    label: '新游戏',
    style: 'primary',
    width: RL.btnNewW,
    height: RL.btnNewH,
    y,
    onClick: callbacks.onNewGame,
  });
  y -= RL.btnNewH / 2 + RL.btnContinueH / 2 + RL.gapPrimary;

  const btnContinue = await createClassicButton(menu, {
    name: 'BtnContinue',
    label: '继续游戏',
    style: 'secondary',
    width: RL.btnContinueW,
    height: RL.btnContinueH,
    y,
    onClick: callbacks.onContinue,
  });
  btnContinue.node.active = hasSave();
  y -= RL.btnContinueH / 2 + RL.btnGalleryH / 2 + RL.gapPrimary;

  const btnGallery = await createClassicButton(menu, {
    name: 'BtnGallery',
    label: '武将图鉴',
    style: 'scroll',
    width: RL.btnGalleryW,
    height: RL.btnGalleryH,
    y,
    onClick: callbacks.onGallery,
  });
  y -= RL.btnGalleryH / 2 + RL.btnSettingsH / 2 + RL.gapPrimary + 8;

  const btnSettings = await createClassicButton(menu, {
    name: 'BtnSettings',
    label: '设置',
    style: 'settings',
    width: RL.btnSettingsW,
    height: RL.btnSettingsH,
    y,
    onClick: callbacks.onSettings,
  });

  const buttons: ClassicButton[] = [btnNew, btnContinue, btnGallery, btnSettings];

  // 底部克制署名
  makeLabel(root, 'SubBrand', '三国志·天下争锋', {
    fontSize: 22,
    color: new Color(180, 170, 150, 140),
    y: -RL.H / 2 + RL.safeBottom + 36,
  });

  // —— 开场 ——
  const black = new Node('IntroBlack');
  root.addChild(black);
  stretchFull(black);
  const blackSp = black.addComponent(Sprite);
  blackSp.sizeMode = Sprite.SizeMode.CUSTOM;
  black.getComponent(UITransform)!.setContentSize(RL.W, RL.H);
  const whiteFrame = await loadSpriteFrame(MENU_TEX.pixel);
  if (whiteFrame) blackSp.spriteFrame = whiteFrame;
  blackSp.color = new Color(0, 0, 0, 255);
  const blackOp = black.addComponent(UIOpacity);
  blackOp.opacity = 255;

  const playIntro = opts?.forceIntro || !hasSeenIntro();
  if (!playIntro) {
    blackOp.opacity = 0;
    black.active = false;
    return;
  }

  setOpacity(logoGroup, 0);
  setOpacity(menu, 0);
  buttons.forEach((b) => setOpacity(b.node, 0));

  await fadeOpacity(black, 255, 0, RL.introStepMs + 200);
  black.active = false;
  await fadeOpacity(logoGroup, 0, 255, RL.introStepMs);
  await fadeOpacity(menu, 0, 255, RL.introStepMs);
  for (const b of buttons) {
    if (!b.node.active) continue;
    await fadeOpacity(b.node, 0, 255, RL.introStepMs * 0.55);
  }
  markIntroSeen();
}
