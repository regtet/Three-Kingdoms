import { Color, Node, Sprite, UITransform } from 'cc';
import { GALLERY_OFFICERS, type GalleryOfficer } from '../shared/MenuCatalog';
import {
  createClassicButton,
  loadSpriteFrame,
} from '../shared/MenuChrome';
import {
  createInkOption,
  createMenuShell,
  makeRowLabel,
  type InkOption,
} from '../shared/MenuShell';
import { applySpriteContain } from '../shared/ScreenAdapt';
import { RL } from '../shared/RemakeLayout';

const PAGE_SIZE = 5;

export async function buildGalleryScreen(layer: Node, onBack: () => void): Promise<void> {
  const shell = await createMenuShell(layer, '武将图鉴', onBack);
  let page = 0;
  let selected: GalleryOfficer = GALLERY_OFFICERS[0];

  const portrait = new Node('Portrait');
  shell.body.addChild(portrait);
  portrait.setPosition(-280, 400, 0);
  const portraitSp = portrait.addComponent(Sprite);

  const nameL = makeRowLabel(shell.body, 'Name', '', 520, {
    fontSize: 36,
    bold: true,
    x: 120,
    width: 500,
  });
  nameL.horizontalAlign = 0;
  const factionL = makeRowLabel(shell.body, 'Faction', '', 450, {
    fontSize: 26,
    x: 120,
    width: 500,
  });
  factionL.horizontalAlign = 0;
  const attrsL = makeRowLabel(shell.body, 'Attrs', '', 340, {
    fontSize: 24,
    x: 120,
    width: 520,
  });
  attrsL.horizontalAlign = 0;
  const bioL = makeRowLabel(shell.body, 'Bio', '', 200, {
    fontSize: 22,
    color: new Color(210, 198, 170, 230),
    x: 120,
    width: 520,
  });
  bioL.horizontalAlign = 0;
  bioL.overflow = 2;

  const listRoot = new Node('List');
  shell.body.addChild(listRoot);
  listRoot.setPosition(0, -40, 0);

  const pageLabel = makeRowLabel(shell.body, 'Page', '', -480, { fontSize: 24 });

  const applyPortrait = async (path: string) => {
    const frame = await loadSpriteFrame(path);
    if (!portrait.isValid) return;
    if (frame) {
      applySpriteContain(portrait, portraitSp, frame, 220, 280);
      portrait.setPosition(-280, 400, 0);
    } else {
      const ui = portrait.getComponent(UITransform) ?? portrait.addComponent(UITransform);
      ui.setContentSize(180, 230);
      portraitSp.sizeMode = Sprite.SizeMode.CUSTOM;
      portraitSp.color = new Color(50, 42, 34, 255);
    }
  };

  const refreshDetail = async () => {
    nameL.string = selected.name;
    factionL.string = `势力：${selected.factionName}`;
    attrsL.string = `武力 ${selected.force}　智力 ${selected.intellect}　统率 ${selected.leadership}\n政治 ${selected.politics}　魅力 ${selected.charm}`;
    bioL.string = selected.bio;
    await applyPortrait(selected.portrait);
  };

  const renderPage = async () => {
    listRoot.removeAllChildren();
    const totalPages = Math.max(1, Math.ceil(GALLERY_OFFICERS.length / PAGE_SIZE));
    page = Math.max(0, Math.min(page, totalPages - 1));
    pageLabel.string = `${page + 1} / ${totalPages}`;
    const start = page * PAGE_SIZE;
    const slice = GALLERY_OFFICERS.slice(start, start + PAGE_SIZE);
    const options: InkOption[] = [];
    let y = 80;
    for (const off of slice) {
      const opt = await createInkOption(listRoot, {
        name: `Off_${off.id}`,
        label: off.name,
        y,
        width: 560,
        height: 70,
        onClick: () => {
          selected = off;
          void refreshDetail();
          options.forEach((o, i) => o.setSelected(slice[i].id === selected.id));
        },
      });
      options.push(opt);
      y -= 86;
    }
    const idx = slice.findIndex((o) => o.id === selected.id);
    if (idx >= 0) options[idx]?.setSelected(true);
  };

  await refreshDetail();
  await renderPage();

  await createClassicButton(shell.body, {
    name: 'Prev',
    label: '上一页',
    style: 'quaternary',
    width: 260,
    height: 76,
    y: -400,
    onClick: () => {
      page -= 1;
      void renderPage();
    },
  });
  shell.body.getChildByName('Prev')?.setPosition(-170, -400, 0);

  await createClassicButton(shell.body, {
    name: 'Next',
    label: '下一页',
    style: 'quaternary',
    width: 260,
    height: 76,
    y: -400,
    onClick: () => {
      page += 1;
      void renderPage();
    },
  });
  shell.body.getChildByName('Next')?.setPosition(170, -400, 0);
  void RL;
}
