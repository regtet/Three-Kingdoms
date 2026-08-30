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

  it('menu buttons fit inside menu card', () => {
    const card = layoutBand(L.MENU_CARD_Y, L.MENU_CARD_H);
    const toWorld = (localY: number, h: number) => layoutBand(L.MENU_CARD_Y + localY, h);
    const w1 = toWorld(L.MENU_BTN1_Y, 56);
    const w3 = toWorld(L.MENU_BTN3_Y, 48);
    expect(w1.top).toBeLessThanOrEqual(card.top);
    expect(w3.bottom).toBeGreaterThanOrEqual(card.bottom);
  });

  it('sidebar sits within map vertical range', () => {
    const map = layoutBand(L.MAP_CENTER.y, L.MAP_H);
    for (const y of [L.SIDEBAR_Y1, L.SIDEBAR_Y2, L.SIDEBAR_Y3, L.SIDEBAR_Y4]) {
      const btn = layoutBand(y, L.SIDEBAR_BTN_H);
      expect(btn.top).toBeLessThanOrEqual(map.top + 4);
      expect(btn.bottom).toBeGreaterThanOrEqual(map.bottom - 4);
    }
  });

  it('settings rows do not overlap each other', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      layoutBand(L.SETTINGS_ROW_START_Y - i * L.SETTINGS_ROW_GAP, 50));
    for (let i = 0; i < rows.length - 1; i++) {
      expect(layoutGapAbove(rows[i], rows[i + 1])).toBeGreaterThanOrEqual(MIN_GAP);
    }
  });

  it('menu switch buttons sit below note without overlap', () => {
    const note = layoutBand(L.MENU_NOTE_Y, 20);
    const bgBtn = layoutBand(L.MENU_BG_BTN_Y, 40);
    expect(layoutGapAbove(note, bgBtn)).toBeGreaterThanOrEqual(MIN_GAP);
  });
});
