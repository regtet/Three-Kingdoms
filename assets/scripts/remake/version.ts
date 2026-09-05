/** 复刻构建号：改 UI 后必须 bump，便于确认 Cocos 已加载新脚本 */
export const REMAKE_BUILD_TAG = 'REMAKE-v0.1.0';

export type RemakePhase = 'menu' | 'map' | 'play';

/** 当前允许开发的阶段；未开放阶段只显示占位 */
export const ACTIVE_REMAKE_PHASE: RemakePhase = 'menu';
