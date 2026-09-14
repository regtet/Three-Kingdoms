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
  Widget,
  tween,
} from 'cc';
import { MENU_CLICK_SFX, MENU_TEX, RL } from './RemakeLayout';

export type MenuButtonStyle = 'primary' | 'secondary' | 'scroll' | 'settings';

const TEX_BY_STYLE: Record<MenuButtonStyle, string> = {
  primary: MENU_TEX.woodPrimary,
  secondary: MENU_TEX.woodSecondary,
  scroll: MENU_TEX.scroll,
  settings: MENU_TEX.bronze,
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

export function stretchFull(node: Node, w = RL.W, h = RL.H): void {
  const ui = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  ui.setContentSize(w, h);
  const widget = node.getComponent(Widget) ?? node.addComponent(Widget);
  widget.isAlignTop = true;
  widget.isAlignBottom = true;
  widget.isAlignLeft = true;
  widget.isAlignRight = true;
  widget.top = 0;
  widget.bottom = 0;
  widget.left = 0;
  widget.right = 0;
  widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
  widget.updateAlignment();
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
  },
): Promise<ClassicButton> {
  const node = new Node(opts.name);
  parent.addChild(node);
  node.setPosition(0, opts.y, 0);
  const ui = node.addComponent(UITransform);
  ui.setContentSize(opts.width, opts.height);

  const bg = new Node('Bg');
  node.addChild(bg);
  bg.addComponent(UITransform).setContentSize(opts.width, opts.height);
  const sp = bg.addComponent(Sprite);
  sp.sizeMode = Sprite.SizeMode.CUSTOM;
  const frame = await loadFrame(TEX_BY_STYLE[opts.style]);
  if (frame) {
    sp.spriteFrame = frame;
    bg.getComponent(UITransform)!.setContentSize(opts.width, opts.height);
  } else {
    const pixel = await loadFrame(MENU_TEX.pixel);
    if (pixel) sp.spriteFrame = pixel;
    sp.color = new Color(80, 50, 30, 255);
  }

  const rim = new Node('Rim');
  node.addChild(rim);
  rim.addComponent(UITransform).setContentSize(opts.width + 8, opts.height + 8);
  const rimSp = rim.addComponent(Sprite);
  rimSp.sizeMode = Sprite.SizeMode.CUSTOM;
  const rimFrame = await loadFrame(MENU_TEX.rim);
  if (rimFrame) rimSp.spriteFrame = rimFrame;
  const rimOp = rim.addComponent(UIOpacity);
  rimOp.opacity = 0;

  const labelColor =
    opts.labelColor ??
    (opts.style === 'scroll'
      ? new Color(62, 40, 22, 255)
      : new Color(245, 230, 190, 255));
  makeLabel(node, 'Label', opts.label, {
    fontSize: opts.style === 'primary' ? 44 : opts.style === 'settings' ? 30 : 36,
    color: labelColor,
    y: 0,
    bold: opts.style === 'primary',
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
    rimOp.opacity = 200;
  });
  node.on(Node.EventType.MOUSE_LEAVE, () => {
    rimOp.opacity = 0;
  });

  return {
    node,
    setSelected: (on: boolean) => {
      rimOp.opacity = on ? 220 : 0;
      sp.color = on ? new Color(255, 245, 220, 255) : Color.WHITE;
    },
  };
}

let cachedClick: AudioClip | null = null;
let audioHost: AudioSource | null = null;

export function playClickSfx(host: Node): void {
  const ensure = () => {
    if (!audioHost) {
      const n = new Node('MenuAudio');
      host.scene?.addChild(n) ?? host.addChild(n);
      audioHost = n.addComponent(AudioSource);
      audioHost.playOnAwake = false;
    }
    return audioHost;
  };
  const src = ensure();
  if (cachedClick) {
    src.playOneShot(cachedClick, 1);
    return;
  }
  resources.load(MENU_CLICK_SFX, AudioClip, (err, clip) => {
    if (err || !clip) return;
    cachedClick = clip;
    src.playOneShot(clip, 1);
  });
}

export function fadeOpacity(node: Node, from: number, to: number, ms: number): Promise<void> {
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
  const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  op.opacity = opacity;
}
