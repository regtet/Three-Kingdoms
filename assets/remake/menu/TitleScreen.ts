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
  type ClassicButton,
} from '../shared/MenuChrome';
import {
  applyDesignUiTransform,
  applySpriteContain,
  applySpriteCover,
  getVisibleDesignSize,
  matchVisibleSize,
  safeClearChildren,
} from '../shared/ScreenAdapt';
import { hasSave, hasSeenIntro, markIntroSeen } from '../shared/SaveProbe';

export type TitleCallbacks = {
  onNewGame: () => void;
  onContinue: () => void;
  onGallery: () => void;
  onSettings: () => void;
};

export async function buildTitleScreen(
  layer: Node,
  callbacks: TitleCallbacks,
  opts?: { forceIntro?: boolean },
): Promise<void> {
  safeClearChildren(layer);

  const vis = getVisibleDesignSize();
  const vw = vis.width;
  const vh = vis.height;

  const root = new Node('TitleRoot');
  layer.addChild(root);
  matchVisibleSize(root, vis);
  setOpacity(root, 255);

  const bg = new Node('Bg');
  root.addChild(bg);
  const bgSp = bg.addComponent(Sprite);
  const bgFrame = await loadSpriteFrame(MENU_BG_PATH);
  if (bgFrame) {
    applySpriteCover(bg, bgSp, bgFrame, vw, vh);
  } else {
    bg.addComponent(UITransform).setContentSize(vw, vh);
    bgSp.sizeMode = Sprite.SizeMode.CUSTOM;
    bgSp.color = new Color(20, 24, 32, 255);
  }

  const mist = new Node('Mist');
  root.addChild(mist);
  const mistSp = mist.addComponent(Sprite);
  const mistFrame = await loadSpriteFrame(MENU_TEX.mist);
  if (mistFrame) {
    applySpriteCover(mist, mistSp, mistFrame, vw * 1.15, RL.mistH);
  } else {
    mist.addComponent(UITransform).setContentSize(vw * 1.15, RL.mistH);
    mistSp.sizeMode = Sprite.SizeMode.CUSTOM;
  }
  mist.setPosition(0, RL.mistY, 0);
  mistSp.color = new Color(255, 255, 255, 80);
  tween(mist)
    .repeatForever(
      tween(mist)
        .to(18, { position: new Vec3(36, RL.mistY, 0) })
        .to(18, { position: new Vec3(-36, RL.mistY, 0) }),
    )
    .start();

  const logoGroup = new Node('LogoGroup');
  root.addChild(logoGroup);
  applyDesignUiTransform(logoGroup, 0, 0, vh);

  const logo = new Node('Logo');
  logoGroup.addChild(logo);
  const logoDesignY = RL.logoY - RL.safeTop * 0.15;
  logo.setPosition(0, logoDesignY, 0);
  const logoSp = logo.addComponent(Sprite);
  const logoFrame = await loadSpriteFrame(MENU_LOGO_PATH);
  if (logoFrame) {
    // TRIMMED + 统一 scale，避免 CUSTOM+originalSize 拉伸
    applySpriteContain(logo, logoSp, logoFrame, RL.logoMaxW, RL.logoMaxH);
    logo.setPosition(0, logoDesignY, 0);
  } else {
    logo.addComponent(UITransform).setContentSize(RL.logoMaxW, 120);
    logoSp.sizeMode = Sprite.SizeMode.CUSTOM;
  }

  const menu = new Node('Menu');
  root.addChild(menu);
  applyDesignUiTransform(menu, 0, RL.menuCenterY, vh);

  const showContinue = hasSave();
  const stack: Array<{
    name: string;
    label: string;
    style: 'primary' | 'secondary' | 'scroll' | 'settings';
    width: number;
    height: number;
    onClick: () => void;
    visible: boolean;
  }> = [
    {
      name: 'BtnNew',
      label: '新游戏',
      style: 'primary',
      width: RL.btnNewW,
      height: RL.btnNewH,
      onClick: callbacks.onNewGame,
      visible: true,
    },
    {
      name: 'BtnContinue',
      label: '继续游戏',
      style: 'secondary',
      width: RL.btnContinueW,
      height: RL.btnContinueH,
      onClick: callbacks.onContinue,
      visible: showContinue,
    },
    {
      name: 'BtnGallery',
      label: '武将图鉴',
      style: 'scroll',
      width: RL.btnGalleryW,
      height: RL.btnGalleryH,
      onClick: callbacks.onGallery,
      visible: true,
    },
    {
      name: 'BtnSettings',
      label: '设置',
      style: 'settings',
      width: RL.btnSettingsW,
      height: RL.btnSettingsH,
      onClick: callbacks.onSettings,
      visible: true,
    },
  ];

  const visibleBtns = stack.filter((s) => s.visible);
  const totalH =
    visibleBtns.reduce((sum, s) => sum + s.height, 0) +
    RL.gapPrimary * Math.max(0, visibleBtns.length - 1);

  let y = totalH / 2;
  const buttons: ClassicButton[] = [];
  for (const s of visibleBtns) {
    y -= s.height / 2;
    const btn = await createClassicButton(menu, {
      name: s.name,
      label: s.label,
      style: s.style,
      width: s.width,
      height: s.height,
      y,
      onClick: s.onClick,
    });
    buttons.push(btn);
    y -= s.height / 2 + RL.gapPrimary;
  }

  const sub = makeLabel(root, 'SubBrand', '三国志·天下争锋', {
    fontSize: 22,
    color: new Color(180, 170, 150, 140),
    y: 0,
  });
  applyDesignUiTransform(sub.node, 0, RL.footerY, vh);

  const black = new Node('IntroBlack');
  root.addChild(black);
  matchVisibleSize(black, vis);
  const blackSp = black.addComponent(Sprite);
  blackSp.sizeMode = Sprite.SizeMode.CUSTOM;
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
  setOpacity(sub.node, 0);
  buttons.forEach((b) => setOpacity(b.node, 0));

  await fadeOpacity(black, 255, 0, RL.introStepMs + 200);
  if (!black.isValid) return;
  black.active = false;
  await fadeOpacity(logoGroup, 0, 255, RL.introStepMs);
  await fadeOpacity(menu, 0, 255, RL.introStepMs);
  await fadeOpacity(sub.node, 0, 255, RL.introStepMs * 0.5);
  for (const b of buttons) {
    if (!b.node.isValid || !b.node.active) continue;
    await fadeOpacity(b.node, 0, 255, RL.introStepMs * 0.55);
  }
  markIntroSeen();
}
