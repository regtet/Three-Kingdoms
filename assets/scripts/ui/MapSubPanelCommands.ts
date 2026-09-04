import { Label, Node, Vec3 } from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import type { City, General } from '../core/models/types';
import { findCity, getCityGenerals } from '../core/utils/helpers';
import { getActableGeneralsInCity } from '../core/systems/actionGuard';
import { getMaxRecruitAmount, getRecruitEfficiency } from '../core/systems/recruit';
import { getStratagemGenerals } from '../core/systems/stratagem';
import { audioManager } from './AudioManager';
import { categoryUsesGeneralPicker, CMD_CATEGORIES, L, type CmdCategory } from './OfficialLayout';
import { buildGeneralListRow } from './OfficialPanels';

export type { CmdCategory };
export type GenPickerSortKey = 'force' | 'intelligence' | 'loyalty';
export { categoryUsesGeneralPicker };

/** GameRoot 子面板宿主（运行时为同一实例，字段可仍为 private） */
export interface MapSubPanelHost {
  subGeneralId: string | null;
  genPickerPage: number;
  genPickerSort: GenPickerSortKey;
  customRecruitAmount: number;
  customTransportGold: number;
  customTransportFood: number;
  customTransportTroops: number;
  stratagemEnemyPage: number;
  selectedCityId: string | null;
  activeCategory: CmdCategory | null;
  subBtnContainer: Node;
  subInfo: Label;
  btn(
    parent: Node,
    name: string,
    text: string,
    pos: Vec3,
    cb: () => void,
    w?: number,
    h?: number,
    highlight?: boolean,
    danger?: boolean,
    catColor?: { r: number; g: number; b: number; a: number },
  ): Node;
  act(fn: () => { success: boolean; message: string }): void;
  actStratagem(fn: () => { success: boolean; message: string }): void;
  toast(msg: string): void;
  openDeploy(): void;
  closeSubPanel(): void;
  refreshSubFooter(onConfirm?: () => void): void;
  showGeneralInfo(id: string): void;
  setBtnLabel(node: Node, text: string): void;
}

export function buildGeneralPicker(host: MapSubPanelHost, gens: General[], onPick: (id: string) => void) {
  const state = gameEngine.state!;
  const usable = gens.filter((g) => g.status !== 'marching' && g.status !== 'injured' && !g.actionUsed);
  if (!host.subGeneralId && usable.length) host.subGeneralId = usable[0].id;

  host.subInfo.node.active = false;

  const sortY = L.SUB_SORT_Y;
  const listTopY = L.SUB_LIST_TOP_Y;
  const rowGap = L.GEN_LIST_ROW_H + 8;

  const sortFn = (a: General, b: General) => {
    if (host.genPickerSort === 'intelligence') return b.intelligence - a.intelligence;
    if (host.genPickerSort === 'loyalty') return b.loyalty - a.loyalty;
    return b.force - a.force;
  };
  const sorted = [...usable].sort(sortFn);
  const pageSize = 2;
  const page = Math.min(host.genPickerPage, Math.max(0, Math.ceil(sorted.length / pageSize) - 1));
  host.genPickerPage = page;

  ([['武力', 'force'], ['智力', 'intelligence'], ['忠诚', 'loyalty']] as const).forEach(([label, key], i) => {
    const x = (i - 1) * 108;
    host.btn(host.subBtnContainer, `Sort_${key}`, label, new Vec3(x, sortY, 0), () => {
      host.genPickerSort = key;
      onPick('');
    }, 88, 30, host.genPickerSort === key);
  });

  if (page > 0) {
    host.btn(host.subBtnContainer, 'PrevPage', '◀', new Vec3(-280, sortY, 0), () => {
      host.genPickerPage = Math.max(0, page - 1);
      onPick('');
    }, 40, 30);
  }
  if ((page + 1) * pageSize < sorted.length) {
    host.btn(host.subBtnContainer, 'NextPage', '▶', new Vec3(280, sortY, 0), () => {
      host.genPickerPage = page + 1;
      onPick('');
    }, 40, 30);
  }

  sorted.slice(page * pageSize, page * pageSize + pageSize).forEach((g, i) => {
    const faction = state.factions.find((f) => f.id === g.factionId);
    buildGeneralListRow(
      host.subBtnContainer,
      g,
      faction?.color ?? '#888888',
      g.id === host.subGeneralId,
      listTopY - i * rowGap,
      () => {
        host.subGeneralId = g.id;
        onPick(g.id);
      },
      () => {
        audioManager.playClick();
        host.showGeneralInfo(g.id);
      },
    );
  });

  host.refreshSubFooter(() => {
    if (host.subGeneralId) onPick(host.subGeneralId);
  });
  return usable;
}

