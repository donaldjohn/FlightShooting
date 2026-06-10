# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**天空霸者 (Sky Domination)** —— 基于 three.js 的 3D 飞行射击游戏，纯前端单页应用，无任何外部资源依赖（除 three.js CDN 之外的所有素材均程序化生成）。

## 启动方式

无构建步骤。直接通过 HTTP 服务器运行（three.js CDN 需要 HTTP 协议）：

```bash
cd D:/workspace/playgroud/FlightShooting
python -m http.server 8080
# 浏览器访问 http://localhost:8080/index.html
```

测试可使用 Chrome DevTools MCP 连接本地 Chrome，访问上述 URL 进行端到端验证。

## 架构

`index.html` 按顺序加载 9 个 JS 文件，依赖关系自下而上：`utils.js` → `audio.js` → `aircraft.js` → `bullet.js` → `enemy.js` → `explosion.js` → `level.js` → `hud.js` → `game.js` → `main.js`。**顺序不可调整**，每个文件都假设前序全局对象已存在。

### 关键模块

- **`main.js`** —— 唯一入口。绑定 UI 按钮 → `Game.startLevel(idx)`，启动 `requestAnimationFrame` 循环。
- **`game.js`** —— `Game` 单例，持有 `scene/camera/renderer/clock` 和玩家状态机。负责主循环、碰撞、得分、BOSS 战、关卡推进。
- **`aircraft.js`** —— `AircraftFactory` 工厂：4 种飞行器（玩家 F-22 风格 / scout / fighter / bomber / boss）。所有模型用基础几何体（Cone/Box/Sphere/Extrude）组合，无外部模型。
- **`bullet.js`** / **`enemy.js`** / **`explosion.js`** —— 各管理器，依赖 `Game.scene` 注入。
- **`level.js`** —— `LevelMgr.levels[]` 配置 4 个关卡（每关时长/天空色/雾/敌机波次）。
- **`hud.js`** —— DOM 操作的 HUD 更新器。
- **`audio.js`** —— **程序化生成**所有音效（无音频文件）。`AudioMgr.init()` 必须在第一次用户交互后调用（浏览器自动播放策略）。
- **`utils.js`** —— `Utils.rand/lerp/clamp/distance` 等辅助函数。

### 关键约定

- **全局单例模式**：所有管理器（`Game`/`BulletMgr`/`EnemyMgr`/`ExplosionMgr`/`AudioMgr`/`HUD`/`LevelMgr`/`AircraftFactory`）都是挂载在 `window` 上的全局对象，没有 ES Module 也没有命名空间。
- **3D 坐标系**：`+Z` 是玩家背后（摄像机位置）/ `-Z` 是飞行方向。敌机在 `z = -100` 出生向 `+Z` 移动。`lookAt` 默认朝 -Z 方向看。
- **玩家移动模型**（已修复 bug）：**目标位置插值**而非速度累加。`_updatePlayer` 计算 `targetX = inputX * range / 1.6`，再用 `lerp` 平滑跟踪。这避免旧鼠标位置导致玩家无限漂移到边缘。
- **关卡开始时必须重置**：`Game.startLevel()` 会重置 `keys/mouseX/mouseY/mouseDown/boost`、玩家位置、相机位置和所有管理器。
- **对象池**：未使用，每个对象都 `new` 后 `dispose`；`Utils.disposeMesh()` 处理 geometry + material 释放。
- **音效懒初始化**：浏览器要求用户交互后才能创建 `AudioContext`，所以 `AudioMgr.init()` 在按钮 click 中调用。

## 常见修改点

- **新增关卡**：在 `level.js` 的 `levels[]` 加配置（duration/skyColor/fogColor/waves）。
- **新增敌机类型**：在 `aircraft.js` 加工厂方法，在 `enemy.js` 的 `_spawn()` switch 加 case。
- **新增音效**：在 `audio.js` 加方法（参考 `playExplosion` 的 noise+oscillator 模式）。
- **玩家位置边界**：`game.js` 的 `rangeX/rangeY`。

## 测试要点

- **3D 飞机模型**：用 Chrome DevTools MCP 截图验证（截屏在 `assets/test_*.png`）。
- **关卡完成**：自动测试时 `kills >= 19` 表示第 1 关打完。
- **控制台错误**：除了 three.js 弃用警告和 favicon 404，其他错误都是 bug。
- **关键 bug 经验**：玩家位置累积 bug 是因为旧的"速度叠加"移动模型 + 残留 `mouseX/mouseY` 值；修复方案是切换到"目标位置 lerp"模型 + 在 `startLevel` 重置所有输入状态。
