import { Button, Component, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import { gameEngine } from '../../core/game/GameEngine';
import type { General } from '../../core/models/types';
import { getActableGeneralsInCity } from '../../core/systems/actionGuard';
import { getMaxRecruitAmount, getRecruitEfficiency } from '../../core/systems/recruit';
import { findCity } from '../../core/utils/helpers';
import { audioManager } from '../../ui/AudioManager';
import { drawPanel, toColor } from '../../ui/UiDraw';
import { RL, RC } from '../shared/RemakeLayout';
import { remakeColor, remakeLabel } from '../shared/RemakeWidgets';
import {
  createCmdSheet,
  fillScrollRows,
  remakeActionButton,
} from './CmdPanelShell';

export type MilitaryPanelCallbacks = {
  onClose: () => void;
  onToast: (msg: string) => void;
  onActionDone: () => void;
};

type Mode = 'main' | 'transport' | 'deploy';

/** 军事命令面板：征兵 / 出兵 / 运输 */
export function openMilitaryPanel(
  parent: Node,
  host: Component,
  cityId: string,
  cb: MilitaryPanelCallbacks,
): { destroy: () => void } {
  let mode: Mode = 'main';
  let selectedGeneralId: string | null = null;
  let selectedTargetId: string | null = null;
  let troopRatio = 0.5;
  let transportGold = 50;
  let transportFood = 50;
  let transportTroops = 100;

  const sheet = createCmdSheet(parent, host, () => {
    if (mode !== 'main') {
      mode = 'main';
      rebuild();
      return;
    }
    cb.onClose();
  });

  function requireGeneral(): string | null {
    if (!selectedGeneralId) {
      cb.onToast('请先选择武将');
      return null;
    }
    return selectedGeneralId;
  }

  function runAction(fn: () => { success: boolean; message: string }) {
    const r = fn();
    cb.onToast(r.message);
    if (r.success) {
      cb.onActionDone();
      mode = 'main';
      rebuild();
    }
  }

  function drawGenRow(parentNode: Node, g: General, y: number, active: boolean, onPick: () => void) {
    const row = new Node(`Gen_${g.id}`);
    parentNode.addChild(row);
    row.setPosition(0, y, 0);
    row.addComponent(UITransform).setContentSize(RL.PANEL_SCROLL_W - 8, RL.PANEL_ROW_H);
    drawPanel(
      row.addComponent(Graphics),
      RL.PANEL_SCROLL_W - 8,
      RL.PANEL_ROW_H,
      toColor(active ? RC.rowActive : RC.rowIdle),
      toColor(active ? RC.selectRing : RC.border),
      6,
    );
    const status = g.status === 'governor' ? '太守' : '一般';
    const text = `${g.name}　统${g.leadership} 武${g.force} 智${g.intelligence}　${status}`;
    const lb = remakeLabel(row, 'T', text, 15, new Vec3(0, 0, 0), RL.PANEL_SCROLL_W - 24);
    lb.horizontalAlign = Label.HorizontalAlign.LEFT;
    lb.color = remakeColor(active ? RC.textGold : RC.text);
    row.addComponent(Button);
    row.on(Button.EventType.CLICK, () => {
      audioManager.playClick();
      onPick();
    }, host);
  }

  function rebuildMain(state: NonNullable<typeof gameEngine.state>) {
    const city = findCity(state, cityId);
    const eff = Math.floor(getRecruitEfficiency(state, cityId) * 100);
    const maxR = getMaxRecruitAmount(state, cityId);
    sheet.titleLb.string = `军事 · ${city.name}`;
    sheet.infoLb.string = `兵${city.troops} 金${city.gold} 粮${city.food}　征兵效率${eff}%　可征上限${maxR}`;

    const gens = getActableGeneralsInCity(state, cityId)
      .slice()
      .sort((a, b) => b.leadership - a.leadership || b.force - a.force);

    if (selectedGeneralId && !gens.some((g) => g.id === selectedGeneralId)) {
      selectedGeneralId = null;
    }
    if (!selectedGeneralId && gens.length) selectedGeneralId = gens[0].id;

    if (gens.length === 0) {
      fillScrollRows(sheet.content, sheet.contentTf, sheet.scrollView, 1, (_i, y) => {
        const empty = remakeLabel(
          sheet.content,
          'Empty',
          '本城无可行动武将',
          16,
          new Vec3(0, y, 0),
          RL.PANEL_SCROLL_W - 20,
        );
        empty.horizontalAlign = Label.HorizontalAlign.CENTER;
        empty.color = remakeColor(RC.textDim);
      });
    } else {
      fillScrollRows(sheet.content, sheet.contentTf, sheet.scrollView, gens.length, (i, y) => {
        const g = gens[i];
        drawGenRow(sheet.content, g, y, g.id === selectedGeneralId, () => {
          selectedGeneralId = g.id;
          rebuild();
        });
      });
    }

    sheet.actionRoot.destroyAllChildren();
    const doRecruit = (amount: number) => {
      const gid = requireGeneral();
      if (!gid) return;
      const n = Math.min(amount, getMaxRecruitAmount(gameEngine.state!, cityId));
      if (n <= 0) {
        cb.onToast('无法征兵');
        return;
      }
      runAction(() => gameEngine.recruit(cityId, n, gid));
    };

    remakeActionButton(sheet.actionRoot, 'R50', '征兵50', -210, RL.PANEL_MIL_ROW1_Y, host, () => doRecruit(50), 100);
    remakeActionButton(sheet.actionRoot, 'R100', '征兵100', -70, RL.PANEL_MIL_ROW1_Y, host, () => doRecruit(100), 100);
    remakeActionButton(sheet.actionRoot, 'RMax', '最大', 70, RL.PANEL_MIL_ROW1_Y, host, () => {
      const gid = requireGeneral();
      if (!gid) return;
      const max = getMaxRecruitAmount(gameEngine.state!, cityId);
      if (max <= 0) {
        cb.onToast('无法征兵');
        return;
      }
      runAction(() => gameEngine.recruit(cityId, max, gid));
    }, 100);
    remakeActionButton(sheet.actionRoot, 'Attack', '出兵', -100, RL.PANEL_MIL_ROW2_Y, host, () => {
      if (!requireGeneral()) return;
      mode = 'deploy';
      selectedTargetId = null;
      rebuild();
    }, 140, RL.PANEL_BTN_H, true);
    remakeActionButton(sheet.actionRoot, 'Transport', '运输', 100, RL.PANEL_MIL_ROW2_Y, host, () => {
      if (!requireGeneral()) return;
      mode = 'transport';
      rebuild();
    }, 140);
  }

  function rebuildTransport(state: NonNullable<typeof gameEngine.state>) {
    const from = findCity(state, cityId);
    sheet.titleLb.string = `运输 · ${from.name}`;
    sheet.infoLb.string = `金${from.gold} 粮${from.food} 兵${from.troops}　点击循环数量，再选目标城`;

    const allies = from.neighbors
      .map((id) => findCity(state, id))
      .filter((c) => c.factionId === state.playerFactionId);

    if (allies.length === 0) {
      fillScrollRows(sheet.content, sheet.contentTf, sheet.scrollView, 1, (_i, y) => {
        const empty = remakeLabel(
          sheet.content,
          'Empty',
          '无相邻己方城池',
          16,
          new Vec3(0, y, 0),
          RL.PANEL_SCROLL_W - 20,
        );
        empty.horizontalAlign = Label.HorizontalAlign.CENTER;
        empty.color = remakeColor(RC.textDim);
      });
    } else {
      fillScrollRows(sheet.content, sheet.contentTf, sheet.scrollView, allies.length, (i, y) => {
        const to = allies[i];
        const row = new Node(`To_${to.id}`);
        sheet.content.addChild(row);
        row.setPosition(0, y, 0);
        row.addComponent(UITransform).setContentSize(RL.PANEL_SCROLL_W - 8, RL.PANEL_ROW_H);
        drawPanel(
          row.addComponent(Graphics),
          RL.PANEL_SCROLL_W - 8,
          RL.PANEL_ROW_H,
          toColor(RC.rowIdle),
          toColor(RC.border),
          6,
        );
        const lb = remakeLabel(
          row,
          'T',
          `→ ${to.name}　运金${transportGold} 粮${transportFood} 兵${transportTroops}`,
          15,
          new Vec3(0, 0, 0),
          RL.PANEL_SCROLL_W - 24,
        );
        lb.horizontalAlign = Label.HorizontalAlign.LEFT;
        row.addComponent(Button);
        row.on(Button.EventType.CLICK, () => {
          audioManager.playClick();
          const gid = requireGeneral();
          if (!gid) return;
          runAction(() => gameEngine.transport({
            fromCityId: cityId,
            toCityId: to.id,
            generalId: gid,
            gold: transportGold,
            food: transportFood,
            troops: transportTroops,
          }));
        }, host);
      });
    }

    sheet.actionRoot.destroyAllChildren();
    const cycle = (cur: number, opts: number[]) => {
      const idx = opts.indexOf(cur);
      return opts[(idx + 1) % opts.length];
    };
    remakeActionButton(sheet.actionRoot, 'Gold', `金:${transportGold}`, -200, RL.PANEL_MIL_ROW1_Y, host, () => {
      transportGold = cycle(transportGold, [50, 100, 200]);
      rebuild();
    }, 100);
    remakeActionButton(sheet.actionRoot, 'Food', `粮:${transportFood}`, -40, RL.PANEL_MIL_ROW1_Y, host, () => {
      transportFood = cycle(transportFood, [50, 100, 200]);
      rebuild();
    }, 100);
    remakeActionButton(sheet.actionRoot, 'Troops', `兵:${transportTroops}`, 120, RL.PANEL_MIL_ROW1_Y, host, () => {
      transportTroops = cycle(transportTroops, [100, 200, 500]);
      rebuild();
    }, 100);
    remakeActionButton(sheet.actionRoot, 'BackMain', '回军事', 0, RL.PANEL_MIL_ROW2_Y, host, () => {
      mode = 'main';
      rebuild();
    }, 160);
  }

  function rebuildDeploy(state: NonNullable<typeof gameEngine.state>) {
    const from = findCity(state, cityId);
    const enemies = from.neighbors
      .map((id) => findCity(state, id))
      .filter((c) => c.factionId !== state.playerFactionId);

    if (selectedTargetId && !enemies.some((c) => c.id === selectedTargetId)) {
      selectedTargetId = null;
    }
    if (!selectedTargetId && enemies.length) selectedTargetId = enemies[0].id;

    const troops = Math.max(1, Math.floor(from.troops * troopRatio));
    const gen = selectedGeneralId
      ? state.generals.find((g) => g.id === selectedGeneralId)
      : null;
    sheet.titleLb.string = `出兵 · ${from.name}`;
    let info = `武将 ${gen?.name ?? '—'}　兵力 ${troops}/${from.troops}（${Math.round(troopRatio * 100)}%）`;
    if (selectedTargetId && gen) {
      const est = gameEngine.estimateBattle({
        attackerGeneralId: gen.id,
        attackerTroops: troops,
        fromCityId: cityId,
        targetCityId: selectedTargetId,
      });
      if (est) info += `　战力 ${est.atkPower} vs ${est.defPower}（${est.label}）`;
    }
    sheet.infoLb.string = info;

    if (enemies.length === 0) {
      fillScrollRows(sheet.content, sheet.contentTf, sheet.scrollView, 1, (_i, y) => {
        const empty = remakeLabel(
          sheet.content,
          'Empty',
          '无相邻敌城可攻',
          16,
          new Vec3(0, y, 0),
          RL.PANEL_SCROLL_W - 20,
        );
        empty.horizontalAlign = Label.HorizontalAlign.CENTER;
        empty.color = remakeColor(RC.textDim);
      });
    } else {
      fillScrollRows(sheet.content, sheet.contentTf, sheet.scrollView, enemies.length, (i, y) => {
        const to = enemies[i];
        const fac = state.factions.find((f) => f.id === to.factionId);
        const active = to.id === selectedTargetId;
        const row = new Node(`Enemy_${to.id}`);
        sheet.content.addChild(row);
        row.setPosition(0, y, 0);
        row.addComponent(UITransform).setContentSize(RL.PANEL_SCROLL_W - 8, RL.PANEL_ROW_H);
        drawPanel(
          row.addComponent(Graphics),
          RL.PANEL_SCROLL_W - 8,
          RL.PANEL_ROW_H,
          toColor(active ? RC.rowActive : RC.rowIdle),
          toColor(active ? RC.selectRing : RC.border),
          6,
        );
        const lb = remakeLabel(
          row,
          'T',
          `${to.name}　${fac?.name ?? ''}　兵${to.troops}`,
          15,
          new Vec3(0, 0, 0),
          RL.PANEL_SCROLL_W - 24,
        );
        lb.horizontalAlign = Label.HorizontalAlign.LEFT;
        lb.color = remakeColor(active ? RC.textGold : RC.text);
        row.addComponent(Button);
        row.on(Button.EventType.CLICK, () => {
          audioManager.playClick();
          selectedTargetId = to.id;
          rebuild();
        }, host);
      });
    }

    sheet.actionRoot.destroyAllChildren();
    ([0.25, 0.5, 0.75, 1] as const).forEach((r, i) => {
      const x = -210 + i * 140;
      remakeActionButton(
        sheet.actionRoot,
        `Ratio_${r}`,
        `${Math.round(r * 100)}%`,
        x,
        RL.PANEL_MIL_ROW1_Y,
        host,
        () => {
          troopRatio = r;
          rebuild();
        },
        100,
        RL.PANEL_BTN_H,
        troopRatio === r,
      );
    });
    remakeActionButton(sheet.actionRoot, 'ConfirmAtk', '进攻', -100, RL.PANEL_MIL_ROW2_Y, host, () => {
      const gid = requireGeneral();
      if (!gid) return;
      if (!selectedTargetId) {
        cb.onToast('请选择目标城池');
        return;
      }
      const atkTroops = Math.max(1, Math.floor(findCity(gameEngine.state!, cityId).troops * troopRatio));
      const result = gameEngine.attack({
        attackerGeneralId: gid,
        attackerTroops: atkTroops,
        fromCityId: cityId,
        targetCityId: selectedTargetId,
      });
      const msg = result.log[result.log.length - 1]
        ?? (result.attackerWins ? '进攻胜利' : '进攻结束');
      cb.onToast(msg);
      cb.onActionDone();
      mode = 'main';
      rebuild();
    }, 140, RL.PANEL_BTN_H, true);
    remakeActionButton(sheet.actionRoot, 'BackMain2', '回军事', 100, RL.PANEL_MIL_ROW2_Y, host, () => {
      mode = 'main';
      rebuild();
    }, 140);
  }

  function rebuild() {
    const state = gameEngine.state;
    if (!state) {
      cb.onClose();
      return;
    }
    if (mode === 'transport') rebuildTransport(state);
    else if (mode === 'deploy') rebuildDeploy(state);
    else rebuildMain(state);
  }

  rebuild();
  return { destroy: sheet.destroy };
}
