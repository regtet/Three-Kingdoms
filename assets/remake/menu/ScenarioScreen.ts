import { Color, Node } from 'cc';
import { SCENARIOS, type ScenarioDef } from '../shared/MenuCatalog';
import { createClassicButton, type ClassicButton } from '../shared/MenuChrome';
import { createMenuShell, makeRowLabel } from '../shared/MenuShell';
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
  const detail = makeRowLabel(shell.body, 'Detail', '', -40, {
    fontSize: 26,
    color: new Color(58, 52, 44, 255),
    width: 920,
  });
  detail.horizontalAlign = 1;

  const refreshDetail = () => {
    detail.string = `${selected.era}　${selected.year}年${selected.month}月\n${selected.blurb}`;
  };
  refreshDetail();

  const buttons: ClassicButton[] = [];
  let y = 460;
  for (const sc of SCENARIOS) {
    const btn = await createClassicButton(shell.body, {
      name: `Sc_${sc.id}`,
      label: sc.name,
      style: 'secondary',
      width: RL.btnSecondaryW,
      height: RL.btnSecondaryH,
      y,
      onClick: () => {
        selected = sc;
        refreshDetail();
        buttons.forEach((b, i) => b.setSelected(SCENARIOS[i].id === selected.id));
      },
    });
    buttons.push(btn);
    y -= 120;
  }
  buttons[0]?.setSelected(true);

  await createClassicButton(shell.body, {
    name: 'BtnConfirm',
    label: '确认',
    style: 'primary',
    width: RL.btnPrimaryW,
    height: RL.btnPrimaryH,
    y: -300,
    onClick: () => callbacks.onPick(selected),
  });
}
