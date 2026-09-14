import { Color, Label, Node } from 'cc';
import { createClassicButton } from '../shared/MenuChrome';
import { createMenuShell, makeRowLabel } from '../shared/MenuShell';
import {
  deleteSave,
  formatSaveSummary,
  formatSaveTime,
  listSaves,
  type SaveSlot,
} from '../shared/SaveStore';
import { safeClearChildren } from '../shared/ScreenAdapt';

export type ContinueCallbacks = {
  onLoad: (slot: SaveSlot) => void;
  onBack: () => void;
  onEmpty: () => void;
};

export async function buildContinueScreen(
  layer: Node,
  callbacks: ContinueCallbacks,
): Promise<void> {
  const shell = await createMenuShell(layer, '继续游戏', callbacks.onBack);
  await renderList(shell.body, callbacks);
}

async function renderList(body: Node, callbacks: ContinueCallbacks): Promise<void> {
  safeClearChildren(body);
  const slots = listSaves();
  if (slots.length === 0) {
    makeRowLabel(body, 'Empty', '暂无存档', 100, { fontSize: 32 });
    callbacks.onEmpty();
    return;
  }

  let y = 480;
  for (const slot of slots) {
    makeRowLabel(body, `Meta_${slot.id}`, formatSaveTime(slot.updatedAt), y + 36, {
      fontSize: 22,
      color: new Color(122, 112, 96, 220),
    });
    makeRowLabel(body, `Sum_${slot.id}`, formatSaveSummary(slot), y, {
      fontSize: 28,
      color: new Color(42, 36, 28, 255),
    });

    await createClassicButton(body, {
      name: `Load_${slot.id}`,
      label: '读取',
      style: 'tertiary',
      width: 220,
      height: 72,
      y: y - 80,
      onClick: () => callbacks.onLoad(slot),
    });
    body.getChildByName(`Load_${slot.id}`)?.setPosition(-160, y - 80, 0);

    await createClassicButton(body, {
      name: `Del_${slot.id}`,
      label: '删除',
      style: 'quaternary',
      width: 220,
      height: 72,
      y: y - 80,
      onClick: () => {
        const btn = body.getChildByName(`Del_${slot.id}`);
        const lab = btn?.getChildByName('Label')?.getComponent(Label);
        if (lab && lab.string !== '确认删除') {
          lab.string = '确认删除';
          return;
        }
        deleteSave(slot.id);
        void renderList(body, callbacks);
      },
    });
    body.getChildByName(`Del_${slot.id}`)?.setPosition(160, y - 80, 0);

    y -= 220;
    if (y < -400) break;
  }
}
