# 天空霸者 (Sky Domination) ✈️

一款基于 **Three.js** 的 3D 飞行射击游戏，使用纯前端技术实现，所有素材（3D 模型、音效、特效）全部程序化生成，零外部资源依赖。

![游戏截图](https://img.shields.io/badge/Three.js-3D-blue) ![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![Web Audio](https://img.shields.io/badge/Web_Audio-API-green)

## ✨ 特色亮点

### 核心玩法
- 🎮 **逼真的 3D 飞行器** —— F-22 风格玩家战机 + 4 种敌机（侦察机/战斗机/轰炸机/Boss）
- 🗺️ **4 个递进关卡** —— 训练场 → 峡谷风暴 → 云层激战 → 终极 BOSS
- 🎯 **3 种难度** —— 🌱 简单（生命回复）/ ⚔️ 普通 / 💀 困难（精英敌人+1.5x分数）
- 🎨 **6 种战机涂装** —— 红/蓝/绿/金/紫/白个性化

### 战斗系统
- 💥 **粒子爆炸特效** —— 击中火花 / 敌机爆炸（粒子+冲击波+闪光）/ BOSS 5连爆
- 🤖 **智能敌机 AI** —— 5 种行为模式（直飞/正弦/俯冲/环绕/轨道）+ 智能躲避玩家子弹
- 🛡️ **BOSS 三阶段** —— 阶段1→阶段2→狂暴模式，攻击模式+移动速度递增，每8秒召唤小弟
- 🎁 **道具系统** —— 医疗包/双倍伤害/护盾，敌机随机掉落，BOSS 必掉

### 视听效果
- 🔊 **程序化音效** —— 射击/爆炸/引擎/警告 + A小调循环 BGM 全部由 Web Audio API 实时生成
- 🔢 **伤害数字** —— 3D 伤害数字实时投影到屏幕
- ✨ **道具视觉** —— 蓝色护盾球+黄色光环动画
- 📊 **BOSS 头顶3D血条** —— Canvas 绘制的 Sprite，3 档颜色

### 用户体验
- 🏆 **成就系统** —— 5 个成就（首战告捷/连击大师/完美通关/BOSS 猎手/百战精英）
- 🎓 **首次玩家教程** —— 4 步分步引导，可"不再显示"
- 📱 **手机触屏控制** —— 自动检测移动设备，方向键+开火+暂停虚拟按钮
- 🔇 **音量控制** —— SFX 和 BGM 分别独立调节滑块
- ⏸ **智能暂停** —— 标签页隐藏时自动暂停
- 🏆 **新纪录动画** —— 通关打破纪录时显示金色奖杯横幅
- 👑 **最终通关页面** —— 完成第4关BOSS显示华丽王冠+数据卡片+烟花
- 💾 **localStorage 持久化** —— 涂装/音量/最高分/成就/教程状态

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
- 移动端 Chrome / Safari

需要支持 WebGL 2.0 和 Web Audio API。

## 📁 项目结构

```
FlightShooting/
├── index.html          # 入口（加载所有 JS 和 CSS）
├── css/
│   └── style.css       # 全部样式（启动/HUD/暂停/结束/触屏/教程/成就）
├── js/
│   ├── utils.js          # 工具函数（lerp/clamp/rand/distance）
│   ├── audio.js          # 程序化音效 + BGM + 音量控制
│   ├── aircraft.js       # 5 种飞行器 3D 模型工厂
│   ├── bullet.js         # 子弹系统（玩家/敌机）
│   ├── enemy.js          # 敌机管理 + AI 行为 + 躲避 + 难度集成
│   ├── explosion.js      # 爆炸粒子 + 冲击波 + 闪光
│   ├── powerup.js        # 道具系统（医疗/双倍/护盾）
│   ├── damageNumbers.js  # 3D 伤害数字投影
│   ├── level.js          # 4 个关卡配置
│   ├── hud.js            # HUD DOM 更新器
│   ├── tutorial.js       # 教程系统 + 成就系统
│   ├── game.js           # 主控制器
│   └── main.js           # UI 绑定 + 启动循环 + 全局配置
├── CLAUDE.md             # 开发者文档
└── README.md             # 本文档
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
- **困难难度**：1.5x 分数倍率

## 🏆 成就列表

| 成就 | 条件 |
|------|------|
| 首战告捷 | 完成任意一个关卡 |
| 连击大师 | 达成 10 连击 |
| 完美通关 | 以满血完成一个关卡 |
| BOSS 猎手 | 击毁终极 BOSS |
| 百战精英 | 累计击毁 100 架敌机 |

## 🛠️ 技术栈

- **Three.js 0.155** —— 3D 渲染（CDN 加载）
- **Web Audio API** —— 程序化音效和 BGM
- **WebGL** —— GPU 渲染
- **localStorage** —— 用户偏好持久化（涂装/音量/最高分/成就/难度/教程状态）
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

### 添加新敌机类型

1. 在 `js/aircraft.js` 的 `AircraftFactory` 加新方法
2. 在 `js/enemy.js` 的 `_spawn()` switch 加 case

### 添加新涂装

在 `js/main.js` 的 `PLAYER_COLORS` 添加新颜色：

```js
PLAYER_COLORS.orange = { main: 0x3a2a1a, accent: 0xff922b };
```

并在 `index.html` 添加对应按钮。

### 添加新难度

在 `js/main.js` 的 `DIFFICULTY_SETTINGS` 添加新难度：

```js
DIFFICULTY_SETTINGS.insane = {
    name: '疯狂',
    enemyHealthMul: 2.0,
    enemyDamageMul: 2.0,
    enemySpeedMul: 1.5,
    enemyCount: 10,
    playerRegen: 0,
    scoreMul: 3.0
};
```

### 添加新成就

在 `js/tutorial.js` 的 `Achievements.definitions` 添加：

```js
{
    id: 'speed_runner',
    name: '极速飞行',
    desc: '60秒内完成第1关'
}
```

并在 `js/game.js` 适当位置调用 `Achievements.unlock('speed_runner')`。

## 🐛 已知问题

- three.js CDN 0.155 版本有 deprecation 警告（不影响功能）
- 自动播放策略要求首次用户操作后才能播放音效（已在 UI 按钮 click 中处理）

## 📊 项目统计

- **8 轮迭代** 持续改进
- **13 个 JavaScript 模块** 解耦清晰
- **5500+ 行代码** 精心组织
- **23+ 项功能** 完善
- **0 外部资源依赖**（除 Three.js CDN）

## 📜 许可证

本项目仅作学习和演示用途，代码可自由使用。

---

**GitHub:** [donaldjohn/FlightShooting](https://github.com/donaljohn/FlightShooting)

**致谢：** Made with ❤️ by Claude & 赵总
