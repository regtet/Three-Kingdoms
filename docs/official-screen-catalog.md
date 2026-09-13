# 官方页面对照表（三國志２ / jp.co.koeitecmo.rtk2）

对标：[Google Play 三國志２](https://play.google.com/store/apps/details?id=jp.co.koeitecmo.rtk2&hl=zh)

**状态说明**

| 状态 | 含义 |
|------|------|
| 缺图 | 无可靠官方参考图，禁止写 UI |
| 可设计 | 参考图已齐，可写结构设计说明 |
| 可实现 | 设计说明已确认，可开工实现 |
| 已验收 | 用户截图验收通过 |

**门禁**：缺图 → 只更新本表；有图 → 设计 → 实现 → 验收。一次只做一个屏。

参考图建议放：`docs/official-refs/<screen-id>/`（可将现有 `tmp-official-refs/` 迁入对应目录）。

---

## 对照表

| 页面ID | 中文名 | 有无参考图 | 参考路径 | 关键区域 | 按钮/入口文案 | 状态 |
|--------|--------|------------|----------|----------|---------------|------|
| title | 标题主菜单 | 否 | — | 菜单项列表、品牌区 | 待对照（新游戏/继续/教程/事典/设定等） | 缺图 |
| scenario | 选剧本 | 否 | — | 剧本列表、简介 | 返回；选中进势力 | 缺图 |
| faction | 选势力 | 否 | — | 势力列表、城/将摘要 | 返回；选定开局 | 缺图 |
| map_idle | 战略地图 idle | 是 | `tmp-official-refs/playstore_1.png` | 日期条；立绘+数值格；色块地图；右三键；底五键 | 情报 / 機能 / 進行；内政·軍事·人材·計略·外交 | 可设计 |
| func_menu | 機能菜单 | 否 | — | 从地图右侧「機能」展开 | 待对照（存档/设定/回标题等） | 缺图 |
| cmd_domestic | 内政命令面板 | 否 | — | 选将 + 行动 + 底栏 | 戻る / 中止 / 決定；开发类行动待对照 | 缺图 |
| cmd_military | 军事命令面板 | 否 | — | 选将 + 征兵/出兵/运输等 | 同上 | 缺图 |
| cmd_personnel | 人材命令面板 | 否 | — | 选将 + 赏赐/任命/搜索等 | 同上 | 缺图 |
| cmd_stratagem | 计略命令面板 | 否 | — | 选将 + 目标 + 计略 | 同上 | 缺图 |
| cmd_diplomacy | 外交命令面板 | 否 | — | 使者/同盟/停战/宣战等 | 同上 | 缺图 |
| deploy | 出兵部署 | 否 | — | 武将、兵力、目标城 | 待对照 | 缺图 |
| general_pick | 武将选择列表 | 是 | `tmp-official-refs/playstore_4.png` | 提示条；立绘行；页签；底四键 | 所属/状態/能力/戦力；ソート/戻る/中止/決定 | 可设计 |
| general_info | 武将情报 | 是 | `tmp-official-refs/playstore_5.png` | 立绘属性格；势力行；列传 | 戻る / 中止 / 決定 | 可设计 |
| battle | 战术战场 | 是 | `tmp-official-refs/playstore_2.png` | 双方对比；方格地图；底五键 | 移動/攻撃/工作/待機/退却 | 可设计 |
| duel | 一骑讨 | 是 | `tmp-official-refs/playstore_3.png` | VS、武力、体力条、演出 | 待细对 | 可设计 |
| intel | 情报总览 | 否 | — | 待对照 | 待对照 | 缺图 |
| tutorial | 教程 | 否 | — | 待对照 | 待对照 | 缺图 |
| encyclopedia | 三國志事典 | 否 | — | 待对照 | 待对照 | 缺图 |
| settings | 设置 | 否 | — | 待对照官方项 | 待对照 | 缺图 |
| save_load | 存档/读档 | 否 | — | 槽位列表 | 待对照 | 缺图 |

---

## P0 待你补图（补齐前禁止写这些 UI）

1. **title** — 标题主菜单整页  
2. **scenario** — 选剧本整页  
3. **faction** — 选势力整页  
4. **func_menu** — 地图点「機能」后的菜单  
5. **cmd_*** — 至少一个命令子面板整页（建议先内政）  
6. **deploy** — 出兵部署（若与军事面板分离）

补图后：把文件放进 `docs/official-refs/<页面ID>/`，把上表「有无参考图」改为「是」，状态改为「可设计」，并回复选定**第一屏**页面ID。

---

## 已有商店参考说明

| 文件 | 大致内容 |
|------|----------|
| `tmp-official-refs/playstore_1.png` | 战略地图 idle |
| `tmp-official-refs/playstore_2.png` | 战术战场 |
| `tmp-official-refs/playstore_3.png` | 一骑讨 |
| `tmp-official-refs/playstore_4.png` | 武将选择列表 |
| `tmp-official-refs/playstore_5.png` | 武将情报 |

用户聊天中另附的官方拼图/情报图，实现对应屏时应一并对照。
