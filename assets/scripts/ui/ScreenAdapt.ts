import { Node, UITransform, view, ResolutionPolicy, Widget } from 'cc';
import { L } from './OfficialLayout';

/** 屏幕适配：消除顶底黑边，设计分辨率 720×1280 */
export function applyScreenAdapt(root: Node): void {
  const frame = view.getVisibleSize();
  const designW = L.W;
  const designH = L.H;
  const frameRatio = frame.width / frame.height;
  const designRatio = designW / designH;

  // 宽屏用固定高度，窄屏用固定宽度；NO_BORDER 铺满可视区域
  if (frameRatio >= designRatio) {
    view.setDesignResolutionSize(designW, designH, ResolutionPolicy.FIXED_HEIGHT);
  } else {
    view.setDesignResolutionSize(designW, designH, ResolutionPolicy.FIXED_WIDTH);
  }

  const tf = root.getComponent(UITransform);
  if (tf) {
    tf.setContentSize(designW, designH);
  }

  // 背景层 Widget 四边对齐，防止 NO_BORDER 裁切露边
  let bg = root.getChildByName('RootBg');
  if (!bg) {
    bg = root.children[0];
  }
  if (bg) {
    let widget = bg.getComponent(Widget);
    if (!widget) widget = bg.addComponent(Widget);
    widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
    widget.top = widget.bottom = widget.left = widget.right = 0;
    widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
  }
}

/** 获取安全区 inset（近似，浏览器/Cocos 预览） */
export function getSafeInsets(): { top: number; bottom: number } {
  const frame = view.getVisibleSize();
  const designH = L.H;
  const scale = frame.height / designH;
  const excess = Math.max(0, (frame.height - designH * scale) / 2);
  return {
    top: Math.min(48, excess / scale),
    bottom: Math.min(32, excess / scale),
  };
}
