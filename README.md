# 天空霸者 (Sky Domination) ✈️

一款基于 **Three.js** 的 3D 飞行射击游戏，使用纯前端技术实现，所有素材（3D 模型、音效、特效）全部程序化生成，零外部资源依赖。

![游戏截图](https://img.shields.io/badge/Three.js-3D-blue) ![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![Web Audio](https://img.shields.io/badge/Web_Audio-API-green)

## ✨ 特色亮点

- 🎮 **逼真的 3D 飞行器** —— 玩家战机 + 4 种敌机（侦察机/战斗机/轰炸机/Boss），全部用基础几何体组合而成
- 🗺️ **4 个递进关卡** —— 训练场 → 峡谷风暴 → 云层激战 → 终极 BOSS
- 💥 **粒子爆炸特效** —— 击中火花 / 敌机爆炸（粒子+冲击波+闪光）/ BOSS 多重爆炸
- 🔊 **程序化音效** —— 射击/爆炸/引擎/警告 + A小调循环 BGM 全部由 Web Audio API 实时生成
- 🎯 **完善积分系统** —— 基础分 + 连击加成 + 时间奖励 + 完美通关 + 历史最高分
- 🎁 **道具系统** —— 医疗包/双倍伤害/护盾，敌机随机掉落，BOSS 必掉
- 🛡️ **BOSS 三阶段** —— 阶段1→阶段2→狂暴模式，攻击模式+移动速度递增，每8秒召唤小弟
- 🤖 **敌机 AI** —— 5 种行为模式（直飞/正弦/俯冲/环绕/轨道）+ 智能躲避玩家子弹
- 📱 **手机触屏控制** —— 自动检测移动设备，方向键+开火+暂停虚拟按钮
- 🎨 **玩家个性化** —— 6 种战机涂装颜色（红/蓝/绿/金/紫/白）
- 🏆 **新纪录动画** —— 通关打破纪录时显示金色奖杯横幅
- 🔢 **伤害数字** —— 3D 伤害数字实时投影到屏幕
- 🔇 **音量控制** —— SFX 和 BGM 分别独立调节
- ⏸ **智能暂停** —— 标签页隐藏时自动暂停

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

**手机/平板：** 使用屏幕上的虚拟方向键和开火按钮

## 🚀 快速开始

### 启动游戏

游戏使用 CDN 加载 Three.js，需要 HTTP 协议（不能直接打开 `index.html`）。在项目根目录启动任意 HTTP 服务器：

```bash
# Python 3
python -m http.server 8080

# 或 Node.js
npx http-server -p 8080

# 或 PHP
php -S localhost:8080
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
│   └── style.css       # 全部样式（启动/HUD/暂停/结束/触屏）
├── js/
│   ├── utils.js        # 工具函数（lerp/clamp/rand/distance）
│   ├── audio.js        # 程序化音效 + BGM 系统
│   ├── aircraft.js     # 5 种飞行器 3D 模型工厂
│   ├── bullet.js       # 子弹系统（玩家/敌机）
│   ├── enemy.js        # 敌机管理 + AI 行为 + 躲避
│   ├── explosion.js    # 爆炸粒子 + 冲击波 + 闪光
│   ├── powerup.js      # 道具系统（医疗/双倍/护盾）
│   ├── damageNumbers.js# 3D 伤害数字投影
│   ├── level.js        # 4 个关卡配置
│   ├── hud.js          # HUD DOM 更新器
│   ├── game.js         # 主控制器（场景/相机/主循环/碰撞/AI）
│   └── main.js         # UI 绑定 + 启动循环
├── CLAUDE.md           # 开发者文档
└── README.md           # 本文档
```

## 🎯 关卡设计

| 关卡 | 主题 | 时长 | 特色敌人 |
|------|------|------|----------|
| 第 1 关 | 训练场 | 60s | 5 架侦察机入门 |
| 第 2 关 | 峡谷风暴 | 75s | 战斗机 + 轰炸机 |
| 第 3 关 | 云层激战 | 80s | 敌人密度大幅提高 |
| 第 4 关 | 终极 BOSS | 90s | 巨型 BOSS（100HP）三阶段 + 召唤小弟 |

每关结束按以下规则计分：
- **基础分**：侦察机 100 / 战斗机 200 / 轰炸机 500 / BOSS 5000
- **连击加成**：2 秒内连续击毁，每多 1 连击 +50 分
- **时间奖励**：提前完成 +（剩余秒数 × 10）
- **完美通关**：剩余生命 > 50% 时额外 +1000
- **新纪录奖励**：打破历史最高分时显示特殊动画

## 🛠️ 技术栈

- **Three.js 0.155** —— 3D 渲染（CDN 加载）
- **Web Audio API** —— 程序化音效和 BGM
- **WebGL** —— GPU 渲染
- **localStorage** —— 用户偏好持久化（涂装/音量/最高分）
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

### 添加新涂装

在 `js/main.js` 的 `PLAYER_COLORS` 添加新颜色：

```js
PLAYER_COLORS.orange = { main: 0x3a2a1a, accent: 0xff922b };
```

并在 `index.html` 添加对应按钮。

### 添加新音效

在 `js/audio.js` 加方法，参考 `playExplosion` 的 noise + oscillator 模式。

## 🐛 已知问题

- three.js CDN 0.155 版本有 deprecation 警告（不影响功能）
- 自动播放策略要求首次用户操作后才能播放音效（已在 UI 按钮 click 中处理）
- 极端浏览器窗口大小下 HUD 元素可能需要调整

## 📜 许可证

本项目仅作学习和演示用途，代码可自由使用。

---

**GitHub:** [donaldjohn/FlightShooting](https://github.com/donaljohn/FlightShooting)
