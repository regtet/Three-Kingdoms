import { Color, Label, Node, UITransform, Vec3 } from 'cc';
import { gameEngine } from '../core/game/GameEngine';
import type { City, General } from '../core/models/types';
import { findCity, getCityGenerals } from '../core/utils/helpers';
import { COL, L } from './OfficialLayout';
import { createPortraitDisplay } from './GeneralPortrait';
import { MODAL_DEPLOY, UIManager } from './UIManager';

/** GameRoot 出兵弹窗宿主 */
export interface DeployPanelHost {
  selectedCityId: string | null;
  deployFromCityId: string | null;
  deployGeneralId: string | null;
  deploySecondaryId: string | null;
  deployTroopRatio: number;
  deployUseAmbush: boolean;
  deployTryDuel: boolean;
  deployPanel: Node;
  deployPortraitSlot: Node;
  uiManager: UIManager;
  btn(
    parent: Node,
    name: string,
    text: string,
    pos: Vec3,
    cb: () => void,
    w?: number,
    h?: number,
    highlight?: boolean,
  ): Node;
  label(
    parent: Node,
    name: string,
    text: string,
    fontSize: number,
    pos: Vec3,
    width?: number,
  ): Label;
  getLabel(parent: Node, name: string): Label | null;
  genStatus(g: General): string;
  toast(msg: string): void;
  closeSubPanel(): void;
  launchAttack(targetId: string): void;
  c(col: { r: number; g: number; b: number; a: number }): Color;
}

function factionName(state: NonNullable<typeof gameEngine.state>, fid: string): string {
  return state.factions.find((f) => f.id === fid)?.name ?? fid;
}

export function clearDeployExtras(host: DeployPanelHost): void {
  host.deployPanel.children.filter((c) =>
    c.name.startsWith('Target_') || c.name.startsWith('Gen_') ||
    c.name.startsWith('Ratio_') || c.name.startsWith('Ambush_') ||
    c.name.startsWith('Duel_') || c.name.startsWith('Sec_') ||
    c.name === 'NoTarget',
  ).forEach((c) => c.destroy());
}

export function clearDeployTargets(host: DeployPanelHost): void {
  host.deployPanel.children.filter((c) => c.name.startsWith('Target_')).forEach((c) => c.destroy());
}

export function refreshDeployPortrait(host: DeployPanelHost, gen: General | undefined): void {
  host.deployPortraitSlot.destroyAllChildren();
  if (!gen) return;
  const state = gameEngine.state!;
  const faction = state.factions.find((f) => f.id === gen.factionId);
  const node = createPortraitDisplay(
    host.deployPortraitSlot,
    gen,
    '',
    faction?.color ?? '#888888',
    'embed',
    96,
    120,
  );
  node.setPosition(0, 0, 0);
  const tag = host.genStatus(gen);
  if (tag) {
    const lb = host.label(host.deployPortraitSlot, 'Status', `[${tag}]`, 14, new Vec3(0, L.DEPLOY_STATUS_Y, 0), 80);
    lb.color = host.c(COL.textDim);
  }
}

