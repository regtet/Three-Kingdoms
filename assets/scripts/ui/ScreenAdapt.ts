import { Camera, Node, UITransform, view, ResolutionPolicy } from 'cc';
import { L } from './OfficialLayout';

/** 竖屏专用：始终 fitHeight，避免 APK 上下黑边 */
export function applyScreenAdapt(root: Node, camera?: Camera | null): void {
  const designW = L.W;
  const designH = L.H;
  view.setDesignResolutionSize(designW, designH, ResolutionPolicy.FIXED_HEIGHT);

  const visible = view.getVisibleSize();
  const tf = root.getComponent(UITransform);
  if (tf) {
    tf.setContentSize(designW, designH);
  }

  if (camera) {
    camera.orthoHeight = visible.height / 2;
  }
}

/** 获取安全区 inset（近似） */
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
