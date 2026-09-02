---
name: ui-layout-change
description: >-
  三国志 UI 改动流程（精简版）。项目 alwaysApply 规则 cocos-ui-layout.mdc 已覆盖日常改动；
  需要完整检查清单、Sprite 约定或 APK 打包说明时查阅本文。
disable-model-invocation: true
---

# UI 布局改动

## 快速流程

1. 读 `OfficialLayout.ts` 全部 `L.*`
2. **一次只改一个界面**（主菜单 / 图鉴 / 地图 idle / 子面板 / 单个弹窗）
3. 坐标只写在 `OfficialLayout.ts`；`GameRoot` 等只用 `L.*`
4. 改完：`npm test` 全绿 → bump `UI_BUILD_TAG` → 请用户 Cocos 截图验收

## 界面边界

| 界面 | 文件 | 常量前缀 |
|------|------|----------|
| 主菜单 | `GameRoot` menu、`BrandAssets`、`MenuBackground` | `L.MENU_*` |
| 武将图鉴 | `GeneralGalleryUi`、`GeneralPortrait` | `L.LOBBY_GALLERY_*` |
| 武将编辑 | `GeneralEditor.ts` | `L.EDITOR_*` |
| 地图 idle | `GameRoot` map、`OfficialPanels` | `L.MAP_*`、`L.CMD_*` |
| 子面板 | `OfficialPanels` | `L.SUB_*` |

**禁止**一次对话改 3 个以上界面；**禁止**修图鉴时顺带改 Logo（反之亦然）。

## 子面板防堆叠

打开子面板时必须：

```typescript
this.setMapLogVisible(false);
this.setMapCmdVisible(false); // 背景 + 五个 Cmd 按钮
this.subDimNode.active = true;
this.subPanel.setSiblingIndex(this.mapLayer.children.length - 1);
```

`closeSubPanel` 时全部恢复。

## Sprite 两套尺寸（禁止混用）

| 资源 | 函数 | 用于 |
|------|------|------|
| Logo / 背景 | `spriteFrameDisplaySize`（优先 rect） | `BrandAssets`、`MenuBackground` |
| 武将立绘 | `spriteFramePortraitSize`（优先 originalSize） | `PortraitLoader`、`GeneralPortrait` |

绑定顺序：`CUSTOM` → `spriteFrame` → `setContentSize` → `scale(1)`

共享文件（`SpriteFit.ts`、`BrandAssets.ts`、`PortraitLoader.ts`）改动后须回归主菜单 Logo + 图鉴立绘。

## APK / 竖屏打包

游戏 UI：**720×1280 竖屏**，`ScreenAdapt.ts` 使用 `FIXED_HEIGHT`。

```bash
npm run setup:build   # 竖屏、关闪屏、应用名、启动图标
```

| 问题 | 原因 | 处理 |
|------|------|------|
| 上下大黑边/空白 | 构建横屏或 `FIXED_WIDTH` | Cocos 仅 Portrait；`ScreenAdapt` fitHeight |
| Created with Cocos 闪屏 | `useSplashScreen: true` | `setup:build` 关闪屏；构建面板取消 Splash |
| 桌面名不对 | `strings.xml` 未写入 native | `build-assets/android/values/strings.xml` → `setup:build` |

打包前确认：设计分辨率 720×1280、仅 Portrait、取消 Splash Screen、应用名「三国志 · 天下争锋」。

## 完成清单

```
- [ ] 只改一个界面
- [ ] 坐标来自 OfficialLayout
- [ ] 子面板已 hide cmd/log
- [ ] Logo 用 displaySize，立绘用 portraitSize
- [ ] UI_BUILD_TAG 已 bump
- [ ] npm test 全绿
- [ ] 请用户 Cocos 预览截图（不自行宣布完成）
```

## 用户验收话术

```
请在 Cocos 预览，确认右下角 UI-vX.X.X。
请截图：[本次改动界面]；若动了共享 Sprite 文件，另附主菜单 Logo + 图鉴各一张。
APK 改动请重跑 setup:build 后重新打包容器验收。
```
