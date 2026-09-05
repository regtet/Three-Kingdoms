# 三国志 · 天下争锋

原创三国志类回合制策略游戏（Cocos Creator 3.8）。  
对照 Google Play [三國志２](https://play.google.com/store/apps/details?id=jp.co.koeitecmo.rtk2&hl=zh)：**先复刻，再二创更新**。

## 复刻路线（当前）

| 阶段 | 内容 | 状态 |
|------|------|------|
| 1 整理 | 清无用代码；保留立绘/音频/视频 | ✅ |
| 2 定框架 | `assets/scripts/remake/` + 架构规则 | ✅ |
| 3 复刻菜单 | 标题 / 剧本 / 势力 / 读档 / 设置 | 🚧 `REMAKE-v0.1.0` |
| 4 复刻地图 | 战略地图主界面 | 待开始 |
| 5 复刻行动 | 武将行动 · 五大命令 · 回合 | 待开始 |

**目录：** `core/` 纯逻辑｜`remake/` 新 UI 主战场｜`ui/` legacy（只读参考，禁止新功能）

Cocos 预览：主流程走 `RemakeRoot`；右下角应显示 `REMAKE-v0.1.0`。地图阶段尚未复刻，开局后为占位页。

## 官方流程（目标，阶段5对齐）

```
主菜单 → 选剧本 → 选势力 → 战略地图 → 选城 → 命令大类 → 结束回合
                              ├ 内政 / 军事 / 人才 / 计谋 / 外交
         → AI 回合 → 月结算 → 下一回合
```

## 剧本

| 剧本 | 说明 |
|------|------|
| 三足鼎立 | 200年标准开局 |
| 赤壁争锋 | 208年前线对峙 |
| 官渡争锋 | 200年秋曹袁对决 |

## 运行

```bash
npm test
npm run flow
npm run setup:build
```

打开工程请用 `Desktop\Three-Kingdoms`（含 assets），勿开嵌套子目录。
