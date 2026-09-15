/** 静态武将定义（图鉴 / 开局库） */
export type OfficerFactionHint =
  | 'wei'
  | 'shu'
  | 'wu'
  | 'yuan'
  | 'dong'
  | 'lu'
  | 'han'
  | 'nan'
  | 'other';

export type OfficerStyle =
  | '君主'
  | '猛将'
  | '谋士'
  | '统帅'
  | '内政'
  | '女将'
  | '方士';

export type OfficerDef = {
  id: string;
  name: string;
  courtesyName?: string;
  portrait: string;
  force: number;
  intellect: number;
  leadership: number;
  politics: number;
  charm: number;
  birthYear: number;
  factionHint: OfficerFactionHint;
  style: OfficerStyle;
  bio: string;
};
