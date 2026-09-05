import { Component, Node, Vec3 } from 'cc';
import { RL, RC } from '../shared/RemakeLayout';
import {
  clearChildren,
  fillScreenBg,
  remakeButton,
  remakeColor,
  remakeLabel,
  remakePageTitle,
} from '../shared/RemakeWidgets';

/** 阶段4 占位：地图复刻前的过渡屏 */
export function buildMapStubScreen(
  layer: Node,
  host: Component,
  info: string,
  onBackToTitle: () => void,
): void {
  clearChildren(layer);
  fillScreenBg(layer);
  remakePageTitle(layer, '战略地图', '阶段4 · 地图复刻尚未开始');

  const body = remakeLabel(layer, 'Info', info, 18, new Vec3(0, RL.PLACEHOLDER_Y, 0), RL.PAGE_BODY_W, true);
  body.color = remakeColor(RC.textDim);

  remakeLabel(
    layer,
    'Note',
    '框架已定：菜单 → 地图 → 行动机制。请按阶段推进，勿在旧 GameRoot 打补丁。',
    15,
    new Vec3(0, RL.PAGE_ACTION_Y, 0),
    RL.PAGE_BODY_W,
    true,
  );

  remakeButton(layer, 'Back', '返回标题', new Vec3(0, RL.PAGE_BACK_Y, 0), host, onBackToTitle, 220, 48);
}
