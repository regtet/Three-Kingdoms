# 三国志·天下争锋

精致重开。设计基准竖屏 **1080×1920**。当前已落地主菜单空壳（子页占位）。

## 预览

1. 用 Cocos Creator **3.8.8** 打开本目录（含 `assets`）
2. 打开场景 `assets/scenes/Game.scene`（应看到 **Canvas / Camera**，Canvas 上挂有 `GameBootstrap`）→ 预览
3. 确认控制台日志含 `REMAKE-v0.1.1-title-scene`
4. **请截图验收**主菜单（AI 不自称 UI 完成）

若仍提示空场景：菜单 **开发者 → 重新加载** 或关掉工程再开，让脚本 UUID 重新导入。

## 测试

```bash
nvm use 22
npm test
```

## 目录

- `assets/core` — 纯逻辑（无 Cocos）
- `assets/remake` — 主菜单 UI
- `assets/resources` — 素材（含 `ui/menu` 按钮贴图）

生成菜单贴图：`npm run gen:menu-ui`