export function buildCategoryButtons(host: MapSubPanelHost, cat: CmdCategory, city: City) {
  const row = (buttons: [string, () => void][], startY = 0) => {
    buttons.forEach(([text, cb], i) => {
      const x = (i - (buttons.length - 1) / 2) * 140;
      host.btn(host.subBtnContainer, `SubBtn_${text}`, text, new Vec3(x, startY, 0), cb, 120, 44);
    });
  };

  switch (cat) {
    case '内政': {
      const state = gameEngine.state!;
      const gens = getActableGeneralsInCity(state, city.id);
      if (gens.length === 0) {
        host.subInfo.string += '\n（无可用武将）';
        return;
      }
      const rebuild = () => buildCategoryButtons(host, '内政', city);
      buildGeneralPicker(host, gens, () => rebuild());
      const gid = () => host.subGeneralId ?? gens[0].id;
      row([
        ['开发', () => host.act(() => gameEngine.develop(city.id, gid()))],
        ['开垦', () => host.act(() => gameEngine.farm(city.id, gid()))],
        ['治理', () => host.act(() => gameEngine.govern(city.id, gid()))],
      ]);
      break;
    }
    case '军事': {
      const state = gameEngine.state!;
      const gens = getActableGeneralsInCity(state, city.id);
      const eff = Math.floor(getRecruitEfficiency(state, city.id) * 100);
      host.subInfo.string = `${gameEngine.getCityStateBrief(city.id)}  ·  征兵${eff}%`;
      if (gens.length === 0) {
        host.subInfo.string += '\n（无可用武将）';
        return;
      }
      const rebuild = () => buildCategoryButtons(host, '军事', city);
      buildGeneralPicker(host, gens, () => rebuild());
      const gid = () => host.subGeneralId ?? gens[0].id;
      row([
        ['征兵50', () => doRecruit(host, 50, gid())],
        ['征兵100', () => doRecruit(host, 100, gid())],
        ['自定义', () => cycleCustomRecruit(host, gid())],
        ['最大', () => doRecruitMax(host, gid())],
      ], 50);
      row([
        ['出兵', () => host.openDeploy()],
        ['运输', () => openTransportMenu(host, gid())],
      ], -10);
      break;
    }
    case '人才': {
      const state = gameEngine.state!;
      const gens = getActableGeneralsInCity(state, city.id);
      const allGens = getCityGenerals(state, city.id);
      const wilds = gameEngine.getWildAtCity(city.id);
      if (allGens.length === 0 && wilds.length === 0) {
        host.subInfo.string += '\n（本城无武将）';
        row([['搜索人才', () => host.act(() => gameEngine.searchTalent(city.id))]], 0);
        return;
      }
      if (gens.length === 0 && wilds.length === 0) {
        host.subInfo.string += '\n（本城武将均已行动）';
        return;
      }
      if (gens.length === 0) {
        row([['搜索人才', () => host.act(() => gameEngine.searchTalent(city.id))]], 30);
        wilds.forEach((w, i) => {
          const x = (i - (wilds.length - 1) / 2) * 160;
          host.btn(host.subBtnContainer, `Wild_${w.id}`, `登用${w.name}(${w.recruitGold}金)`, new Vec3(x, -20, 0), () => {
            host.act(() => gameEngine.recruitWild(city.id, w.id));
          }, 160, 40);
        });
        break;
      }
      const rebuild = () => buildCategoryButtons(host, '人才', city);
      buildGeneralPicker(host, gens, () => rebuild());
      const gid = () => host.subGeneralId ?? gens[0].id;
      row([
        ['赏赐', () => host.act(() => gameEngine.rewardGeneral(gid(), city.id))],
        ['任命太守', () => host.act(() => gameEngine.appointGovernor(city.id, gid()))],
        ['搜索', () => host.act(() => gameEngine.searchTalent(city.id))],
      ], L.SUB_ACTION_Y);
      const extras: [string, () => void][] = [];
      wilds.forEach((w) => {
        extras.push([`登用${w.name}`, () => host.act(() => gameEngine.recruitWild(city.id, w.id))]);
      });
      city.neighbors
        .map((id) => findCity(state, id))
        .filter((c) => c.factionId === state.playerFactionId)
        .forEach((to) => {
          extras.push([`移至${to.name}`, () => host.act(() => gameEngine.moveGeneral(gid(), to.id))]);
        });
      extras.forEach(([text, cb], i) => {
        const x = (i - (extras.length - 1) / 2) * 132;
        host.btn(host.subBtnContainer, `Extra_${i}_${text}`, text, new Vec3(x, L.SUB_EXTRA_Y, 0), cb, 120, 34);
      });
      break;
    }
    case '计谋': {
      const state = gameEngine.state!;
      const gens = getStratagemGenerals(state, city.id, 50);
      const enemies = city.neighbors.map((id) => findCity(state, id)).filter((c) => c.factionId !== city.factionId);
      if (gens.length === 0 || enemies.length === 0) {
        host.subInfo.string += '\n（无可用武将或相邻敌城）';
        return;
      }
      const rebuild = () => buildCategoryButtons(host, '计谋', city);
      buildGeneralPicker(host, gens, () => rebuild());
      const gid = () => host.subGeneralId ?? gens[0].id;
      if (host.stratagemEnemyPage >= enemies.length) host.stratagemEnemyPage = 0;
      const e = enemies[host.stratagemEnemyPage];
      const targetLabel = enemies.length > 1 ? `敌城:${e.name}▸` : `敌城:${e.name}`;
      row([
        ['鼓舞', () => host.actStratagem(() => gameEngine.inspire(city.id, gid()))],
        [targetLabel, () => {
          if (enemies.length <= 1) return;
          host.stratagemEnemyPage = (host.stratagemEnemyPage + 1) % enemies.length;
          rebuild();
        }],
        ['伪书', () => host.actStratagem(() => gameEngine.undermineLoyalty(city.id, gid(), e.id))],
        ['寝谋', () => host.actStratagem(() => gameEngine.sleeperStratagem(city.id, gid(), e.id))],
      ], L.SUB_ACTION_Y);
      const y = L.SUB_EXTRA_Y;
      const mk = (text: string, cb: () => void, bi: number) => {
        const x = (bi - 1.5) * 128;
        host.btn(host.subBtnContainer, `${text}_${e.id}`, `${text}·${e.name}`, new Vec3(x, y, 0), cb, 118, 30);
      };
      mk('火计', () => host.actStratagem(() => gameEngine.fireAttack(city.id, gid(), e.id)), 0);
      mk('离间', () => host.actStratagem(() => gameEngine.sowDiscord(city.id, gid(), e.id)), 1);
      mk('扰乱', () => host.actStratagem(() => gameEngine.disrupt(city.id, gid(), e.id)), 2);
      mk('伪报', () => host.actStratagem(() => gameEngine.fakeReport(city.id, gid(), e.id)), 3);
      break;
    }
    case '外交': {
      const state = gameEngine.state!;
      const gens = getActableGeneralsInCity(state, city.id);
      const others = state.factions.filter(
        (f) => f.id !== city.factionId && !f.isEliminated,
      );
      if (others.length === 0) {
        host.subInfo.string += '\n（无其他势力）';
        return;
      }
      const rebuild = () => buildCategoryButtons(host, '外交', city);
      if (gens.length > 0) {
        buildGeneralPicker(host, gens, () => rebuild());
      } else {
        host.subInfo.string += '\n（无可用武将，仅可宣战）';
      }
      const gid = () => host.subGeneralId ?? gens[0]?.id ?? '';
      others.forEach((f, i) => {
        const y = L.SUB_ACTION_Y - i * L.SUB_DIP_ROW_GAP;
        if (gens.length > 0) {
          host.btn(host.subBtnContainer, `Dip_a_${f.id}`, `同盟${f.name}`, new Vec3(-200, y, 0), () => {
            host.act(() => gameEngine.alliance(f.id, city.id, gid()));
          }, 110, 36);
          host.btn(host.subBtnContainer, `Dip_t_${f.id}`, `停战${f.name}`, new Vec3(-40, y, 0), () => {
            host.act(() => gameEngine.truce(f.id, city.id, gid()));
          }, 110, 36);
          host.btn(host.subBtnContainer, `Dip_g_${f.id}`, `赠礼${f.name}`, new Vec3(260, y, 0), () => {
            host.act(() => gameEngine.gift(f.id, city.id, gid()));
          }, 110, 36);
        }
        host.btn(host.subBtnContainer, `Dip_w_${f.id}`, `宣战${f.name}`, new Vec3(120, y, 0), () => {
          host.act(() => gameEngine.declareWar(f.id));
        }, 110, 36);
      });
      break;
    }
  }
}

