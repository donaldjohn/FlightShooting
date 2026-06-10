# 天空霸者 (Sky Domination) ✈️

一款基于 **Three.js** 的 3D 飞行射击游戏，使用纯前端技术实现，所有素材（3D 模型、音效、特效）全部程序化生成，零外部资源依赖。

## ✨ 特色

- 🎮 **逼真的 3D 飞行器** —— 玩家战机 + 4 种敌机（侦察机/战斗机/轰炸机/Boss），全部用基础几何体组合而成，包含座舱、机翼、引擎喷火、武器挂点等细节
- 🗺️ **4 个递进关卡** —— 训练场 → 峡谷风暴 → 云层激战 → 终极 BOSS
- 💥 **粒子爆炸特效** —— 击中火花 / 敌机爆炸（含冲击波+闪光）/ BOSS 多重爆炸
- 🔊 **程序化音效** —— 射击、爆炸、引擎、警告、UI 全部由 Web Audio API 实时生成
- 🎯 **完善积分系统** —— 基础分 + 连击加成 + 时间奖励 + 完美通关奖励
- 🎨 **沉浸式 HUD** —— 生命条、连击计数、BOSS 血条、暂停/通关界面

## 🎮 操作说明

| 按键 | 功能 |
|------|------|
| `W` / `↑` | 飞机上抬（爬升） |
| `S` / `↓` | 飞机下俯（俯冲） |
| `A` / `←` | 左滚转 |
| `D` / `→` | 右滚转 |
| `Q` / `E` / `Space` / `鼠标左键` | 发射子弹 |
| `Shift` | 加速（持续 5 秒） |
| `P` | 暂停 / 继续 |
| `R` | 重新开始当前关卡 |
| 鼠标移动 | 辅助瞄准 |

## 🚀 快速开始

### 启动游戏

游戏使用 CDN 加载 Three.js，需要 HTTP 协议（不能直接打开 `index.html`）。在项目根目录启动任意 HTTP 服务器：

```bash
# Python 3
python -m http.server 8080

# 或 Node.js
npx http-server -p 8080
```

然后在浏览器打开 `http://localhost:8080/index.html`

### 推荐浏览器

- Chrome / Edge 90+ （最佳）
- Firefox 88+
- Safari 14+

需要支持 WebGL 2.0 和 Web Audio API。

## 📁 项目结构

```
FlightShooting/
├── index.html          # 入口（加载所有 JS 和 CSS）
├── css/
│   └── style.css       # 启动画面 / HUD / 暂停/通关界面样式
├── js/
│   ├── utils.js        # 工具函数（lerp/clamp/rand/distance）
│   ├── audio.js        # 程序化音效系统（Web Audio API）
│   ├── aircraft.js     # 4 种飞行器 3D 模型工厂
│   ├── bullet.js       # 子弹系统（玩家/敌机双管）
│   ├── enemy.js        # 敌机管理 + AI 行为（直飞/正弦/俯冲/环绕/轨道）
│   ├── explosion.js    # 爆炸粒子 + 冲击波 + 闪光
│   ├── level.js        # 4 个关卡配置（敌人波次/天空/雾）
│   ├── hud.js          # HUD DOM 更新器
│   ├── game.js         # 主控制器（场景/相机/主循环/碰撞/得分）
│   └── main.js         # UI 绑定 + 启动循环
├── assets/             # 测试截图（test_*.png）
└── CLAUDE.md           # 开发者文档
```

## 🎯 关卡设计

| 关卡 | 主题 | 时长 | 特色敌人 |
|------|------|------|----------|
| 第 1 关 | 训练场 | 60s | 5 架侦察机入门 |
| 第 2 关 | 峡谷风暴 | 75s | 加入战斗机 + 轰炸机 |
| 第 3 关 | 云层激战 | 80s | 敌人密度大幅提高 |
| 第 4 关 | 终极 BOSS | 90s | **巨型 BOSS（50 HP）+ 多重爆炸** |

每关结束按以下规则计分：
- **基础分**：敌机击毁（侦察机 100 / 战斗机 200 / 轰炸机 500 / BOSS 5000）
- **连击加成**：2 秒内连续击毁，每多 1 连击 +50 分
- **时间奖励**：提前完成 +（剩余秒数 × 10）
- **完美通关**：剩余生命 > 50% 时额外 +1000

## 🛠️ 技术栈

- **Three.js 0.155** —— 3D 渲染（CDN 加载）
- **Web Audio API** —— 程序化音效
- **WebGL** —— GPU 渲染
- 纯 JavaScript（无 ES Module，无打包）

## 🎨 自定义扩展

### 添加新关卡

编辑 `js/level.js` 的 `levels[]` 数组：

```js
{
    id: 5,
    name: '新关卡',
    desc: '说明',
    duration: 90,
    skyColor: 0x000000,
    fogColor: 0x111111,
    fogNear: 50,
    fogFar: 200,
    groundColor: 0x222222,
    waves: [
        { type: 'fighter', count: 3, delay: 2, interval: 2.0, behavior: 'straight', score: 200 }
    ]
}
```

并在 `index.html` 添加对应的"第5关"按钮。

### 添加新敌机类型

1. 在 `js/aircraft.js` 的 `AircraftFactory` 加新方法（参考 `createFighter`）
2. 在 `js/enemy.js` 的 `_spawn()` switch 加 case

### 添加新音效

在 `js/audio.js` 加方法，参考 `playExplosion` 的 noise + oscillator 模式。

## 📜 许可证

本项目仅作学习和演示用途，代码可自由使用。

## 🐛 已知问题

- three.js CDN 0.155 版本有 deprecation 警告（不影响功能）
- 自动播放策略要求首次操作后才能播放音效（已在 UI 按钮 click 中处理）
