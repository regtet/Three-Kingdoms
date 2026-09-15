import {
  AudioClip,
  AudioSource,
  Button,
  Color,
  EventTouch,
  Label,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  UIOpacity,
  UITransform,
  Vec3,
  tween,
} from 'cc';
import { MENU_BGM_PATH, MENU_BGM_VOLUME, MENU_CLICK_SFX, MENU_TEX, BTN_LABEL_COLOR, RL } from './RemakeLayout';
import { loadSettings } from './SettingsPrefs';
import { setVisibleLayerSize } from './ScreenAdapt';

export type MenuButtonStyle = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

const TEX_BY_STYLE: Record<MenuButtonStyle, string> = {
  primary: MENU_TEX.inkMain,
  secondary: MENU_TEX.inkMain,
  tertiary: MENU_TEX.inkSub,
  quaternary: MENU_TEX.inkSub,
};

const FONT_BY_STYLE: Record<MenuButtonStyle, number> = {
  primary: RL.btnFontSize,
  secondary: RL.btnFontSize,
  tertiary: RL.btnFontSize,
  quaternary: RL.btnFontSize,
};

function loadFrame(path: string): Promise<SpriteFrame | null> {
  return new Promise((resolve) => {
    resources.load(`${path}/spriteFrame`, SpriteFrame, (err, frame) => {
      if (!err && frame) {
        resolve(frame);
        return;
      }
      resources.load(path, SpriteFrame, (err2, frame2) => {
        resolve(!err2 && frame2 ? frame2 : null);
      });
    });
  });
}

export async function loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
  return loadFrame(path);
}

/** 全屏层 = 可见设计区 */
export function stretchFull(node: Node): void {
  setVisibleLayerSize(node);
}

export function makeLabel(
  parent: Node,
  name: string,
  text: string,
  opts: {
    fontSize: number;
    color: Color;
    y: number;
    x?: number;
    bold?: boolean;
  },
): Label {
  const n = new Node(name);
  parent.addChild(n);
  n.setPosition(opts.x ?? 0, opts.y, 0);
  const ui = n.addComponent(UITransform);
  ui.setContentSize(RL.W - 120, opts.fontSize * 2);
  const label = n.addComponent(Label);
  label.string = text;
  label.fontSize = opts.fontSize;
  label.lineHeight = Math.round(opts.fontSize * 1.25);
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.color = opts.color;
  label.overflow = Label.Overflow.SHRINK;
  if (opts.bold) label.isBold = true;
  return label;
}

export type ClassicButton = {
  node: Node;
  setSelected: (on: boolean) => void;
};

export async function createClassicButton(
  parent: Node,
  opts: {
    name: string;
    label: string;
    style: MenuButtonStyle;
    width: number;
    height: number;
    y: number;
    onClick: () => void;
    labelColor?: Color;
    /** 覆盖贴图（标题多变体笔触） */
    texturePath?: string;
    /** 轻微水平偏移，增强手写感 */
    x?: number;
    bold?: boolean;
  },
): Promise<ClassicButton> {
  const node = new Node(opts.name);
  parent.addChild(node);
  node.setPosition(opts.x ?? 0, opts.y, 0);
  const ui = node.addComponent(UITransform);
  ui.setContentSize(opts.width, opts.height);

  const bg = new Node('Bg');
  node.addChild(bg);
  bg.addComponent(UITransform).setContentSize(opts.width, opts.height);
  const sp = bg.addComponent(Sprite);
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  sp.type = Sprite.Type.SIMPLE;
  const texPath = opts.texturePath ?? TEX_BY_STYLE[opts.style];
  const frame = await loadFrame(texPath);
  if (frame) {
    try {
      (frame as unknown as { insetTop: number }).insetTop = 0;
      (frame as unknown as { insetBottom: number }).insetBottom = 0;
      (frame as unknown as { insetLeft: number }).insetLeft = 0;
      (frame as unknown as { insetRight: number }).insetRight = 0;
    } catch {
      /* ignore */
    }
    sp.spriteFrame = frame;
    bg.getComponent(UITransform)!.setContentSize(opts.width, opts.height);
  } else {
    const pixel = await loadFrame(MENU_TEX.pixel);
    if (pixel) sp.spriteFrame = pixel;
    sp.color = new Color(28, 24, 18, 180);
  }

  const rim = new Node('Rim');
  node.addChild(rim);
  rim.addComponent(UITransform).setContentSize(opts.width + 10, opts.height + 10);
  const rimSp = rim.addComponent(Sprite);
  rimSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const rimFrame = await loadFrame(MENU_TEX.rim);
  if (rimFrame) rimSp.spriteFrame = rimFrame;
  const rimOp = rim.addComponent(UIOpacity);
  rimOp.opacity = 0;

  const labelColor =
    opts.labelColor ??
    new Color(BTN_LABEL_COLOR.r, BTN_LABEL_COLOR.g, BTN_LABEL_COLOR.b, BTN_LABEL_COLOR.a);
  makeLabel(node, 'Label', opts.label, {
    fontSize: FONT_BY_STYLE[opts.style],
    color: labelColor,
    y: 0,
    bold: opts.bold ?? false,
  });

  const btn = node.addComponent(Button);
  btn.transition = Button.Transition.NONE;

  let busy = false;
  node.on(Node.EventType.TOUCH_END, (_e: EventTouch) => {
    if (busy || !node.active) return;
    busy = true;
    playClickSfx(parent);
    tween(node)
      .to(RL.pressMs / 1000, { scale: new Vec3(RL.pressScale, RL.pressScale, 1) })
      .to(RL.pressMs / 1000, { scale: new Vec3(1, 1, 1) })
      .call(() => {
        busy = false;
        opts.onClick();
      })
      .start();
  });

  node.on(Node.EventType.MOUSE_ENTER, () => {
    rimOp.opacity = 210;
  });
  node.on(Node.EventType.MOUSE_LEAVE, () => {
    rimOp.opacity = 0;
  });

  return {
    node,
    setSelected: (on: boolean) => {
      rimOp.opacity = on ? 220 : 0;
      sp.color = on ? new Color(255, 248, 235, 255) : Color.WHITE;
    },
  };
}

