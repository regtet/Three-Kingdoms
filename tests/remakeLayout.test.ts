import { describe, it, expect } from 'vitest';
import { RL, RC, remakeMapCoord, MAP_CMD_CATEGORIES } from '../assets/scripts/remake/shared/RemakeLayout';
import { RemakeNav } from '../assets/scripts/remake/shared/RemakeNav';
import { ACTIVE_REMAKE_PHASE, REMAKE_BUILD_TAG } from '../assets/scripts/remake/version';

describe('remake framework', () => {
  it('design resolution stays 720x1280', () => {
    expect(RL.W).toBe(720);
    expect(RL.H).toBe(1280);
    expect(RC.bg.a).toBe(255);
  });

  it('title menu items have vertical gap', () => {
    const gap = RL.TITLE_ITEM_GAP - RL.TITLE_ITEM_H;
    expect(gap).toBeGreaterThanOrEqual(8);
  });

  it('page list stays above back button', () => {
    const listBottom = RL.PAGE_LIST_START_Y - 4 * RL.PAGE_LIST_GAP - RL.TITLE_ITEM_H / 2;
    const backTop = RL.PAGE_BACK_Y + 24;
    expect(listBottom).toBeGreaterThan(backTop);
  });

  it('build tag bumped for map chrome', () => {
    expect(REMAKE_BUILD_TAG).toBe('REMAKE-v0.3.3');
    expect(ACTIVE_REMAKE_PHASE).toBe('map');
  });

  it('map chrome regions keep vertical gaps >= 8', () => {
    const dateBottom = RL.MAP_DATE_Y - RL.MAP_DATE_H / 2;
    const statusTop = RL.MAP_STATUS_Y + RL.MAP_STATUS_H / 2;
    expect(dateBottom - statusTop).toBeGreaterThanOrEqual(8);

    const statusBottom = RL.MAP_STATUS_Y - RL.MAP_STATUS_H / 2;
    const mapTop = RL.MAP_AREA_Y + RL.MAP_AREA_H / 2;
    expect(statusBottom - mapTop).toBeGreaterThanOrEqual(8);

    const mapBottom = RL.MAP_AREA_Y - RL.MAP_AREA_H / 2;
    const cmdTop = RL.MAP_CMD_Y + RL.MAP_CMD_SIZE / 2;
    expect(mapBottom - cmdTop).toBeGreaterThanOrEqual(8);
  });

  it('map cmd five squares fit and side stays on screen', () => {
    expect(MAP_CMD_CATEGORIES.length).toBe(5);
    const lastX = RL.MAP_CMD_START_X + 4 * RL.MAP_CMD_GAP;
    expect(lastX + RL.MAP_CMD_SIZE / 2).toBeLessThanOrEqual(RL.W / 2 - 4);
    expect(RL.MAP_SIDE_X + RL.MAP_SIDE_W / 2).toBeLessThanOrEqual(RL.W / 2);
    expect(RL.MAP_AREA_W).toBeGreaterThanOrEqual(640);
  });

  it('status grid fits inside status panel height', () => {
    const rows = Math.ceil(12 / RL.MAP_STAT_COLS);
    const used =
      rows * RL.MAP_STAT_CELL_H + (rows - 1) * RL.MAP_STAT_GAP_Y;
    expect(used).toBeLessThanOrEqual(RL.MAP_STATUS_H - 16);
  });

  it('command panel regions keep vertical gaps >= 8', () => {
    const infoBottom = RL.PANEL_INFO_Y - 12;
    const scrollTop = RL.PANEL_SCROLL_Y + RL.PANEL_SCROLL_H / 2;
    expect(infoBottom - scrollTop).toBeGreaterThanOrEqual(8);

    const scrollBottom = RL.PANEL_SCROLL_Y - RL.PANEL_SCROLL_H / 2;
    const actionTop = RL.PANEL_ACTION_Y + RL.PANEL_BTN_H / 2;
    expect(scrollBottom - actionTop).toBeGreaterThanOrEqual(8);

    const actionBottom = RL.PANEL_ACTION_Y - RL.PANEL_BTN_H / 2;
    const closeTop = RL.PANEL_CLOSE_Y + RL.PANEL_BTN_H / 2;
    expect(actionBottom - closeTop).toBeGreaterThanOrEqual(8);

    const milRow1Top = RL.PANEL_MIL_ROW1_Y + RL.PANEL_BTN_H / 2;
    expect(scrollBottom - milRow1Top).toBeGreaterThanOrEqual(8);
    const milRow1Bottom = RL.PANEL_MIL_ROW1_Y - RL.PANEL_BTN_H / 2;
    const milRow2Top = RL.PANEL_MIL_ROW2_Y + RL.PANEL_BTN_H / 2;
    expect(milRow1Bottom - milRow2Top).toBeGreaterThanOrEqual(8);
    const milRow2Bottom = RL.PANEL_MIL_ROW2_Y - RL.PANEL_BTN_H / 2;
    expect(milRow2Bottom - closeTop).toBeGreaterThanOrEqual(8);
  });

  it('settings scroll stays above back button', () => {
    const scrollBottom = RL.SETTINGS_SCROLL_Y - RL.SETTINGS_SCROLL_H / 2;
    const backTop = RL.PAGE_BACK_Y + 24;
    expect(scrollBottom - backTop).toBeGreaterThanOrEqual(8);
  });

  it('remakeMapCoord centers mid-scenario point near origin', () => {
    const mid = remakeMapCoord(380, 340);
    expect(Math.abs(mid.x)).toBeLessThan(50);
    expect(Math.abs(mid.y)).toBeLessThan(50);
  });

  it('RemakeNav shows one layer', () => {
    const nav = new RemakeNav();
    const a = { active: false } as any;
    const b = { active: false } as any;
    nav.register('a', a);
    nav.register('b', b);
    nav.show('a');
    expect(a.active).toBe(true);
    expect(b.active).toBe(false);
    nav.show('b');
    expect(a.active).toBe(false);
    expect(b.active).toBe(true);
  });
});
