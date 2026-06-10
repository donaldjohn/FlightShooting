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
        });
    }

    function startGame(levelIdx) {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('endScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        Game.startLevel(levelIdx);
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
