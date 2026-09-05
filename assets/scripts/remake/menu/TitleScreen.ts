import { REMAKE_BUILD_TAG } from '../version';
import { RL, RC } from '../shared/RemakeLayout';
import {
  clearChildren,
  fillScreenBg,
  remakeColor,
  remakeLabel,
  remakeTextItem,
} from '../shared/RemakeWidgets';
import { applyMenuLogo, preloadBrandAssets } from '../../ui/BrandAssets';
import { applyMenuBackground, preloadMenuBackgrounds } from '../../ui/MenuBackground';
import { loadSettings } from '../../ui/GameSettings';
import { hasAnySave } from '../../core/systems/save';
import { Component, Label, Node, Vec3 } from 'cc';

export type TitleActions = {
  onNewGame: () => void;
  onContinue: () => void;
  onSettings: () => void;
  onExit: () => void;
};

/** 标题 / 主菜单（复刻阶段3） */
export function buildTitleScreen(layer: Node, host: Component, actions: TitleActions): void {
  clearChildren(layer);
  fillScreenBg(layer);
  const settings = loadSettings();
  void preloadMenuBackgrounds().then(() => {
    applyMenuBackground(layer, settings.menuBackgroundId);
  });
  void preloadBrandAssets().then(() => {
    applyMenuLogo(layer);
  });

  const title = remakeLabel(layer, 'GameTitle', '三国志 · 天下争锋', 36, new Vec3(0, RL.TITLE_NAME_Y, 0));
  title.color = remakeColor(RC.textGold);

  const tag = remakeLabel(
    layer,
    'BuildTag',
    REMAKE_BUILD_TAG,
    14,
    new Vec3(RL.TITLE_BUILD_X, RL.TITLE_BUILD_Y, 0),
    160,
  );
  tag.color = remakeColor(RC.textDim);
  tag.horizontalAlign = Label.HorizontalAlign.RIGHT;

  const items = new Node('TitleItems');
  layer.addChild(items);
  let y = RL.TITLE_ITEMS_START_Y;
  remakeTextItem(items, 'NewGame', '新 游 戏', y, host, actions.onNewGame);
  y -= RL.TITLE_ITEM_GAP;
  if (hasAnySave()) {
    remakeTextItem(items, 'Continue', '继 续 游 戏', y, host, actions.onContinue);
    y -= RL.TITLE_ITEM_GAP;
  }
  remakeTextItem(items, 'Settings', '设　　置', y, host, actions.onSettings);
  y -= RL.TITLE_ITEM_GAP + 12;
  remakeTextItem(items, 'Exit', '退　　出', y, host, actions.onExit);
}
