---
name: ui-layout-change
description: >-
  三国志 UI 改动详细流程（补充说明）。项目已设 alwaysApply 规则
  cocos-ui-layout.mdc，用户说「改 xxx」时 Agent 应自动遵守，无需用户点名本 skill。
  仅在需要完整检查清单或分层示意图时查阅本文。
disable-model-invocation: true
---

# UI 布局改动流程

## 开始前

1. 读 `assets/scripts/ui/OfficialLayout.ts`（全部 `L.*` 常量）
2. 读 `.cursor/rules/cocos-ui-layout.mdc`
3. 明确**本次只改一个界面**（主菜单 / 地图 idle / 子面板 / 某个弹窗）
4. 若用户提供了截图，先标注冲突区域再动手

## 分层模型（地图屏）

```
┌─────────────────────────────┐
│ Header + 城池面板            │  y ≈ 530–620
├─────────────────────────────┤
│ 战略地图 + 右侧竖栏          │  MAP_CENTER
├─────────────────────────────┤
│ 日志栏（idle 可见）          │  LOG_Y
├─────────────────────────────┤
│ 五类命令栏（idle 可见）      │  CMD_Y
└─────────────────────────────┘

子面板打开时 ↑ 日志栏+命令栏必须隐藏，subDim 遮罩地图，subPanel 从底部弹出
```

## 实施步骤

### 1. 布局常量

- 只在 `OfficialLayout.ts` 新增/修改坐标
- 子面板内部顺序：`SUB_TITLE → SUB_INFO → SUB_SORT → SUB_LIST → SUB_ACTION → SUB_EXTRA → SUB_FOOTER`

### 2. 层互斥逻辑（GameRoot.ts）

打开子面板 `onCategory` 必须调用：

```typescript
this.setMapLogVisible(false);
this.setMapCmdVisible(false);
this.subDimNode.active = true;
this.subPanel.setSiblingIndex(this.mapLayer.children.length - 1);
```

关闭 `closeSubPanel` 必须反向恢复。

### 3. 弹窗 vs 子面板

| 类型 | 节点 | 是否隐藏 cmd/log |
|------|------|------------------|
| 子面板 | subPanel | 是 |
| 存档槽/设置/功能 | slotPickerPanel, settingsLayer 等 | 各自独立 layer，不叠加 map cmd |
| 全屏 modal | logPanel, funcPanel 等 | 独立 layer |

禁止在 `mapLayer` 上叠加多个可交互层而不隐藏底层。

### 4. 黑边检查

- 根节点 / 全屏 Bg 尺寸 = `L.W × L.H`
- 遮罩 Graphics 矩形以中心为原点，宽高匹配父 UITransform
- 模态 dim 层 alpha 一致，不要只遮一半屏幕

### 5. 自测

```bash
npm test
```

必须包含 `tests/layout.test.ts` 全部通过。

### 6. 版本标记

 bump `UI_BUILD_TAG`（如 `UI-v1.1.5` → `UI-v1.1.6`），同步 README 运行说明中的版本号。

## 完成前检查清单

```
- [ ] 只改了一个界面/一层
- [ ] 坐标全部来自 OfficialLayout.ts
- [ ] 子面板打开时 cmdBar + logBar 已隐藏
- [ ] subPanel 内置区域无重叠（layout 测试通过）
- [ ] UI_BUILD_TAG 已 bump
- [ ] npm test 全绿
- [ ] 已请用户 Cocos 预览并截图验收（不自行宣布完成）
```

## 用户验收话术（改完后必须输出）

```
请在 Cocos 中预览，确认主菜单显示「构建 UI-vX.X.X」。
请截图：[具体界面，如 人才子面板 / 主菜单] 确认无堆叠、无黑边。
```

## 禁止事项

- 禁止一次对话改 3 个以上界面
- 禁止在 GameRoot 写硬编码 Y 值
- 禁止只隐藏 CmdBar 背景而不隐藏五个 Cmd 按钮
- 禁止跳过 npm test 直接说「已修复」
