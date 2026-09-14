import { Color, Node, Sprite, UITransform } from 'cc';
import {
  getScenario,
  rulersForScenario,
  type RulerDef,
} from '../shared/MenuCatalog';
import {
  createClassicButton,
  loadSpriteFrame,
  type ClassicButton,
} from '../shared/MenuChrome';
import { createMenuShell, makeRowLabel } from '../shared/MenuShell';
import { applySpriteContain } from '../shared/ScreenAdapt';
import { RL } from '../shared/RemakeLayout';

export type RulerCallbacks = {
  scenarioId: string;
  onConfirm: (ruler: RulerDef) => void;
  onBack: () => void;
};

export async function buildRulerScreen(layer: Node, callbacks: RulerCallbacks): Promise<void> {
  const scenario = getScenario(callbacks.scenarioId);
  const rulers = rulersForScenario(callbacks.scenarioId);
  const shell = await createMenuShell(
    layer,
    scenario ? `选择君主 · ${scenario.name}` : '选择君主',
    callbacks.onBack,
  );

  if (rulers.length === 0) {
    makeRowLabel(shell.body, 'Empty', '该剧本暂无可选君主', 0, { fontSize: 30 });
    return;
  }

  let selected = rulers[0];
  const portrait = new Node('Portrait');
  shell.body.addChild(portrait);
  portrait.setPosition(-280, 280, 0);
  const portraitSp = portrait.addComponent(Sprite);
  const applyPortrait = async (path: string) => {
    const frame = await loadSpriteFrame(path);
    if (frame && portrait.isValid) {
      applySpriteContain(portrait, portraitSp, frame, 220, 280);
      portrait.setPosition(-280, 280, 0);
    } else if (portrait.isValid) {
      const ui = portrait.getComponent(UITransform) ?? portrait.addComponent(UITransform);
      ui.setContentSize(180, 220);
      portraitSp.sizeMode = Sprite.SizeMode.CUSTOM;
      portraitSp.color = new Color(60, 50, 40, 255);
    }
  };
  await applyPortrait(selected.portrait);

  const nameLabel = makeRowLabel(shell.body, 'RulerName', '', 420, {
    fontSize: 36,
    bold: true,
    x: 120,
    width: 520,
  });
  nameLabel.horizontalAlign = 0;
  const factionLabel = makeRowLabel(shell.body, 'Faction', '', 350, {
    fontSize: 28,
    x: 120,
    width: 520,
  });
  factionLabel.horizontalAlign = 0;
  const blurbLabel = makeRowLabel(shell.body, 'Blurb', '', 200, {
    fontSize: 24,
    x: 120,
    width: 520,
  });
  blurbLabel.horizontalAlign = 0;
  blurbLabel.overflow = 3; // RESIZE_HEIGHT-ish; use SHRINK=2 or CLAMP
  blurbLabel.overflow = 2;

  const refresh = async () => {
    nameLabel.string = selected.name;
    factionLabel.string = `势力：${selected.factionName}`;
    const fc = new Color();
    fc.fromHEX(selected.color);
    factionLabel.color = fc;
    blurbLabel.string = selected.blurb;
    await applyPortrait(selected.portrait);
  };
  await refresh();

  const buttons: ClassicButton[] = [];
  let y = -40;
  for (const r of rulers) {
    const btn = await createClassicButton(shell.body, {
      name: `Ruler_${r.id}`,
      label: r.name,
      style: 'tertiary',
      width: RL.btnTertiaryW,
      height: RL.btnTertiaryH,
      y,
      onClick: () => {
        selected = r;
        void refresh();
        buttons.forEach((b, i) => b.setSelected(rulers[i].id === selected.id));
      },
    });
    buttons.push(btn);
    y -= 100;
  }
  buttons[0]?.setSelected(true);

  await createClassicButton(shell.body, {
    name: 'BtnStart',
    label: '开始游戏',
    style: 'primary',
    width: RL.btnPrimaryW,
    height: RL.btnPrimaryH,
    y: -520,
    onClick: () => callbacks.onConfirm(selected),
  });
}
