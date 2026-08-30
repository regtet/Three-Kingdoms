import {
  BlockInputEvents,
  Button,
  Color,
  Graphics,
  Label,
  Node,
  resources,
  UITransform,
  VideoClip,
  VideoPlayer,
} from 'cc';
import { COL, L } from './OfficialLayout';
import { fitCover } from './SpriteFit';
import { drawPanel, toColor } from './UiDraw';

/** 播放开场视频；失败或结束时回调 */
export function playIntroVideo(parent: Node, onFinish: () => void): Node {
  const layer = new Node('IntroLayer');
  parent.addChild(layer);
  layer.setSiblingIndex(parent.children.length - 1);
  layer.addComponent(UITransform).setContentSize(L.W, L.H);
  layer.addComponent(BlockInputEvents);

  const bg = new Node('IntroBg');
  layer.addChild(bg);
  bg.addComponent(UITransform).setContentSize(L.W, L.H);
  const g = bg.addComponent(Graphics);
  g.fillColor = new Color(0, 0, 0, 255);
  g.rect(-L.W / 2, -L.H / 2, L.W, L.H);
  g.fill();

  const videoNode = new Node('IntroVideo');
  layer.addChild(videoNode);
  videoNode.setPosition(0, 0, 0);
  const player = videoNode.addComponent(VideoPlayer);
  player.resourceType = VideoPlayer.ResourceType.LOCAL;
  player.stayOnBottom = false;

  let done = false;
  const finish = (reason: string) => {
    if (done) return;
    done = true;
    console.log(`[IntroVideo] 结束: ${reason}`);
    layer.destroy();
    onFinish();
  };

  /** 竖屏全屏：等比 cover 铺满，不拉伸变形 */
  const applyVideoCover = (mediaW = 1920, mediaH = 1080) => {
    const { w, h } = fitCover(L.W, L.H, mediaW, mediaH);
    const tf = videoNode.getComponent(UITransform) ?? videoNode.addComponent(UITransform);
    tf.setContentSize(w, h);
    tf.setAnchorPoint(0.5, 0.5);
    console.log(`[IntroVideo] cover ${mediaW}x${mediaH} → ${w}x${h}`);
  };

  applyVideoCover();

  player.node.on(VideoPlayer.EventType.COMPLETED, () => finish('completed'));
  player.node.on(VideoPlayer.EventType.ERROR, () => finish('error'));
  player.node.on(VideoPlayer.EventType.META_LOADED, () => {
    const meta = player.meta;
    if (meta?.width && meta?.height) applyVideoCover(meta.width, meta.height);
  });
  player.node.on(VideoPlayer.EventType.READY_TO_PLAY, () => {
    const meta = player.meta;
    if (meta?.width && meta?.height) applyVideoCover(meta.width, meta.height);
  });

  const skipNode = new Node('SkipIntro');
  layer.addChild(skipNode);
  skipNode.setPosition(0, -L.H / 2 + 56, 0);
  skipNode.addComponent(UITransform).setContentSize(160, 44);
  drawPanel(skipNode.addComponent(Graphics), 160, 44, toColor(COL.subPanel), toColor(COL.borderGoldDim), 8);
  const skipLb = new Node('Label');
  skipNode.addChild(skipLb);
  skipLb.addComponent(UITransform).setContentSize(160, 44);
  const lb = skipLb.addComponent(Label);
  lb.string = '跳过';
  lb.fontSize = 18;
  lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  lb.color = toColor(COL.text);
  skipNode.addComponent(Button);
  skipNode.on(Button.EventType.CLICK, () => {
    try { player.stop(); } catch { /* ignore */ }
    finish('skip');
  });

  resources.load('video/intro', VideoClip, (err, clip) => {
    if (err || !clip) {
      console.warn('[IntroVideo] 加载 video/intro 失败，跳过开场', err);
      finish('load-fail');
      return;
    }
    player.clip = clip;
    player.play();
    console.log('[IntroVideo] 开始播放 intro.mp4');
  });

  return layer;
}
