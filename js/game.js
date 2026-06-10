// 游戏主控制器
const Game = {
    // 场景
    scene: null,
    camera: null,
    renderer: null,
    clock: null,

    // 玩家
    player: null,
    playerHealth: 100,
    playerMaxHealth: 100,
    playerInvuln: 0, // 无敌时间

    // 游戏状态
    state: 'menu', // menu, playing, paused, ended
    score: 0,
    combo: 0,
    maxCombo: 0,
    kills: 0,
    lastKillTime: 0,
    fireTimer: 0,
    fireRate: 0.12,
    boost: false,
    boostTimer: 0,

    // 输入
    keys: {},
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,

    // 关卡
    levelIndex: 0,
    levelEnded: false,

    // 时间
    startTime: 0,

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);

        // 雾
        this.scene.fog = new THREE.Fog(0xb0d8e8, 60, 200);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, -10);

        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 光照
        this._setupLights();

        // 地面与云
        this._setupEnvironment();

        // 玩家
        this.player = AircraftFactory.createPlayer();
        this.scene.add(this.player);

        // 玩家点光源（确保暗关卡下也醒目）
        this.playerLight = new THREE.PointLight(0x66aaff, 1.5, 12);
        this.playerLight.position.set(0, 0, 0.5);
        this.player.add(this.playerLight);

        // 护盾视觉效果
        this.shieldVisual = this._createShieldVisual();
        this.shieldVisual.visible = false;
        this.player.add(this.shieldVisual);

        // 双倍伤害视觉效果
        this.damageVisual = this._createDamageVisual();
        this.damageVisual.visible = false;
        this.player.add(this.damageVisual);

        // 初始化模块
        BulletMgr.init(this.scene);
        EnemyMgr.init(this.scene);
        ExplosionMgr.init(this.scene);
        PowerupMgr.init(this.scene);

        this.clock = new THREE.Clock();
        this._setupInput();
        this._setupVisibilityHandler();

        window.addEventListener('resize', () => this._onResize());
    },

    _setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'playing') {
                this.pause();
            }
        });
    },

    _createShieldVisual() {
        // 蓝色半透明球壳
        const group = new THREE.Group();
        // 内层球
        const innerGeo = new THREE.SphereGeometry(2.0, 24, 16);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x4dabf7,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        group.add(new THREE.Mesh(innerGeo, innerMat));
        // 外层线框
        const wireGeo = new THREE.SphereGeometry(2.1, 16, 12);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x4dabf7,
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        group.add(new THREE.Mesh(wireGeo, wireMat));
        return group;
    },

    _createDamageVisual() {
        // 黄色光环
        const group = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const geo = new THREE.RingGeometry(1.3 + i * 0.2, 1.5 + i * 0.2, 32);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffd43b,
                transparent: true,
                opacity: 0.85 - i * 0.15,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const ring = new THREE.Mesh(geo, mat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
        return group;
    },

    _setupLights() {
        // 光照设置
        // 主光源 (太阳)
        const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
        sun.position.set(30, 40, 20);
        sun.castShadow = true;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -30;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        this.scene.add(sun);
        this.sun = sun;

        // 半球光 (天光)
        const hemi = new THREE.HemisphereLight(0x88aaff, 0x442211, 0.6);
        this.scene.add(hemi);

        // 环境光
        const amb = new THREE.AmbientLight(0x404060, 0.3);
        this.scene.add(amb);
    },

    _setupEnvironment() {
        // 地面 (远处)
        const groundGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
        const groundMat = new THREE.MeshPhongMaterial({
            color: 0x335533,
            shininess: 0
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -30;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.ground = ground;

        // 云层
        this.clouds = [];
        for (let i = 0; i < 30; i++) {
            this._addCloud(Utils.rand(-200, 200), Utils.rand(15, 40), Utils.rand(-300, 50));
        }
    },

    _addCloud(x, y, z) {
        const group = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            shininess: 0
        });
        const count = Utils.randInt(3, 6);
        for (let i = 0; i < count; i++) {
            const r = Utils.rand(2, 5);
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(r, 8, 6),
                mat
            );
            sphere.position.set(Utils.rand(-3, 3), Utils.rand(-1, 1), Utils.rand(-3, 3));
            group.add(sphere);
        }
        group.position.set(x, y, z);
        this.scene.add(group);
        this.clouds.push(group);
    },

    _setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyP' && this.state === 'playing') {
                this.pause();
            } else if (e.code === 'KeyP' && this.state === 'paused') {
                this.resume();
            } else if (e.code === 'KeyR' && (this.state === 'playing' || this.state === 'paused')) {
                this.restartLevel();
            }
            // 防止页面滚动
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // 鼠标
        window.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        window.addEventListener('mousedown', () => { this.mouseDown = true; });
        window.addEventListener('mouseup', () => { this.mouseDown = false; });
    },

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    /**
     * 开始关卡
     */
    startLevel(idx) {
        this.levelIndex = idx;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.kills = 0;
        this.playerHealth = this.playerMaxHealth;
        this.playerInvuln = 0;
        this.levelEnded = false;
        this.boost = false;
        this.boostTimer = 0;
        this.fireTimer = 0;

        // 重置场景对象
        BulletMgr.reset();
        EnemyMgr.reset();
        ExplosionMgr.reset();
        PowerupMgr.reset();

        // 重置玩家位置和摄像机
        this.player.position.set(0, 0, 0);
        this.player.rotation.set(0, 0, 0);
        this.player.visible = true;
        this.camera.position.set(0, 3, 10);
        this.camera.lookAt(0, -2, -20);

        // 加载关卡
        LevelMgr.load(idx, this.scene);
        if (this.ground) this.ground.material.color.setHex(LevelMgr.current.groundColor);

        // 更新 HUD
        HUD.setLevel(idx + 1);
        HUD.setScore(0);
        HUD.setCombo(0);
        HUD.setHealth(this.playerHealth);
        HUD.setTime(0);
        HUD.setBossHP(null);
        HUD.showMessage(LevelMgr.current.name, 3);

        // 重置输入状态 - 避免旧鼠标位置累积
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.boost = false;

        this.state = 'playing';
        this.startTime = performance.now();
        this.clock.start();

        // 启动背景音乐
        AudioMgr.startMusic();
    },

    pause() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        document.getElementById('pauseScreen').style.display = 'flex';
    },

    resume() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        document.getElementById('pauseScreen').style.display = 'none';
        this.clock.start();
    },

    restartLevel() {
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('endScreen').style.display = 'none';
        this.startLevel(this.levelIndex);
    },

    quit() {
        this.state = 'menu';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('endScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
        // 清理
        BulletMgr.reset();
        EnemyMgr.reset();
        ExplosionMgr.reset();
        AudioMgr.stopMusic();
    },

    endLevel(victory) {
        if (this.levelEnded) return;
        this.levelEnded = true;
        this.state = 'ended';

        const timeBonus = victory ? Math.floor((LevelMgr.current.duration - LevelMgr.levelTime) * 10) : 0;
        if (timeBonus > 0) this.score += timeBonus;

        // 完美通关奖励
        if (victory && this.playerHealth > 50) {
            this.score += 1000;
        }

        document.getElementById('endTitle').textContent = victory ? '✈ 通关成功！' : '✈ 任务失败';
        document.getElementById('endTitle').style.color = victory ? '#51cf66' : '#ff6b6b';
        document.getElementById('endScore').textContent = this.score;
        document.getElementById('endCombo').textContent = this.maxCombo;
        document.getElementById('endKills').textContent = this.kills;

        // 总分 = 本次积分
        document.getElementById('endTotal').textContent = this.score;

        // 最后一关没有"下一关"按钮
        const isLast = this.levelIndex >= LevelMgr.levels.length - 1;
        document.getElementById('btnNext').style.display = (victory && !isLast) ? 'block' : 'none';
        document.getElementById('btnReplay').textContent = isLast ? '再来一次' : '重新挑战';

        // 保存分数到 localStorage
        this._saveScore();

        document.getElementById('endScreen').style.display = 'flex';
    },

    _saveScore() {
        try {
            const key = 'flightShooting_scores';
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            arr.push({
                date: new Date().toISOString(),
                level: this.levelIndex + 1,
                score: this.score,
                kills: this.kills,
                maxCombo: this.maxCombo
            });
            arr.sort((a, b) => b.score - a.score);
            localStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
        } catch (e) {}
    },

    /**
     * 主循环更新
     */
    update(dt) {
        if (this.state !== 'playing') {
            // 即使暂停也轻微更新爆炸 (让画面更平滑)
            ExplosionMgr.update(dt);
            return;
        }

        // 玩家控制
        this._updatePlayer(dt);

        // 关卡时间
        const evt = LevelMgr.update(dt);
        if (evt && evt.bossSpawned) {
            HUD.showMessage('⚠ 警告：BOSS 出现！', 3);
        }
        HUD.setTime(LevelMgr.levelTime);

        // 敌机
        EnemyMgr.update(dt, LevelMgr.levelTime, this.player.position, this);

        // 子弹
        BulletMgr.update(dt);

        // 爆炸
        ExplosionMgr.update(dt);

        // 道具
        PowerupMgr.update(dt, this.player.position, (type) => {
            PowerupMgr.applyEffect(type);
        });

        // 玩家射击
        this._handleShooting(dt);

        // 碰撞检测
        this._handleCollisions();

        // 检查结束
        if (LevelMgr.isComplete() && EnemyMgr.enemies.length === 0 && EnemyMgr.spawnQueue.length === 0) {
            this.endLevel(true);
        }

        // 动画
        AircraftFactory.animate(this.player, dt, this.boost ? 1.5 : 1.0);
        if (this.boost) {
            this.boostTimer += dt;
            if (this.boostTimer > 5) {
                this.boost = false;
                this.boostTimer = 0;
            }
        }

        // 引擎音效
        AudioMgr.setEngineSpeed(this.boost ? 1.5 : 1.0);

        // 摄像机跟随
        this._updateCamera(dt);

        // 云朵缓慢漂移
        if (this.clouds) {
            this.clouds.forEach(c => {
                c.position.z += dt * 2;
                if (c.position.z > 50) c.position.z -= 350;
            });
        }

        HUD.update(dt);
    },

    _updatePlayer(dt) {
        // 控制输入 - 收集原始方向
        let inputX = 0, inputY = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) inputY += 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) inputY -= 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;
        if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
            this.boost = true;
            this.boostTimer = 0;
        }

        // 鼠标移动幅度（限制在合理范围，避免过度偏离）
        const mx = Utils.clamp(this.mouseX, -1, 1) * 0.6;
        const my = Utils.clamp(this.mouseY, -1, 1) * 0.6;

        // 计算目标位置（不是叠加速度，而是绝对目标）
        const rangeX = 28;
        const rangeY = 16;
        // 基础位置 0,0 + 键盘/鼠标输入
        const targetX = (inputX + mx) * rangeX / 1.6;
        const targetY = (inputY + my) * rangeY / 1.6;
        // 用插值平滑移动到目标，避免突变
        const lerpRate = Utils.clamp(dt * 6, 0, 1);
        this.player.position.x = Utils.lerp(this.player.position.x, targetX, lerpRate);
        this.player.position.y = Utils.lerp(this.player.position.y, targetY, lerpRate);
        // 限制范围
        this.player.position.x = Utils.clamp(this.player.position.x, -rangeX, rangeX);
        this.player.position.y = Utils.clamp(this.player.position.y, -rangeY + 2, rangeY);

        // 飞机姿态：基于实际速度（位移差）
        const velX = (targetX - this.player.position.x);
        const velY = (targetY - this.player.position.y);
        const targetRoll = -velX * 0.04;
        const targetPitch = -velY * 0.04;
        this.player.rotation.z = Utils.lerp(this.player.rotation.z, targetRoll, 0.15);
        this.player.rotation.x = Utils.lerp(this.player.rotation.x, targetPitch, 0.15);
        // Yaw 朝向飞行方向
        this.player.rotation.y = Utils.lerp(this.player.rotation.y, this.mouseX * 0.2, 0.1);

        // 无敌时间
        if (this.playerInvuln > 0) {
            this.playerInvuln -= dt;
            this.player.visible = Math.sin(performance.now() * 0.03) > 0;
        } else {
            this.player.visible = true;
        }

        // 护盾和双倍伤害视觉效果
        this.shieldVisual.visible = PowerupMgr.isActive('shield');
        if (this.shieldVisual.visible) {
            const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.1;
            this.shieldVisual.scale.setScalar(pulse);
        }
        this.damageVisual.visible = PowerupMgr.isActive('damage');
        if (this.damageVisual.visible) {
            this.damageVisual.rotation.z += dt * 2;
            const t = performance.now() * 0.005;
            this.damageVisual.children.forEach((ring, i) => {
                ring.scale.setScalar(1 + Math.sin(t + i) * 0.1);
            });
        }
    },

    _updateCamera(dt) {
        // 第三人称跟随 - 摄像机跟随玩家
        const targetX = this.player.position.x * 0.4;
        const targetY = this.player.position.y * 0.4 + 2.5;
        const targetZ = this.player.position.z + 6;

        this.camera.position.x = Utils.lerp(this.camera.position.x, targetX, 0.15);
        this.camera.position.y = Utils.lerp(this.camera.position.y, targetY, 0.15);
        this.camera.position.z = Utils.lerp(this.camera.position.z, targetZ, 0.15);

        // 看向玩家前方 (不直接看玩家，而是在玩家前下方一些)
        const lookX = this.player.position.x * 0.2;
        const lookY = this.player.position.y * 0.2 - 3;
        const lookZ = this.player.position.z - 25;
        this.camera.lookAt(lookX, lookY, lookZ);
    },

    _handleShooting(dt) {
        this.fireTimer -= dt;
        // 鼠标按住 / Q / Space / E
        if ((this.mouseDown || this.keys['KeyQ'] || this.keys['KeyE'] || this.keys['Space']) && this.fireTimer <= 0) {
            this._fireBullets();
            this.fireTimer = this.fireRate;
        }
    },

    _fireBullets() {
        // 玩家在 +Z 方向飞行，敌机在 -Z 方向；子弹朝 -Z 飞
        const dir = new THREE.Vector3(0, 0, -1);
        // 双管
        const dmg = PowerupMgr.isActive('damage') ? 2 : 1;
        BulletMgr.spawnPlayerBullet(
            new THREE.Vector3(this.player.position.x + 0.6, this.player.position.y - 0.2, this.player.position.z - 1.5),
            dir,
            dmg
        );
        BulletMgr.spawnPlayerBullet(
            new THREE.Vector3(this.player.position.x - 0.6, this.player.position.y - 0.2, this.player.position.z - 1.5),
            dir,
            dmg
        );
    },

    _handleCollisions() {
        // 玩家子弹 -> 敌机
        const playerBullets = BulletMgr.getPlayerBullets();
        const hits = EnemyMgr.checkHit(playerBullets);
        hits.forEach(h => {
            // 移除子弹
            const bIdx = BulletMgr.bullets.indexOf(h.bullet);
            if (bIdx >= 0) {
                BulletMgr.bullets.splice(bIdx, 1);
                this.scene.remove(h.bullet.mesh);
                Utils.disposeMesh(h.bullet.mesh);
                if (h.bullet.trail) this.scene.remove(h.bullet.trail);
            }
            // 火花
            ExplosionMgr.spawnSpark(h.enemy.mesh.position.clone(), 0xffaa00);

            if (h.killed) {
                this._onEnemyKilled(h.enemy);
                const ei = EnemyMgr.enemies.indexOf(h.enemy);
                if (ei >= 0) EnemyMgr.removeEnemy(ei);
            } else {
                // BOSS 显示血量
                if (h.enemy.type === 'boss') {
                    HUD.setBossHP((h.enemy.health / h.enemy.maxHealth) * 100);
                }
            }
        });

        // 敌机子弹 -> 玩家
        if (this.playerInvuln <= 0) {
            const enemyBullets = BulletMgr.getEnemyBullets();
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                const b = enemyBullets[i];
                if (Utils.distance(b.mesh.position, this.player.position) < 0.8) {
                    this._takeDamage(b.damage);
                    BulletMgr.bullets.splice(BulletMgr.bullets.indexOf(b), 1);
                    this.scene.remove(b.mesh);
                    Utils.disposeMesh(b.mesh);
                    if (b.trail) this.scene.remove(b.trail);
                    ExplosionMgr.spawnSpark(this.player.position.clone(), 0xff4444);
                    break;
                }
            }
        }

        // 敌机 -> 玩家 (撞击)
        if (this.playerInvuln <= 0) {
            for (let i = EnemyMgr.enemies.length - 1; i >= 0; i--) {
                const e = EnemyMgr.enemies[i];
                if (Utils.distance(e.mesh.position, this.player.position) < (e.type === 'bomber' ? 2.5 : e.type === 'boss' ? 4 : 1.5)) {
                    this._takeDamage(30);
                    ExplosionMgr.spawn(this.player.position.clone(), 1, false);
                    // 撞击双方都受伤
                    e.health -= 5;
                    if (e.health <= 0) {
                        this._onEnemyKilled(e);
                        EnemyMgr.removeEnemy(i);
                    }
                    break;
                }
            }
        }
    },

    _onEnemyKilled(e) {
        this.kills++;
        // 连击
        const now = performance.now() / 1000;
        if (now - this.lastKillTime < 2.0) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        this.lastKillTime = now;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        // 计分 (连击加成)
        const baseScore = e.score;
        const comboBonus = this.combo > 1 ? (this.combo - 1) * 50 : 0;
        const total = baseScore + comboBonus;
        this.score += total;

        HUD.setScore(this.score);
        HUD.setCombo(this.combo);

        if (this.combo > 1) {
            HUD.showMessage(`连击 x${this.combo}  +${total}`, 1.0);
        }

        // 爆炸特效
        const isBig = e.type === 'boss' || e.type === 'bomber';
        ExplosionMgr.spawn(e.mesh.position.clone(), isBig ? 2.5 : 1.2, isBig);

        // 道具掉落
        PowerupMgr.tryDrop(e.mesh.position.clone(), e.type);

        // BOSS 死亡
        if (e.type === 'boss') {
            // 多重爆炸
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (this.state === 'playing') {
                        ExplosionMgr.spawn(
                            e.mesh.position.clone().add(new THREE.Vector3(Utils.rand(-2, 2), Utils.rand(-1, 1), Utils.rand(-2, 2))),
                            2, true
                        );
                    }
                }, i * 200);
            }
            HUD.setBossHP(null);
            HUD.showMessage('★ BOSS 击毁！★', 4);
        }
    },

    _takeDamage(d) {
        this.playerHealth -= d;
        this.playerInvuln = 1.0;
        HUD.setHealth(this.playerHealth);
        HUD.showDamage();
        AudioMgr.playHit();
        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            HUD.setHealth(0);
            ExplosionMgr.spawn(this.player.position.clone(), 2, true);
            // 二次爆炸
            setTimeout(() => {
                if (this.state === 'playing') {
                    ExplosionMgr.spawn(this.player.position.clone().add(new THREE.Vector3(2, 0, 0)), 1.5, true);
                }
            }, 200);
            setTimeout(() => this.endLevel(false), 800);
        }
    },

    render() {
        this.renderer.render(this.scene, this.camera);
    }
};
