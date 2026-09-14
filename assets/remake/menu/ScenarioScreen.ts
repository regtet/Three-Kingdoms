import { Node } from 'cc';
import { SCENARIOS, type ScenarioDef } from '../shared/MenuCatalog';
import { createClassicButton } from '../shared/MenuChrome';
import {
  createInkOption,
  createMenuShell,
  makeRowLabel,
  type InkOption,
} from '../shared/MenuShell';
import { RL } from '../shared/RemakeLayout';

export type ScenarioCallbacks = {
  onPick: (scenario: ScenarioDef) => void;
  onBack: () => void;
};

export async function buildScenarioScreen(
  layer: Node,
  callbacks: ScenarioCallbacks,
): Promise<void> {
  const shell = await createMenuShell(layer, '选择剧本', callbacks.onBack);

  let selected = SCENARIOS[0];
  const detail = makeRowLabel(shell.body, 'Detail', '', -80, {
    fontSize: 26,
    width: 860,
  });
  detail.horizontalAlign = 1;

  const refreshDetail = () => {
    detail.string = `${selected.era}　${selected.year}年${selected.month}月\n${selected.blurb}`;
  };
  refreshDetail();

  const options: InkOption[] = [];
  let y = 420;
  for (const sc of SCENARIOS) {
    const opt = await createInkOption(shell.body, {
      name: `Sc_${sc.id}`,
      label: sc.name,
      y,
      width: 640,
      height: 78,
      onClick: () => {
        selected = sc;
        refreshDetail();
        options.forEach((o, i) => o.setSelected(SCENARIOS[i].id === selected.id));
      },
    });
    options.push(opt);
    y -= 100;
  }
  options[0]?.setSelected(true);

  await createClassicButton(shell.body, {
    name: 'BtnConfirm',
    label: '确认',
    style: 'primary',
    width: RL.btnPrimaryW,
    height: RL.btnPrimaryH,
    y: -360,
    onClick: () => callbacks.onPick(selected),
  });
}
