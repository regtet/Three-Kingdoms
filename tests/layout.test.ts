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
  });

  it('sub panel title and footer stay inside panel bounds', () => {
    const half = L.SUB_PANEL_H / 2;
    expect(L.SUB_TITLE_Y).toBeLessThanOrEqual(half - 20);
    expect(L.SUB_FOOTER_Y).toBeGreaterThanOrEqual(-half + 20);
  });

  it('main menu logo sits above text menu items', () => {
    const logo = layoutBand(L.MENU_LOGO_Y, L.MENU_LOGO_H);
    const firstItem = layoutBand(L.MENU_ITEMS_START_Y, L.MENU_ITEM_H);
    expect(layoutGapAbove(logo, firstItem)).toBeGreaterThanOrEqual(MIN_GAP);
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

  it('general gallery zones stack without overlap', () => {
    const portrait = layoutBand(L.LOBBY_GALLERY_PORTRAIT_Y, 280);
    const name = layoutBand(L.LOBBY_GALLERY_NAME_Y, 36);
    const stats = layoutBand(L.LOBBY_GALLERY_STATS_Y, 28);
    const bio = layoutBand(L.LOBBY_GALLERY_BIO_Y, 120);
    const nav = layoutBand(L.LOBBY_GALLERY_NAV_Y, L.MENU_ITEM_H);
    expect(layoutGapAbove(portrait, name)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(name, stats)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(stats, bio)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(layoutGapAbove(bio, nav)).toBeGreaterThanOrEqual(MIN_GAP);
  });
});
