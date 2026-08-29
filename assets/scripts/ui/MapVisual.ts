import { Color, Graphics, Node, Label, UITransform, Vec3 } from 'cc';
import type { GameState } from '../core/models/types';
import { findCity } from '../core/utils/helpers';
import { getRelation } from '../core/systems/diplomacy';
import { formatRelationLabel } from '../core/systems/diplomacyReport';
import { L, mapScenarioCoord } from './OfficialLayout';
import { hexToColor, toColor } from './UiDraw';

type CityLayout = { id: string; x: number; y: number; neighbors: readonly string[] };

/** 地图装饰：地形色块（程序化，无需贴图） */
export function drawTerrainDecor(g: Graphics) {
  g.clear();
  // 北方平原
  g.fillColor = toColor({ r: 28, g: 38, b: 32, a: 60 });
  g.ellipse(-80, 120, 200, 100);
  // 长江水域
  g.fillColor = toColor({ r: 25, g: 45, b: 70, a: 70 });
  g.ellipse(40, -20, 280, 55);
  // 西南山地
  g.fillColor = toColor({ r: 35, g: 30, b: 28, a: 55 });
  g.ellipse(-200, -80, 120, 90);
  // 东南
  g.fillColor = toColor({ r: 30, g: 42, b: 35, a: 50 });
  g.ellipse(180, -100, 140, 80);
}

/** 刷新邻接高亮线（选中城池时） */
export function refreshNeighborHighlights(
  layer: Node,
  state: GameState,
  selectedCityId: string | null,
  cities: readonly CityLayout[],
  playerFactionId: string,
) {
  layer.destroyAllChildren();
  if (!selectedCityId) return;
  const city = findCity(state, selectedCityId);
  const posA = mapScenarioCoord(
    cities.find((c) => c.id === city.id)!.x,
    cities.find((c) => c.id === city.id)!.y,
  );

  for (const nid of city.neighbors) {
    const neighbor = findCity(state, nid);
    const layout = cities.find((c) => c.id === nid);
    if (!layout) continue;
    const posB = mapScenarioCoord(layout.x, layout.y);
    const rel = getRelation(state, city.factionId, neighbor.factionId);
    const isAlly = neighbor.factionId === playerFactionId;
    const isEnemy = neighbor.factionId !== playerFactionId && rel === 'hostile';

    const ln = new Node(`HL_${nid}`);
    layer.addChild(ln);
    const g = ln.addComponent(Graphics);
    if (isAlly) {
      g.strokeColor = toColor({ r: 100, g: 180, b: 255, a: 200 });
      g.lineWidth = 4;
    } else if (isEnemy) {
      g.strokeColor = toColor({ r: 255, g: 100, b: 80, a: 200 });
      g.lineWidth = 4;
    } else {
      g.strokeColor = toColor({ r: 200, g: 200, b: 100, a: 160 });
      g.lineWidth = 3;
    }
    g.moveTo(posA.x, posA.y);
    g.lineTo(posB.x, posB.y);
    g.stroke();

    // 邻城关系小标签（中点）
    const mx = (posA.x + posB.x) / 2;
    const my = (posA.y + posB.y) / 2;
    const tag = new Node(`Tag_${nid}`);
    layer.addChild(tag);
    tag.setPosition(mx, my, 0);
    tag.addComponent(UITransform).setContentSize(40, 16);
    const lb = tag.addComponent(Label);
    lb.string = neighbor.factionId === city.factionId ? '己' : formatRelationLabel(rel).slice(0, 1);
    lb.fontSize = 10;
    lb.horizontalAlign = Label.HorizontalAlign.CENTER;
    lb.color = isEnemy ? new Color(255, 150, 120, 255) : new Color(180, 220, 255, 255);
  }
}

/** 势力图例节点 */
export function buildFactionLegend(parent: Node, state: GameState): Node {
  const legend = new Node('FactionLegend');
  parent.addChild(legend);
  legend.setPosition(-L.MAP_W / 2 + 60, -L.MAP_H / 2 + 30, 0);
  legend.addComponent(UITransform).setContentSize(120, 80);

  const active = state.factions.filter((f) => !f.isEliminated);
  active.forEach((f, i) => {
    const row = new Node(`Leg_${f.id}`);
    legend.addChild(row);
    row.setPosition(0, -i * 22, 0);
    const dot = new Node('Dot');
    row.addChild(dot);
    dot.setPosition(-40, 0, 0);
    dot.addComponent(UITransform).setContentSize(12, 12);
    const dg = dot.addComponent(Graphics);
    dg.fillColor = hexToColor(f.color);
    dg.roundRect(-6, -6, 12, 12, 2);
    dg.fill();
    const name = new Node('Name');
    row.addChild(name);
    name.setPosition(0, 0, 0);
    name.addComponent(UITransform).setContentSize(80, 18);
    const nl = name.addComponent(Label);
    const cnt = state.cities.filter((c) => c.factionId === f.id).length;
    nl.string = `${f.name}(${cnt})`;
    nl.fontSize = 12;
    nl.color = f.id === state.playerFactionId
      ? new Color(255, 220, 100, 255)
      : new Color(200, 200, 210, 255);
  });
  return legend;
}
