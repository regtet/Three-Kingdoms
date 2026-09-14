import { Color, Node, Sprite, UITransform } from 'cc';
import { GALLERY_OFFICERS, type GalleryOfficer } from '../shared/MenuCatalog';
import {
  createClassicButton,
  loadSpriteFrame,
  type ClassicButton,
} from '../shared/MenuChrome';
import { createMenuShell, makeRowLabel } from '../shared/MenuShell';
import { applySpriteContain } from '../shared/ScreenAdapt';
import { RL } from '../shared/RemakeLayout';

const PAGE_SIZE = 6;

export async function buildGalleryScreen(layer: Node, onBack: () => void): Promise<void> {
  const shell = await createMenuShell(layer, '武将图鉴', onBack);
  let page = 0;
  let selected: GalleryOfficer = GALLERY_OFFICERS[0];

  const portrait = new Node('Portrait');
  shell.body.addChild(portrait);
  portrait.setPosition(-300, 360, 0);
  const portraitSp = portrait.addComponent(Sprite);

  const nameL = makeRowLabel(shell.body, 'Name', '', 520, {
    fontSize: 36,
    bold: true,
    x: 140,
    width: 480,
  });
  nameL.horizontalAlign = 0;
  const factionL = makeRowLabel(shell.body, 'Faction', '', 450, {
    fontSize: 26,
    x: 140,
    width: 480,
  });
  factionL.horizontalAlign = 0;
  const attrsL = makeRowLabel(shell.body, 'Attrs', '', 320, {
    fontSize: 24,
    color: new Color(58, 52, 44, 255),
    x: 140,
    width: 480,
  });
  attrsL.horizontalAlign = 0;
  const bioL = makeRowLabel(shell.body, 'Bio', '', 160, {
    fontSize: 22,
    color: new Color(90, 82, 70, 255),
    x: 140,
    width: 480,
  });
  bioL.horizontalAlign = 0;
  bioL.overflow = 2;

  const listRoot = new Node('List');
  shell.body.addChild(listRoot);
  listRoot.setPosition(0, -80, 0);

  const pageLabel = makeRowLabel(shell.body, 'Page', '', -520, { fontSize: 24 });

  const applyPortrait = async (path: string) => {
    const frame = await loadSpriteFrame(path);
    if (!portrait.isValid) return;
    if (frame) {
      applySpriteContain(portrait, portraitSp, frame, 240, 300);
      portrait.setPosition(-300, 360, 0);
    } else {
      const ui = portrait.getComponent(UITransform) ?? portrait.addComponent(UITransform);
      ui.setContentSize(200, 250);
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
    const buttons: ClassicButton[] = [];
    let y = 120;
    for (const off of slice) {
      const btn = await createClassicButton(listRoot, {
        name: `Off_${off.id}`,
        label: off.name,
        style: 'tertiary',
        width: RL.btnTertiaryW,
        height: RL.btnTertiaryH,
        y,
        onClick: () => {
          selected = off;
          void refreshDetail();
          buttons.forEach((b, i) => b.setSelected(slice[i].id === selected.id));
        },
      });
      buttons.push(btn);
      y -= 100;
    }
    const idx = slice.findIndex((o) => o.id === selected.id);
    if (idx >= 0) buttons[idx]?.setSelected(true);
  };

  await refreshDetail();
  await renderPage();

  await createClassicButton(shell.body, {
    name: 'Prev',
    label: '上一页',
    style: 'quaternary',
    width: 220,
    height: 72,
    y: -440,
    onClick: () => {
      page -= 1;
      void renderPage();
    },
  });
  const prev = shell.body.getChildByName('Prev');
  if (prev) prev.setPosition(-180, -440, 0);

  await createClassicButton(shell.body, {
    name: 'Next',
    label: '下一页',
    style: 'quaternary',
    width: 220,
    height: 72,
    y: -440,
    onClick: () => {
      page += 1;
      void renderPage();
    },
  });
  const next = shell.body.getChildByName('Next');
  if (next) next.setPosition(180, -440, 0);
}
