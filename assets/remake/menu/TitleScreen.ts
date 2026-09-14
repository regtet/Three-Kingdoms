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
  applyContain,
  applyCover,
  applyDesignUiTransform,
  framePixelSize,
  getVisibleDesignSize,
  matchVisibleSize,
} from '../shared/ScreenAdapt';
import { hasSave, hasSeenIntro, markIntroSeen } from '../shared/SaveProbe';

export type TitleCallbacks = {
  onNewGame: () => void;
  onContinue: () => void;
  onGallery: () => void;
  onSettings: () => void;
};

/**
 * 主菜单：
 * - Bg：原图比例 + 统一 scale Cover 可见区（不改宽高比）
 * - Logo/Menu：1080×1920 设计坐标；短屏整体等比缩小
 */
export async function buildTitleScreen(
  layer: Node,
  callbacks: TitleCallbacks,
  opts?: { forceIntro?: boolean },
): Promise<void> {
  layer.destroyAllChildren();

  const vis = getVisibleDesignSize();
  const vw = vis.width;
  const vh = vis.height;

  const root = new Node('TitleRoot');
  layer.addChild(root);
  matchVisibleSize(root, vis);
  setOpacity(root, 255);

  // —— 背景 Cover（等比 scale）——
  const bg = new Node('Bg');
  root.addChild(bg);
  const bgSp = bg.addComponent(Sprite);
  bgSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const bgFrame = await loadSpriteFrame(MENU_BG_PATH);
  if (bgFrame) {
    bgSp.spriteFrame = bgFrame;
    const { w, h } = framePixelSize(bgFrame);
    applyCover(bg, w, h, vw, vh);
  } else {
    bg.addComponent(UITransform).setContentSize(vw, vh);
    bgSp.color = new Color(20, 24, 32, 255);
  }

  // 轻雾：宽向 Cover，高度用设计 mistH（等比）
  const mist = new Node('Mist');
  root.addChild(mist);
  mist.setPosition(0, RL.mistY, 0);
  const mistSp = mist.addComponent(Sprite);
  mistSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const mistFrame = await loadSpriteFrame(MENU_TEX.mist);
  if (mistFrame) {
    mistSp.spriteFrame = mistFrame;
    const { w, h } = framePixelSize(mistFrame);
    applyCover(mist, w, h, vw * 1.15, RL.mistH);
    mist.setPosition(0, RL.mistY, 0);
  } else {
    mist.addComponent(UITransform).setContentSize(vw * 1.15, RL.mistH);
  }
  mistSp.color = new Color(255, 255, 255, 80);
  tween(mist)
    .repeatForever(
      tween(mist)
        .to(18, { position: new Vec3(36, RL.mistY, 0) })
        .to(18, { position: new Vec3(-36, RL.mistY, 0) }),
    )
    .start();

  // —— Logo ——
  const logoGroup = new Node('LogoGroup');
  root.addChild(logoGroup);
  applyDesignUiTransform(logoGroup, 0, 0, vh);

  const logo = new Node('Logo');
  logoGroup.addChild(logo);
  const logoDesignY = RL.logoY - RL.safeTop * 0.15;
  logo.setPosition(0, logoDesignY, 0);
  const logoSp = logo.addComponent(Sprite);
  logoSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const logoFrame = await loadSpriteFrame(MENU_LOGO_PATH);
  if (logoFrame) {
    logoSp.spriteFrame = logoFrame;
    const { w, h } = framePixelSize(logoFrame);
    applyContain(logo, w, h, RL.logoMaxW, RL.logoMaxH);
    logo.setPosition(0, logoDesignY, 0);
  } else {
    logo.addComponent(UITransform).setContentSize(RL.logoMaxW, 120);
  }

  // —— 菜单（按钮设计宽高不变）——
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
  black.active = false;
  await fadeOpacity(logoGroup, 0, 255, RL.introStepMs);
  await fadeOpacity(menu, 0, 255, RL.introStepMs);
  await fadeOpacity(sub.node, 0, 255, RL.introStepMs * 0.5);
  for (const b of buttons) {
    if (!b.node.active) continue;
    await fadeOpacity(b.node, 0, 255, RL.introStepMs * 0.55);
  }
  markIntroSeen();
}
