import { ALL_SCENARIOS } from './scenarios/index';
import { PORTRAIT_POOL_LABELS } from './portraitMap';

/** 图鉴展示条目（不含势力/在野标签） */
export type GalleryGeneral = {
  id: string;
  name: string;
  force: number;
  intelligence: number;
  politics: number;
  charm: number;
  leadership: number;
  skill: string;
  bio: string;
};

function inferSkill(force: number, intelligence: number, leadership: number): string {
  if (intelligence >= 92) return '神算';
  if (force >= 92) return '武圣';
  if (leadership >= 90) return '帅才';
  if (intelligence >= 80) return '奇谋';
  if (force >= 85) return '猛将';
  return '均衡';
}

function inferBio(name: string, skill: string): string {
  return `${name}，三国乱世中的${skill === '神算' ? '运筹帷幄之士' : skill === '武圣' || skill === '猛将' ? '沙场宿将' : '可堪大任之臣'}。史载其性刚毅，多有战功与谋略传世。`;
}

function addEntry(map: Map<string, GalleryGeneral>, entry: GalleryGeneral): void {
  if (!map.has(entry.id)) map.set(entry.id, entry);
}

/** 合并剧本武将与储备池，供武将图鉴浏览 */
export function buildGalleryCatalog(): GalleryGeneral[] {
  const map = new Map<string, GalleryGeneral>();

  for (const scenario of ALL_SCENARIOS) {
    for (const g of scenario.generals) {
      const skill = inferSkill(g.force, g.intelligence, g.leadership);
      addEntry(map, {
        id: g.id,
        name: g.name,
        force: g.force,
        intelligence: g.intelligence,
        politics: g.politics,
        charm: g.charm,
        leadership: g.leadership,
        skill,
        bio: inferBio(g.name, skill),
      });
    }
  }

  for (const [id, name] of Object.entries(PORTRAIT_POOL_LABELS)) {
    const skill = '名将';
    addEntry(map, {
      id,
      name,
      force: 72,
      intelligence: 72,
      politics: 68,
      charm: 70,
      leadership: 72,
      skill,
      bio: inferBio(name, skill),
    });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}
