# 三国志 · 天下争锋

对照 Google Play [三國志２](https://play.google.com/store/apps/details?id=jp.co.koeitecmo.rtk2&hl=zh)（`jp.co.koeitecmo.rtk2`）：**精致重开中**。

## 当前状态（Day0）

| 项 | 说明 |
|----|------|
| 阶段 | 章程与官方对照；**尚未选定第一屏，不写新游戏 UI** |
| 决策 | 除静态资源外可重做；**core 玩法也按官方重写（1B）**；先对照后实现（2D） |
| 对照表 | [docs/official-screen-catalog.md](docs/official-screen-catalog.md) |
| 架构规则 | `.cursor/rules/remake-architecture.mdc` |

## 保留

`assets/resources/` 下静态资源一律保留：

- `portraits`（立绘）
- `audio` / `video`
- `brand` / `backgrounds` / `icons`

## 将重做

- `assets/scripts/core/` 玩法逻辑（旧代码将迁为 `legacy-core` 只读对照）
- `assets/scripts/remake/` 全部游戏 UI
- legacy `ui/GameRoot` 编排（仅作参考，禁止继续打补丁）

## 下一步（需要你）

1. 按对照表补 **P0 官方截图**：标题、选剧本、选势力、機能菜单、至少一个命令子面板  
2. 放入 `docs/official-refs/<页面ID>/` 并更新对照表状态  
3. 回复选定的**第一屏**页面 ID → 再开「单屏设计 + 实现」计划  

原则：**可以慢，必须精致；无参考图不写 UI。**

## 官方主流程（目标）

```
主菜单 → 选剧本 → 选势力 → 战略地图 → 选城 → 命令大类 → 结束回合
                              ├ 内政 / 军事 / 人才 / 计谋 / 外交
         → AI 回合 → 月结算 → 下一回合
```

## 运行（现有工程）

```bash
npm test
npm run flow
```

打开工程请用 `Desktop\Three-Kingdoms`（含 `assets`），勿开嵌套子目录。
