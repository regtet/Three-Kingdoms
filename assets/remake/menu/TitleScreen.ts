import { Color, Node, Sprite, UIOpacity, UITransform, Vec3, tween } from 'cc';
import {
  MENU_BG_PATH,
  MENU_LOGO_PATH,
  MENU_TEX,
  RL,
} from '../shared/RemakeLayout';
import {
  TITLE_ENTRIES,
  titleEntryVisible,
  type TitleEntryId,
} from '../shared/MenuSpec';
import {
  createClassicButton,
  fadeOpacity,
  loadSpriteFrame,
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

/**
 * 标题屏需求（对齐参考·三国志霸业）：
 * 全幅水墨底 → Logo → 深墨金边按钮竖列（亮金字）→ 页脚短句。
 * 不盖大卷轴/浅纸托底，避免糊成一片。
 */
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
  if (bgFrame) applySpriteCover(bg, bgSp, bgFrame, vw, vh);
  else {
    bg.addComponent(UITransform).setContentSize(vw, vh);
    bgSp.sizeMode = Sprite.SizeMode.CUSTOM;
    bgSp.color = new Color(220, 210, 190, 255);
  }

  const vignette = new Node('Vignette');
  root.addChild(vignette);
  const vigSp = vignette.addComponent(Sprite);
  const vigFrame = await loadSpriteFrame(MENU_TEX.vignette);
  if (vigFrame) applySpriteCover(vignette, vigSp, vigFrame, vw, vh);

  const mist = new Node('Mist');
  root.addChild(mist);
  const mistSp = mist.addComponent(Sprite);
  const mistFrame = await loadSpriteFrame(MENU_TEX.mist);
  if (mistFrame) applySpriteCover(mist, mistSp, mistFrame, vw * 1.06, RL.mistH);
  mist.setPosition(0, RL.mistY, 0);
  mistSp.color = new Color(255, 255, 255, 55);
  tween(mist)
    .repeatForever(
      tween(mist)
        .to(26, { position: new Vec3(18, RL.mistY, 0) })
        .to(26, { position: new Vec3(-18, RL.mistY, 0) }),
    )
    .start();

  const logoGroup = new Node('LogoGroup');
  root.addChild(logoGroup);
  applyDesignUiTransform(logoGroup, 0, 0, vh);

  const logo = new Node('Logo');
  logoGroup.addChild(logo);
  const logoY = RL.logoY - RL.safeTop * 0.08;
  const logoSp = logo.addComponent(Sprite);
  const logoFrame = await loadSpriteFrame(MENU_LOGO_PATH);
  if (logoFrame) applySpriteContain(logo, logoSp, logoFrame, RL.logoMaxW, RL.logoMaxH);
  logo.setPosition(0, logoY, 0);

  const menu = new Node('Menu');
  root.addChild(menu);
  applyDesignUiTransform(menu, 0, RL.menuCenterY, vh);

  const cbMap: Record<TitleEntryId, () => void> = {
    newGame: callbacks.onNewGame,
    continue: callbacks.onContinue,
    gallery: callbacks.onGallery,
    settings: callbacks.onSettings,
  };

  const visibleEntries = TITLE_ENTRIES.filter((e) => titleEntryVisible(e, hasSave()));
  const totalH =
    visibleEntries.reduce((s, e) => s + STYLE_BY_ID[e.id].height, 0) +
    RL.gapPrimary * Math.max(0, visibleEntries.length - 1);

  let y = totalH / 2;
  const buttons: ClassicButton[] = [];
  for (const entry of visibleEntries) {
    const geo = STYLE_BY_ID[entry.id];
    y -= geo.height / 2;
    buttons.push(
      await createClassicButton(menu, {
        name: `Btn_${entry.id}`,
        label: entry.label,
        style: geo.style,
        width: geo.width,
        height: geo.height,
        y,
        onClick: cbMap[entry.id],
      }),
    );
    y -= geo.height / 2 + RL.gapPrimary;
  }

  playMenuBgm(root);

  const veil = new Node('IntroVeil');
  root.addChild(veil);
  matchVisibleSize(veil, vis);
  const veilSp = veil.addComponent(Sprite);
  veilSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const px = await loadSpriteFrame(MENU_TEX.pixel);
  if (px) veilSp.spriteFrame = px;
  veilSp.color = new Color(20, 18, 14, 255);
  const veilOp = veil.addComponent(UIOpacity);
  veilOp.opacity = 255;

  if (!(opts?.forceIntro || !hasSeenIntro())) {
    veilOp.opacity = 0;
    veil.active = false;
    return;
  }

  setOpacity(logoGroup, 0);
  setOpacity(menu, 0);
  buttons.forEach((b) => setOpacity(b.node, 0));

  await fadeOpacity(veil, 255, 0, RL.introStepMs + 60);
  if (!veil.isValid) return;
  veil.active = false;
  await fadeOpacity(logoGroup, 0, 255, RL.introStepMs);
  await fadeOpacity(menu, 0, 255, RL.introStepMs * 0.65);
  for (const b of buttons) {
    if (b.node.isValid) await fadeOpacity(b.node, 0, 255, RL.introStepMs * 0.3);
  }
  markIntroSeen();
}
