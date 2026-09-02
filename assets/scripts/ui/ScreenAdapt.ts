import { Camera, Node, UITransform, view, ResolutionPolicy } from 'cc';
import { L } from './OfficialLayout';

/**
 * 竖屏适配：FIXED_WIDTH 保证 720 设计宽度完整可见（表格/姓名不被左右裁切）。
 * 超长屏可能出现少量上下留边，优于 FIXED_HEIGHT 在窄屏上截断横向内容。
 */
export function applyScreenAdapt(root: Node, camera?: Camera | null): void {
  const designW = L.W;
  const designH = L.H;
  view.setDesignResolutionSize(designW, designH, ResolutionPolicy.FIXED_WIDTH);

  const visible = view.getVisibleSize();
  const tf = root.getComponent(UITransform);
  if (tf) {
    tf.setContentSize(designW, Math.max(designH, visible.height));
  }

  if (camera) {
    camera.orthoHeight = visible.height / 2;
  }
}

/** 设计坐标下可见区域（宽恒为 L.W，高随设备变化） */
export function getVisibleDesignSize(): { width: number; height: number } {
  const visible = view.getVisibleSize();
  return { width: visible.width, height: visible.height };
}

/** 大厅层 / 全屏背景尺寸（FIXED_WIDTH 下高度可能大于 L.H） */
export function getLobbyLayerSize(): { width: number; height: number } {
  const { width, height } = getVisibleDesignSize();
  return { width: L.W, height: Math.max(L.H, height) };
}

/** 获取安全区 inset（近似） */
export function getSafeInsets(): { top: number; bottom: number } {
  const frame = view.getVisibleSize();
  const designH = L.H;
  const scale = frame.width / L.W;
  const excess = Math.max(0, (frame.height - designH * scale) / 2);
  return {
    top: Math.min(48, excess / scale),
    bottom: Math.min(32, excess / scale),
  };
}
