// 主入口 - 启动与UI控制
(function() {
    'use strict';

    // 启动游戏
    function bootstrap() {
        try {
            Game.init();
            HUD.init();
            AudioMgr.init();
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

        // 触屏控制
        setupTouchControls();

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
    }

    function startGame(levelIdx) {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('endScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        Game.startLevel(levelIdx);
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