export function refreshDeployPanel(host: DeployPanelHost, from: City, gens: General[]): void {
  clearDeployExtras(host);
  const state = gameEngine.state!;
  const info = host.getLabel(host.deployPanel, 'DeployInfo');
  const gen = gens.find((g) => g.id === host.deployGeneralId) ?? gens[0];
  host.deployGeneralId = gen?.id ?? null;
  refreshDeployPortrait(host, gen);
  const troops = Math.max(Math.floor(from.troops * host.deployTroopRatio), 500);

  if (info && gen) {
    const est = gameEngine.estimateBattle({
      attackerGeneralId: gen.id,
      attackerTroops: troops,
      fromCityId: from.id,
      targetCityId: from.neighbors.find((nid) => {
        const c = findCity(state, nid);
        return c.factionId !== state.playerFactionId;
      }) ?? from.neighbors[0],
      secondaryGeneralId: host.deploySecondaryId ?? undefined,
    });
    const estText = est ? `\n战力 ${est.atkPower} vs ${est.defPower}（${est.label}）` : '';
    info.string = `从 ${from.name} 出兵\n武将 ${gen.name}  兵力 ${troops}/${from.troops}${estText}`;
  }

  const cx = L.DEPLOY_CTRL_X;
  gens.forEach((g, i) => {
    const x = cx + (i - (gens.length - 1) / 2) * 118;
    host.btn(host.deployPanel, `Gen_${g.id}`, g.name, new Vec3(x, L.DEPLOY_GEN_Y, 0), () => {
      host.deployGeneralId = g.id;
      if (host.deploySecondaryId === g.id) host.deploySecondaryId = null;
      refreshDeployPanel(host, from, gens);
    }, 104, 36, g.id === host.deployGeneralId);
  });

  const secCandidates = gens.filter((g) => g.id !== host.deployGeneralId);
  if (secCandidates.length) {
    host.btn(host.deployPanel, 'Sec_none', '副将:无', new Vec3(cx - 120, L.DEPLOY_SEC_Y, 0), () => {
      host.deploySecondaryId = null;
      refreshDeployPanel(host, from, gens);
    }, 96, 30, !host.deploySecondaryId);
    secCandidates.forEach((g, i) => {
      const x = cx - 20 + i * 108;
      host.btn(host.deployPanel, `Sec_${g.id}`, g.name, new Vec3(x, L.DEPLOY_SEC_Y, 0), () => {
        host.deploySecondaryId = g.id;
        refreshDeployPanel(host, from, gens);
      }, 96, 30, g.id === host.deploySecondaryId);
    });
  }

  ([[0.5, '半数'], [0.7, '七成'], [1.0, '全军']] as const).forEach(([ratio, label], i) => {
    const x = cx + (i - 1) * 128;
    host.btn(host.deployPanel, `Ratio_${ratio}`, label, new Vec3(x, L.DEPLOY_RATIO_Y, 0), () => {
      host.deployTroopRatio = ratio;
      refreshDeployPanel(host, from, gens);
    }, 96, 34, host.deployTroopRatio === ratio);
  });

  host.btn(host.deployPanel, 'Ambush_toggle', host.deployUseAmbush ? '伏兵:开' : '伏兵:关', new Vec3(cx - 70, L.DEPLOY_OPT_Y, 0), () => {
    host.deployUseAmbush = !host.deployUseAmbush;
    refreshDeployPanel(host, from, gens);
  }, 112, 34, host.deployUseAmbush);

  host.btn(host.deployPanel, 'Duel_toggle', host.deployTryDuel ? '一骑讨:开' : '一骑讨:关', new Vec3(cx + 90, L.DEPLOY_OPT_Y, 0), () => {
    host.deployTryDuel = !host.deployTryDuel;
    refreshDeployPanel(host, from, gens);
  }, 112, 34, host.deployTryDuel);

  clearDeployTargets(host);
  const enemies = from.neighbors.map((id) => findCity(state, id)).filter((c) => c.factionId !== state.playerFactionId);
  enemies.forEach((t, i) => {
    const y = L.DEPLOY_TARGET_Y - i * L.DEPLOY_TARGET_GAP;
    host.btn(
      host.deployPanel,
      `Target_${t.id}`,
      `进攻 ${t.name}（${factionName(state, t.factionId)} · ${t.troops}兵）`,
      new Vec3(0, y, 0),
      () => host.launchAttack(t.id),
      420,
      40,
    );
  });
  if (!enemies.length) {
    const hint = new Node('NoTarget');
    host.deployPanel.addChild(hint);
    hint.setPosition(0, L.DEPLOY_TARGET_Y, 0);
    hint.addComponent(UITransform).setContentSize(400, 36);
    const lb = hint.addComponent(Label);
    lb.string = '无相邻敌城';
    lb.fontSize = 16;
    lb.color = host.c(COL.textDim);
    lb.horizontalAlign = Label.HorizontalAlign.CENTER;
  }
}

export function openDeployPanel(host: DeployPanelHost): void {
  if (!host.selectedCityId) return;
  const state = gameEngine.state!;
  const from = findCity(state, host.selectedCityId);
  host.deployFromCityId = host.selectedCityId;
  host.deployTroopRatio = 0.7;
  host.deployUseAmbush = false;
  host.deployTryDuel = false;
  host.deploySecondaryId = null;
  host.closeSubPanel();

  const gens = getCityGenerals(state, from.id).filter(
    (g) => g.status !== 'marching' && g.status !== 'injured' && !g.actionUsed,
  );
  host.deployGeneralId = gens[0]?.id ?? null;

  clearDeployExtras(host);
  refreshDeployPanel(host, from, gens);
  if (!gens.length) { host.toast('无可用武将'); return; }
  host.uiManager.openModal(MODAL_DEPLOY, host.deployPanel, () => clearDeployExtras(host));
}
