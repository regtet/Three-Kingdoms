import { describe, it, expect } from 'vitest';
import { L, layoutBand, layoutGapAbove, mapScreenBands } from '../assets/scripts/ui/OfficialLayout';

const MIN_GAP = 8;
const SCREEN_BOTTOM = -L.H / 2;
const BTN_H = 44;
const SORT_H = 30;
const FOOTER_H = 44;
const ROW_GAP = L.GEN_LIST_ROW_H + 8;
const LIST_PAGE_SIZE = 2;

describe('layout constants', () => {
  it('design resolution is 720x1280', () => {
    expect(L.W).toBe(720);
    expect(L.H).toBe(1280);
  });

  it('vertical stack: header → city → map → log → cmd without overlap', () => {
    const { header, city, map, log, cmd } = mapScreenBands();
    expect(layoutGapAbove(header, city)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(city, map)).toBeGreaterThanOrEqual(0);
    expect(layoutGapAbove(map, log)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(log, cmd)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(cmd.bottom).toBeGreaterThan(SCREEN_BOTTOM);
  });

  it('sub panel covers command bar region (bottom sheet)', () => {
    const { cmd, subPanel } = mapScreenBands();
    expect(subPanel.bottom).toBeLessThanOrEqual(SCREEN_BOTTOM + 1);
    expect(subPanel.bottom).toBeLessThanOrEqual(cmd.bottom);
    expect(subPanel.top).toBeGreaterThanOrEqual(cmd.top);
  });

  it('sub panel internal zones do not overlap', () => {
    const sort = layoutBand(L.SUB_SORT_Y, SORT_H);
    const listTop = layoutBand(L.SUB_LIST_TOP_Y, L.GEN_LIST_ROW_H);
    const listBottom = layoutBand(L.SUB_LIST_TOP_Y - (LIST_PAGE_SIZE - 1) * ROW_GAP, L.GEN_LIST_ROW_H);
    const action = layoutBand(L.SUB_ACTION_Y, BTN_H);
    const extra = layoutBand(L.SUB_EXTRA_Y, BTN_H);
    const footer = layoutBand(L.SUB_FOOTER_Y, FOOTER_H);

    expect(layoutGapAbove(sort, listTop)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(listBottom, action)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(action, extra)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(extra, footer)).toBeGreaterThanOrEqual(MIN_GAP);

    const cycle = layoutBand(L.SUB_TRANSPORT_CYCLE_Y, 32);
    const tlist = layoutBand(L.SUB_TRANSPORT_LIST_Y, 40);
    expect(layoutGapAbove(cycle, tlist)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(tlist, footer)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('sub panel title and footer stay inside panel bounds', () => {
    const half = L.SUB_PANEL_H / 2;
    expect(L.SUB_TITLE_Y).toBeLessThanOrEqual(half - 20);
    expect(L.SUB_FOOTER_Y).toBeGreaterThanOrEqual(-half + 20);
  });

  it('main menu logo top band sits above text menu items', () => {
    const logo = { top: L.MENU_LOGO_TOP_Y, bottom: L.MENU_LOGO_TOP_Y - L.MENU_LOGO_H };
    const firstItem = layoutBand(L.MENU_ITEMS_START_Y, L.MENU_ITEM_H);
    expect(layoutGapAbove(logo, firstItem)).toBeGreaterThanOrEqual(24);
  });

  it('main menu items have vertical spacing', () => {
    const item1 = layoutBand(L.MENU_ITEMS_START_Y, L.MENU_ITEM_H);
    const item2 = layoutBand(L.MENU_ITEMS_START_Y - L.MENU_ITEM_GAP, L.MENU_ITEM_H);
    expect(layoutGapAbove(item1, item2)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('sidebar sits within map vertical range', () => {
    const map = layoutBand(L.MAP_CENTER.y, L.MAP_H);
    for (const y of [L.SIDEBAR_Y1, L.SIDEBAR_Y2, L.SIDEBAR_Y3, L.SIDEBAR_Y4]) {
      const btn = layoutBand(y, L.SIDEBAR_BTN_H);
      expect(btn.top).toBeLessThanOrEqual(map.top + 4);
      expect(btn.bottom).toBeGreaterThanOrEqual(map.bottom - 4);
    }
  });

  it('lobby secondary pages: title above subtitle above list', () => {
    const title = layoutBand(L.LOBBY_TITLE_Y, 46);
    const subtitle = layoutBand(L.LOBBY_SUBTITLE_Y, 28);
    const firstList = layoutBand(L.LOBBY_LIST_START_Y, L.MENU_ITEM_H);
    expect(layoutGapAbove(title, subtitle)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(subtitle, firstList)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('lobby list items have vertical spacing', () => {
    const item1 = layoutBand(L.LOBBY_LIST_START_Y, L.MENU_ITEM_H);
    const item2 = layoutBand(L.LOBBY_LIST_START_Y - L.LOBBY_LIST_GAP, L.MENU_ITEM_H);
    expect(layoutGapAbove(item1, item2)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('lobby settings rows do not overlap', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      layoutBand(L.LOBBY_SETTINGS_START_Y - i * L.LOBBY_SETTINGS_GAP, L.MENU_ITEM_H));
    for (let i = 0; i < rows.length - 1; i++) {
      expect(layoutGapAbove(rows[i], rows[i + 1])).toBeGreaterThanOrEqual(MIN_GAP);
    }
    const extra = layoutBand(L.LOBBY_SETTINGS_EXTRA_Y, L.MENU_ITEM_H);
    const danger = layoutBand(L.LOBBY_SETTINGS_DANGER_Y, L.MENU_ITEM_H);
    expect(layoutGapAbove(rows[9], danger)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(danger, extra)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('lobby back button stays above screen bottom', () => {
    const back = layoutBand(L.LOBBY_BACK_Y, L.MENU_ITEM_H);
    expect(back.bottom).toBeGreaterThan(SCREEN_BOTTOM);
  });

  it('gallery scroll viewport fits on screen', () => {
    const filter = layoutBand(L.LOBBY_GALLERY_FILTER_Y, 36);
    const header = layoutBand(L.LOBBY_GALLERY_TABLE_HEADER_Y, L.LOBBY_GALLERY_TABLE_ROW_H);
    const scroll = layoutBand(L.LOBBY_GALLERY_SCROLL_CENTER_Y, L.LOBBY_GALLERY_SCROLL_H);
    const count = layoutBand(L.LOBBY_GALLERY_COUNT_Y, 20);
    const back = layoutBand(L.LOBBY_BACK_Y, L.MENU_ITEM_H);
    expect(layoutGapAbove(filter, header)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(header, scroll)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(scroll, count)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(count, back)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(L.LOBBY_GALLERY_TABLE_W).toBeLessThanOrEqual(L.W);
    expect(L.LOBBY_GALLERY_SCROLL_TOP - L.LOBBY_GALLERY_SCROLL_BOTTOM).toBe(L.LOBBY_GALLERY_SCROLL_H);
  });

  it('deploy panel control bands stay ordered', () => {
    const secLabel = layoutBand(L.DEPLOY_SEC_LABEL_Y, 16);
    const gen = layoutBand(L.DEPLOY_GEN_Y, 36);
    const sec = layoutBand(L.DEPLOY_SEC_Y, 30);
    const ratio = layoutBand(L.DEPLOY_RATIO_Y, 34);
    const opt = layoutBand(L.DEPLOY_OPT_Y, 34);
    const info = layoutBand(L.DEPLOY_INFO_Y, 48);
    const target = layoutBand(L.DEPLOY_TARGET_Y, 40);
    const cancel = layoutBand(L.MODAL_BTN_Y, 44);
    expect(layoutGapAbove(secLabel, gen)).toBeGreaterThanOrEqual(0);
    expect(layoutGapAbove(gen, sec)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(sec, ratio)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(ratio, opt)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(opt, info)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(info, target)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(target, cancel)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('lobby scenario list fits three entries above back', () => {
    const item0 = layoutBand(L.LOBBY_LIST_START_Y, L.MENU_ITEM_H);
    const item2 = layoutBand(L.LOBBY_LIST_START_Y - 2 * (L.LOBBY_LIST_GAP + 12), L.MENU_ITEM_H);
    const back = layoutBand(L.LOBBY_BACK_Y, L.MENU_ITEM_H);
    expect(layoutGapAbove(item0, item2)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(item2, back)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('battle report frame fits modal chrome', () => {
    const frame = layoutBand(L.BATTLE_FRAME_Y, L.BATTLE_FRAME_H);
    const title = layoutBand(L.MODAL_TITLE_Y, 36);
    const body = layoutBand(L.MODAL_BODY_Y, 200);
    const btn = layoutBand(L.MODAL_BTN_Y, 44);
    expect(title.top).toBeLessThanOrEqual(frame.top - 8);
    expect(layoutGapAbove(title, body)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(body, btn)).toBeGreaterThanOrEqual(MIN_GAP);
    // 确定按钮与出兵弹窗共用 MODAL_BTN_Y，中心落在框内即可
    expect(btn.center).toBeGreaterThanOrEqual(frame.bottom);
    expect(L.BATTLE_REPORT_W).toBeLessThanOrEqual(L.BATTLE_FRAME_W);
  });

  it('tactical hex panel zones do not overlap', () => {
    const title = layoutBand(L.TACT_TITLE_Y, 36);
    const info = layoutBand(L.TACT_INFO_Y, 24);
    const grid = layoutBand(L.TACT_GRID_Y, L.TACT_HEX_SIZE * 7);
    const log = layoutBand(L.TACT_LOG_Y, L.TACT_LOG_H);
    const cmd = layoutBand(L.TACT_CMD_Y, L.TACT_CMD_H);
    const frame = layoutBand(L.TACT_FRAME_Y, L.TACT_FRAME_H);
    expect(layoutGapAbove(title, info)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(info, grid)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(grid, log)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(log, cmd)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(title.top).toBeLessThanOrEqual(frame.top - 8);
    expect(cmd.bottom).toBeGreaterThanOrEqual(frame.bottom + 8);
  });

  it('general editor list fits on screen', () => {
    const title = layoutBand(L.EDITOR_TITLE_Y, 40);
    const header = layoutBand(L.EDITOR_LIST_HEADER_Y, L.EDITOR_LIST_ROW_H);
    const rowLast = layoutBand(
      L.EDITOR_LIST_FIRST_ROW_Y - (L.EDITOR_LIST_ROWS - 1) * L.EDITOR_LIST_ROW_H,
      L.EDITOR_LIST_ROW_H,
    );
    const back = layoutBand(L.EDITOR_BACK_LIST_Y, 44);
    expect(layoutGapAbove(title, header)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(rowLast, back)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(back.bottom).toBeGreaterThan(SCREEN_BOTTOM);
  });
});
