/** 复刻构建号：改 UI 后必须 bump，便于确认 Cocos 已加载新脚本 */
export const REMAKE_BUILD_TAG = 'REMAKE-v0.3.3';

export type RemakePhase = 'menu' | 'map' | 'play';

/** 当前开发阶段：地图主框架对齐官方 */
export const ACTIVE_REMAKE_PHASE: RemakePhase = 'map';