let cachedClick: AudioClip | null = null;
let cachedBgm: AudioClip | null = null;
let audioHost: AudioSource | null = null;
let bgmHost: AudioSource | null = null;

function ensureSfxHost(host: Node): AudioSource {
  if (!audioHost || !audioHost.node?.isValid) {
    const n = new Node('MenuSfx');
    host.scene?.addChild(n) ?? host.addChild(n);
    audioHost = n.addComponent(AudioSource);
    audioHost.playOnAwake = false;
  }
  return audioHost;
}

function ensureBgmHost(host: Node): AudioSource {
  if (!bgmHost || !bgmHost.node?.isValid) {
    const n = new Node('MenuBgm');
    host.scene?.addChild(n) ?? host.addChild(n);
    bgmHost = n.addComponent(AudioSource);
    bgmHost.playOnAwake = false;
    bgmHost.loop = true;
  }
  return bgmHost;
}

export function playClickSfx(host: Node): void {
  const prefs = loadSettings();
  if (!prefs.sfxEnabled) return;
  const src = ensureSfxHost(host);
  const vol = prefs.sfxVolume;
  if (cachedClick) {
    src.playOneShot(cachedClick, vol);
    return;
  }
  resources.load(MENU_CLICK_SFX, AudioClip, (err, clip) => {
    if (err || !clip) return;
    cachedClick = clip;
    src.playOneShot(clip, vol);
  });
}

export function playMenuBgm(host: Node): void {
  const prefs = loadSettings();
  if (!prefs.musicEnabled) {
    stopMenuBgm();
    return;
  }
  const src = ensureBgmHost(host);
  const vol = Math.min(prefs.musicVolume, MENU_BGM_VOLUME);
  const start = (clip: AudioClip) => {
    if (!src.node?.isValid) return;
    src.clip = clip;
    src.volume = vol;
    src.loop = true;
    if (!src.playing) src.play();
    else src.volume = vol;
  };
  if (cachedBgm) {
    start(cachedBgm);
    return;
  }
  resources.load(MENU_BGM_PATH, AudioClip, (err, clip) => {
    if (err || !clip) return;
    cachedBgm = clip;
    start(clip);
  });
}

export function applyMenuBgmVolume(): void {
  if (!bgmHost || !bgmHost.node?.isValid) return;
  const prefs = loadSettings();
  if (!prefs.musicEnabled) {
    stopMenuBgm();
    return;
  }
  bgmHost.volume = Math.min(prefs.musicVolume, MENU_BGM_VOLUME);
  if (!bgmHost.playing && cachedBgm) {
    bgmHost.clip = cachedBgm;
    bgmHost.loop = true;
    bgmHost.play();
  }
}

export function stopMenuBgm(): void {
  if (bgmHost && bgmHost.node?.isValid && bgmHost.playing) {
    bgmHost.stop();
  }
}

export function fadeOpacity(node: Node, from: number, to: number, ms: number): Promise<void> {
  if (!node.isValid) return Promise.resolve();
  const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  op.opacity = from;
  return new Promise((resolve) => {
    tween(op)
      .to(ms / 1000, { opacity: to })
      .call(() => resolve())
      .start();
  });
}

export function setOpacity(node: Node, opacity: number): void {
  if (!node.isValid) return;
  const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  op.opacity = opacity;
}
