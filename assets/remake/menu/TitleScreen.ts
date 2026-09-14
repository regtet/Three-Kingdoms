import { Color, Node, Sprite, UIOpacity, UITransform, Vec3, tween } from 'cc';
import {
  MENU_BG_PATH,
  MENU_LOGO_PATH,
  MENU_TEX,
  RL,
} from '../shared/RemakeLayout';
import {
  MENU_BRAND_SUB,
  TITLE_ENTRIES,
  titleEntryVisible,
  type TitleEntryId,
} from '../shared/MenuSpec';
import {
  createClassicButton,
  fadeOpacity,
  loadSpriteFrame,
  makeLabel,
  playMenuBgm,
  setOpacity,
  type ClassicButton,
  type MenuButtonStyle,
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

const STYLE_BY_ID: Record<
  TitleEntryId,
  { style: MenuButtonStyle; width: number; height: number }
> = {
  newGame: { style: 'primary', width: RL.btnPrimaryW, height: RL.btnPrimaryH },
  continue: { style: 'secondary', width: RL.btnSecondaryW, height: RL.btnSecondaryH },
  gallery: { style: 'tertiary', width: RL.btnTertiaryW, height: RL.btnTertiaryH },
  settings: { style: 'quaternary', width: RL.btnQuaternaryW, height: RL.btnQuaternaryH },
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
    bgSp.color = new Color(12, 16, 28, 255);
  }

  const vignette = new Node('Vignette');
  root.addChild(vignette);
  const vigSp = vignette.addComponent(Sprite);
  const vigFrame = await loadSpriteFrame(MENU_TEX.vignette);
  if (vigFrame) {
    applySpriteCover(vignette, vigSp, vigFrame, vw, vh);
  } else {
    vignette.addComponent(UITransform).setContentSize(vw, vh);
    vigSp.sizeMode = Sprite.SizeMode.CUSTOM;
    const pixel = await loadSpriteFrame(MENU_TEX.pixel);
    if (pixel) vigSp.spriteFrame = pixel;
    vigSp.color = new Color(0, 0, 0, RL.vignetteOpacity);
  }
  const vigOp = vignette.getComponent(UIOpacity) ?? vignette.addComponent(UIOpacity);
  vigOp.opacity = 255;

  const mist = new Node('Mist');
  root.addChild(mist);
  const mistSp = mist.addComponent(Sprite);
  const mistFrame = await loadSpriteFrame(MENU_TEX.mist);
  if (mistFrame) {
    applySpriteCover(mist, mistSp, mistFrame, vw * 1.12, RL.mistH);
  } else {
    mist.addComponent(UITransform).setContentSize(vw * 1.12, RL.mistH);
    mistSp.sizeMode = Sprite.SizeMode.CUSTOM;
  }
  mist.setPosition(0, RL.mistY, 0);
  mistSp.color = new Color(255, 236, 200, 110);
  tween(mist)
    .repeatForever(
      tween(mist)
        .to(20, { position: new Vec3(40, RL.mistY, 0) })
        .to(20, { position: new Vec3(-40, RL.mistY, 0) }),
    )
    .start();

  const logoGroup = new Node('LogoGroup');
  root.addChild(logoGroup);
  applyDesignUiTransform(logoGroup, 0, 0, vh);

  const logo = new Node('Logo');
  logoGroup.addChild(logo);
  const logoDesignY = RL.logoY - RL.safeTop * 0.12;
  logo.setPosition(0, logoDesignY, 0);
  const logoSp = logo.addComponent(Sprite);
  const logoFrame = await loadSpriteFrame(MENU_LOGO_PATH);
  if (logoFrame) {
    applySpriteContain(logo, logoSp, logoFrame, RL.logoMaxW, RL.logoMaxH);
    logo.setPosition(0, logoDesignY, 0);
  } else {
    logo.addComponent(UITransform).setContentSize(RL.logoMaxW, 120);
    logoSp.sizeMode = Sprite.SizeMode.CUSTOM;
  }

  const menu = new Node('Menu');
  root.addChild(menu);
  applyDesignUiTransform(menu, 0, RL.menuCenterY, vh);

  const cbMap: Record<TitleEntryId, () => void> = {
    newGame: callbacks.onNewGame,
    continue: callbacks.onContinue,
    gallery: callbacks.onGallery,
    settings: callbacks.onSettings,
  };

  const showSave = hasSave();
  const visibleEntries = TITLE_ENTRIES.filter((e) => titleEntryVisible(e, showSave));
  const totalH =
    visibleEntries.reduce((sum, e) => sum + STYLE_BY_ID[e.id].height, 0) +
    RL.gapPrimary * Math.max(0, visibleEntries.length - 1);

  let y = totalH / 2;
  const buttons: ClassicButton[] = [];
  for (const entry of visibleEntries) {
    const geo = STYLE_BY_ID[entry.id];
    y -= geo.height / 2;
    const btn = await createClassicButton(menu, {
      name: `Btn_${entry.id}`,
      label: entry.label,
      style: geo.style,
      width: geo.width,
      height: geo.height,
      y,
      onClick: cbMap[entry.id],
    });
    buttons.push(btn);
    y -= geo.height / 2 + RL.gapPrimary;
  }

  const sub = makeLabel(root, 'SubBrand', MENU_BRAND_SUB, {
    fontSize: 22,
    color: new Color(200, 180, 140, 120),
    y: 0,
  });
  applyDesignUiTransform(sub.node, 0, RL.footerY, vh);

  playMenuBgm(root);

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