export function cycleCustomRecruit(host: MapSubPanelHost, generalId: string) {
  const amounts = [50, 100, 200, 500];
  const idx = amounts.indexOf(host.customRecruitAmount);
  host.customRecruitAmount = amounts[(idx + 1) % amounts.length];
  host.toast(`征兵 ${host.customRecruitAmount}`);
  doRecruit(host, host.customRecruitAmount, generalId);
}

export function doRecruit(host: MapSubPanelHost, amount: number, generalId: string) {
  if (!host.selectedCityId) return;
  const max = getMaxRecruitAmount(gameEngine.state!, host.selectedCityId);
  const n = Math.min(amount, max);
  if (n <= 0) { host.toast('无法征兵'); return; }
  host.act(() => gameEngine.recruit(host.selectedCityId!, n, generalId));
}

export function doRecruitMax(host: MapSubPanelHost, generalId: string) {
  if (!host.selectedCityId) return;
  const max = getMaxRecruitAmount(gameEngine.state!, host.selectedCityId);
  if (max <= 0) { host.toast('无法征兵'); return; }
  host.act(() => gameEngine.recruit(host.selectedCityId!, max, generalId));
}

export function openTransportMenu(host: MapSubPanelHost, generalId: string) {
  if (!host.selectedCityId) return;
  const state = gameEngine.state!;
  const from = findCity(state, host.selectedCityId);
  const allies = from.neighbors
    .map((id) => findCity(state, id))
    .filter((c) => c.factionId === state.playerFactionId);
  if (!allies.length) { host.toast('无相邻己方城池'); return; }
  host.subBtnContainer.destroyAllChildren();

  const refreshLabels = () => {
    host.setBtnLabel(host.subBtnContainer.getChildByName('CycleGold')!, `金:${host.customTransportGold}`);
    host.setBtnLabel(host.subBtnContainer.getChildByName('CycleFood')!, `粮:${host.customTransportFood}`);
    host.setBtnLabel(host.subBtnContainer.getChildByName('CycleTroops')!, `兵:${host.customTransportTroops}`);
  };

  host.btn(host.subBtnContainer, 'CycleGold', `金:${host.customTransportGold}`, new Vec3(-200, L.SUB_TRANSPORT_CYCLE_Y, 0), () => {
    host.customTransportGold = host.customTransportGold === 50 ? 100 : host.customTransportGold === 100 ? 200 : 50;
    refreshLabels();
  }, 100, 32);
  host.btn(host.subBtnContainer, 'CycleFood', `粮:${host.customTransportFood}`, new Vec3(-60, L.SUB_TRANSPORT_CYCLE_Y, 0), () => {
    host.customTransportFood = host.customTransportFood === 50 ? 100 : host.customTransportFood === 100 ? 200 : 50;
    refreshLabels();
  }, 100, 32);
  host.btn(host.subBtnContainer, 'CycleTroops', `兵:${host.customTransportTroops}`, new Vec3(80, L.SUB_TRANSPORT_CYCLE_Y, 0), () => {
    host.customTransportTroops = host.customTransportTroops === 100 ? 200 : host.customTransportTroops === 200 ? 500 : 100;
    refreshLabels();
  }, 100, 32);
  allies.forEach((to, i) => {
    const y = L.SUB_TRANSPORT_LIST_Y - i * L.SUB_TRANSPORT_ROW_GAP;
    host.btn(host.subBtnContainer, `T_${to.id}`, `→${to.name} 运输`, new Vec3(0, y, 0), () => {
      host.act(() => gameEngine.transport({
        fromCityId: from.id,
        toCityId: to.id,
        generalId,
        gold: host.customTransportGold,
        food: host.customTransportFood,
        troops: host.customTransportTroops,
      }));
    }, 200, 40);
  });
  host.refreshSubFooter();
}
