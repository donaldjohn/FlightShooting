// 主入口 - 启动与UI控制
(function() {
    'use strict';

    // 启动游戏
    function bootstrap() {
        try {
            Game.init();
            HUD.init();
            AudioMgr.init();
            Tutorial.init();
            Achievements.init();
            setupUI();
            loop();
        } catch (e) {
            console.error('Init failed:', e);
            alert('游戏启动失败: ' + e.message);
        }
    }

    function setupUI() {
        // 主菜单按钮
        document.getElementById('btnStart').addEventListener('click', () => {
            AudioMgr.init();
            AudioMgr.resume();
            AudioMgr.playClick();
            startGame(0);
        });
        document.getElementById('btnInstructions').addEventListener('click', () => {
            AudioMgr.playClick();
            document.getElementById('instructions').style.display = 'block';
        });
        document.getElementById('btnBack').addEventListener('click', () => {
            AudioMgr.playClick();
            document.getElementById('instructions').style.display = 'none';
        });
        // 关于按钮
        document.getElementById('btnAbout').addEventListener('click', () => {
            AudioMgr.playClick();
            renderAboutAchievements();
            document.getElementById('aboutPanel').style.display = 'block';
        });
        document.getElementById('btnAboutClose').addEventListener('click', () => {
            AudioMgr.playClick();
            document.getElementById('aboutPanel').style.display = 'none';
        });

        // 音效开关
        const savedSound = localStorage.getItem('flightShooting_sound');
        if (savedSound === 'off') {
            AudioMgr.setMuted(true);
        }
        updateSoundButtons();
        document.getElementById('btnSound').addEventListener('click', () => {
            AudioMgr.setMuted(!AudioMgr.muted);
            localStorage.setItem('flightShooting_sound', AudioMgr.muted ? 'off' : 'on');
            updateSoundButtons();
            if (!AudioMgr.muted) AudioMgr.playClick();
        });
        document.getElementById('btnSoundPause').addEventListener('click', () => {
            AudioMgr.setMuted(!AudioMgr.muted);
            localStorage.setItem('flightShooting_sound', AudioMgr.muted ? 'off' : 'on');
            updateSoundButtons();
            if (!AudioMgr.muted) AudioMgr.playClick();
        });

        // 音量控制
        setupVolumeControls();

        // 触屏控制
        setupTouchControls();

        // 颜色选择
        setupColorPicker();

        // 难度选择
        setupDifficultyPicker();

        // 显示历史最高分
        renderHighscores();

        // 关卡选择
        document.querySelectorAll('.btn-level').forEach(btn => {
            btn.addEventListener('click', () => {
                AudioMgr.init();
                AudioMgr.resume();
                AudioMgr.playClick();
                const idx = parseInt(btn.getAttribute('data-level'), 10) - 1;
                startGame(idx);
            });
        });

        // 暂停界面
        document.getElementById('btnResume').addEventListener('click', () => {
            AudioMgr.playClick();
            Game.resume();
        });
        document.getElementById('btnRestart').addEventListener('click', () => {
            AudioMgr.playClick();
            Game.restartLevel();
        });
        document.getElementById('btnQuit').addEventListener('click', () => {
            AudioMgr.playClick();
            Game.quit();
        });

        // 结束界面
        document.getElementById('btnNext').addEventListener('click', () => {
            AudioMgr.playClick();
            const next = Game.levelIndex + 1;
            if (next < LevelMgr.levels.length) {
                startGame(next);
            }
        });
        document.getElementById('btnReplay').addEventListener('click', () => {
            AudioMgr.playClick();
            startGame(Game.levelIndex);
        });
        document.getElementById('btnMenu').addEventListener('click', () => {
            AudioMgr.playClick();
            Game.quit();
            renderHighscores(); // 返回菜单时刷新最高分
        });
        // 最终通关页面
        document.getElementById('btnFinalRestart').addEventListener('click', () => {
            AudioMgr.playClick();
            document.getElementById('finalScreen').style.display = 'none';
            startGame(0); // 重新从第1关开始
        });
        document.getElementById('btnFinalMenu').addEventListener('click', () => {
            AudioMgr.playClick();
            document.getElementById('finalScreen').style.display = 'none';
            Game.quit();
            renderHighscores();
        });
    }

    function startGame(levelIdx) {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('endScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        // 首次玩家显示教程
        if (Tutorial.shouldShow() && !Tutorial.isActive) {
            Tutorial.show();
            // 教程关闭后再开始游戏
            const checkInterval = setInterval(() => {
                if (!Tutorial.isActive) {
                    clearInterval(checkInterval);
                    Game.startLevel(levelIdx);
                }
            }, 200);
        } else {
            Game.startLevel(levelIdx);
        }
    }

    // 渲染历史最高分
    function renderHighscores() {
        const box = document.getElementById('highscoreList');
        if (!box) return;
        let arr = [];
        try {
            arr = JSON.parse(localStorage.getItem('flightShooting_scores') || '[]');
            arr.sort((a, b) => b.score - a.score); // 按分数降序
        } catch (e) {}
        if (arr.length === 0) {
            box.innerHTML = '<div style="text-align:center;color:#888;padding:8px;">暂无记录，挑战第一关吧！</div>';
            return;
        }
        const top = arr.slice(0, 5);
        box.innerHTML = top.map((s, i) => {
            const d = new Date(s.date);
            const dateStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            return `<div class="highscore-item">
                <span class="rank">#${i+1}</span>
                <span class="name">第${s.level}关</span>
                <span class="score">${s.score}</span>
                <span class="date">${dateStr}</span>
            </div>`;
        }).join('');
    }

    // 渲染关于页面中的成就列表
    function renderAboutAchievements() {
        const list = document.getElementById('aboutAchList');
        const countEl = document.getElementById('aboutAchCount');
        if (!list || !countEl) return;
        countEl.textContent = Achievements.getUnlockedCount();
        list.innerHTML = Achievements.definitions.map(def => {
            const unlocked = Achievements.isUnlocked(def.id);
            const data = unlocked ? Achievements.unlocked[def.id] : null;
            const dateStr = data ? (() => {
                const d = new Date(data.date);
                return `${d.getMonth()+1}/${d.getDate()}`;
            })() : '';
            return `<div class="ach-row ${unlocked ? 'unlocked' : ''}">
                <span class="ach-icon">${unlocked ? '🏆' : '🔒'}</span>
                <div class="ach-info">
                    <span class="name">${def.name}</span>
                    <span class="desc">${def.desc}</span>
                </div>
                <span class="ach-date">${dateStr}</span>
            </div>`;
        }).join('');
    }

    // 更新音效开关按钮显示
    function updateSoundButtons() {
        const label = AudioMgr.muted ? '🔇 音效：关' : '🔊 音效：开';
        const btn1 = document.getElementById('btnSound');
        const btn2 = document.getElementById('btnSoundPause');
        if (btn1) btn1.textContent = label;
        if (btn2) btn2.textContent = label;
    }

    // 设置触屏控制
    function setupTouchControls() {
        const touchControls = document.getElementById('touchControls');
        if (!touchControls) return;
        // 检测是否移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || ('ontouchstart' in window);
        if (!isMobile) {
            touchControls.style.display = 'none';
            return;
        }
        touchControls.style.display = 'block';

        const buttons = touchControls.querySelectorAll('.touch-btn[data-key]');
        buttons.forEach(btn => {
            const key = btn.getAttribute('data-key');
            const press = (e) => {
                e.preventDefault();
                if (window.Game) {
                    window.Game.keys[key] = true;
                }
            };
            const release = (e) => {
                e.preventDefault();
                if (window.Game) {
                    window.Game.keys[key] = false;
                }
            };
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
        });

        const pauseBtn = document.getElementById('touchPause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (Game.state === 'playing') Game.pause();
                else if (Game.state === 'paused') Game.resume();
            });
        }
    }

    // 设置音量控制
    function setupVolumeControls() {
        // 从 localStorage 恢复音量
        const sfxVol = localStorage.getItem('flightShooting_sfxVol');
        const musVol = localStorage.getItem('flightShooting_musicVol');
        if (sfxVol !== null) {
            AudioMgr.setSfxVolume(parseInt(sfxVol) / 100);
            const sfxEl = document.getElementById('sfxVolume');
            const sfxVal = document.getElementById('sfxVolumeVal');
            if (sfxEl) sfxEl.value = sfxVol;
            if (sfxVal) sfxVal.textContent = sfxVol + '%';
        }
        if (musVol !== null) {
            AudioMgr.setMusicVolume(parseInt(musVol) / 100);
            const musEl = document.getElementById('musicVolume');
            const musVal = document.getElementById('musicVolumeVal');
            if (musEl) musEl.value = musVol;
            if (musVal) musVal.textContent = musVol + '%';
        }

        const sfxEl = document.getElementById('sfxVolume');
        const sfxVal = document.getElementById('sfxVolumeVal');
        if (sfxEl) {
            sfxEl.addEventListener('input', () => {
                const v = parseInt(sfxEl.value);
                AudioMgr.setSfxVolume(v / 100);
                sfxVal.textContent = v + '%';
                localStorage.setItem('flightShooting_sfxVol', v);
            });
        }

        const musEl = document.getElementById('musicVolume');
        const musVal = document.getElementById('musicVolumeVal');
        if (musEl) {
            musEl.addEventListener('input', () => {
                const v = parseInt(musEl.value);
                AudioMgr.setMusicVolume(v / 100);
                musVal.textContent = v + '%';
                localStorage.setItem('flightShooting_musicVol', v);
            });
        }
    }

    // 颜色映射 (RGB 16进制)
    const PLAYER_COLORS = {
        red:    { main: 0x3a4a5c, accent: 0xff3344 },
        blue:   { main: 0x1e3a5f, accent: 0x339af0 },
        green:  { main: 0x1e3a2a, accent: 0x51cf66 },
        gold:   { main: 0x3a3520, accent: 0xffd43b },
        purple: { main: 0x2a1e3a, accent: 0xcc5de8 },
        white:  { main: 0x808890, accent: 0xf8f9fa }
    };

    let currentPlayerColor = 'red';

    // 难度设置
    const DIFFICULTY_SETTINGS = {
        easy: {
            name: '简单',
            enemyHealthMul: 0.6,
            enemyDamageMul: 0.5,
            enemySpeedMul: 0.85,
            enemyCount: 4,
            playerRegen: 1, // 每秒回血
            scoreMul: 0.8
        },
        normal: {
            name: '普通',
            enemyHealthMul: 1.0,
            enemyDamageMul: 1.0,
            enemySpeedMul: 1.0,
            enemyCount: 6,
            playerRegen: 0,
            scoreMul: 1.0
        },
        hard: {
            name: '困难',
            enemyHealthMul: 1.5,
            enemyDamageMul: 1.5,
            enemySpeedMul: 1.2,
            enemyCount: 8,
            playerRegen: 0,
            scoreMul: 1.5
        }
    };

    let currentDifficulty = 'normal';
    // 暴露到全局
    window.getCurrentDifficulty = () => currentDifficulty;
    window.DIFFICULTY_SETTINGS = DIFFICULTY_SETTINGS;

    // 设置难度选择器
    function setupDifficultyPicker() {
        const saved = localStorage.getItem('flightShooting_difficulty');
        if (saved && DIFFICULTY_SETTINGS[saved]) {
            currentDifficulty = saved;
        }
        // 标记当前选中的
        document.querySelectorAll('.diff-option').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-diff') === currentDifficulty);
            btn.addEventListener('click', () => {
                const d = btn.getAttribute('data-diff');
                if (DIFFICULTY_SETTINGS[d]) {
                    currentDifficulty = d;
                    localStorage.setItem('flightShooting_difficulty', d);
                    document.querySelectorAll('.diff-option').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    AudioMgr.playClick();
                }
            });
        });
    }

    // 设置颜色选择器
    function setupColorPicker() {
        const saved = localStorage.getItem('flightShooting_color');
        if (saved && PLAYER_COLORS[saved]) {
            currentPlayerColor = saved;
        }
        // 标记当前选中的
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-color') === currentPlayerColor);
            btn.addEventListener('click', () => {
                const c = btn.getAttribute('data-color');
                if (PLAYER_COLORS[c]) {
                    currentPlayerColor = c;
                    localStorage.setItem('flightShooting_color', c);
                    document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    AudioMgr.playClick();
                    // 立即更新玩家飞机颜色
                    if (Game && Game.player) {
                        Game.applyPlayerColor(c);
                    }
                }
            });
        });
    }

    function loop() {
        requestAnimationFrame(loop);
        const dt = Math.min(Game.clock.getDelta(), 0.05); // 防止标签页切换导致大跳跃
        Game.update(dt);
        Game.render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
