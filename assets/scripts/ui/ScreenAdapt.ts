import { Camera, Node, UITransform, view, ResolutionPolicy } from 'cc';
import { L } from './OfficialLayout';

/** 屏幕适配：设计分辨率 720×1280，等比缩放不变形 */
export function applyScreenAdapt(root: Node, camera?: Camera | null): void {
  const frame = view.getVisibleSize();
  const designW = L.W;
  const designH = L.H;
  const frameRatio = frame.width / frame.height;
  const designRatio = designW / designH;

  if (frameRatio >= designRatio) {
    view.setDesignResolutionSize(designW, designH, ResolutionPolicy.FIXED_HEIGHT);
  } else {
    view.setDesignResolutionSize(designW, designH, ResolutionPolicy.FIXED_WIDTH);
  }

  const visible = view.getVisibleSize();
  const tf = root.getComponent(UITransform);
  if (tf) {
    tf.setContentSize(designW, designH);
  }

  if (camera) {
    camera.orthoHeight = visible.height / 2;
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
