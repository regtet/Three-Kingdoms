import { Node } from 'cc';
import { createClassicButton } from '../shared/MenuChrome';
import { createMenuShell, makeRowLabel } from '../shared/MenuShell';
import { RL } from '../shared/RemakeLayout';
import type { RulerDef, ScenarioDef } from '../shared/MenuCatalog';
import type { SaveSlot } from '../shared/SaveStore';

/** 开局 / 读档后的占位：地图尚未接入 */
export async function buildPlayStubScreen(
  layer: Node,
  opts: {
    title: string;
    lines: string[];
    onBack: () => void;
  },
): Promise<void> {
  const shell = await createMenuShell(layer, opts.title, opts.onBack);
  let y = 320;
  for (const line of opts.lines) {
    makeRowLabel(shell.body, `L_${y}`, line, y, {
      fontSize: 28,
    });
    y -= 60;
  }
  makeRowLabel(shell.body, 'Hint', '战略地图将在下一阶段接入', -80, {
    fontSize: 24,
  });
  await createClassicButton(shell.body, {
    name: 'BtnOk',
    label: '返回标题',
    style: 'primary',
    width: RL.btnPrimaryW,
    height: RL.btnPrimaryH,
    y: -280,
    onClick: opts.onBack,
  });
}

export function linesForNewGame(sc: ScenarioDef, ruler: RulerDef): string[] {
  return [
    `剧本：${sc.name}（${sc.era}）`,
    `开局：${sc.year}年${sc.month}月`,
    `君主：${ruler.name}　势力：${ruler.factionName}`,
    '开局存档已写入',
  ];
}

export function linesForLoad(slot: SaveSlot): string[] {
  return [
    `存档：${slot.scenarioName}`,
    `君主：${slot.rulerName}`,
    `时间：${slot.year}年${slot.month}月`,
    '读档成功（地图待接入）',
  ];
}
