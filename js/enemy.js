// 敌机管理
const EnemyMgr = {
    enemies: [],
    scene: null,
    spawnQueue: [],
    spawnTimer: 0,
    maxAlive: 6,

    init(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnQueue = [];
        this.spawnTimer = 0;
    },

    reset() {
        this.enemies.forEach(e => {
            this.scene.remove(e.mesh);
            this._disposeEnemy(e);
        });
        this.enemies = [];
        this.spawnQueue = [];
        this.spawnTimer = 0;
    },

    _disposeEnemy(e) {
        e.mesh.traverse(obj => {
            if (obj.isMesh) Utils.disposeMesh(obj);
        });
    },

    /**
     * 加载关卡敌机配置
     */
    loadWaves(waves) {
        this.spawnQueue = [];
        waves.forEach(w => {
            for (let i = 0; i < w.count; i++) {
                this.spawnQueue.push({
                    type: w.type,
                    delay: w.delay + i * (w.interval || 1.0),
                    x: w.x !== undefined ? w.x : Utils.rand(-25, 25),
                    y: w.y !== undefined ? w.y : Utils.rand(-8, 12),
                    z: w.z !== undefined ? w.z : -120,
                    speed: w.speed,
                    behavior: w.behavior || 'straight',
                    health: w.health,
                    score: w.score,
                    pattern: w.pattern
                });
            }
        });
        this.spawnQueue.sort((a, b) => a.delay - b.delay);
    },

    update(dt, levelTime, playerPos, game) {
        // 生成
        while (this.spawnQueue.length > 0 && this.spawnQueue[0].delay <= levelTime && this.enemies.length < this.maxAlive) {
            const spec = this.spawnQueue.shift();
            this._spawn(spec);
        }

        // 更新
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            this._updateEnemy(e, dt, playerPos, game);
            // 离开场景
            if (e.mesh.position.z > 30) {
                this.scene.remove(e.mesh);
                this._disposeEnemy(e);
                this.enemies.splice(i, 1);
            }
        }
    },

    /**
     * 检查附近玩家子弹，决定是否闪避
     */
    _checkDodge(e, playerPos) {
        // 只有 fighter/bomber 会闪避
        if (e.type !== 'fighter' && e.type !== 'bomber') return 0;
        if (e.dodgeCooldown > 0) return e.dodgeDir;

        // 找最近的玩家子弹
        const bullets = BulletMgr.getPlayerBullets();
        let nearest = null;
        let nearestDist = 8; // 8 单位内才算威胁
        for (const b of bullets) {
            const dz = b.mesh.position.z - e.mesh.position.z;
            if (dz < 0 || dz > 15) continue; // 子弹要在前方
            const dx = b.mesh.position.x - e.mesh.position.x;
            const dy = b.mesh.position.y - e.mesh.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = b;
            }
        }
        if (!nearest) return 0;

        // 计算闪避方向 (远离子弹的水平方向)
        const dx = e.mesh.position.x - nearest.mesh.position.x;
        const dodge = Math.sign(dx) * 8; // 8 单位/秒
        e.dodgeCooldown = 0.5; // 0.5秒内持续闪避
        e.dodgeDir = dodge;
        return dodge;
    },

    _spawn(spec) {
        let mesh;
        let cfg;
        switch (spec.type) {
            case 'scout':
                mesh = AircraftFactory.createScout();
                cfg = { health: 1, maxHealth: 1, score: 100, fireRate: 2.0 };
                break;
            case 'fighter':
                mesh = AircraftFactory.createFighter();
                cfg = { health: 3, maxHealth: 3, score: 200, fireRate: 1.5 };
                break;
            case 'bomber':
                mesh = AircraftFactory.createBomber();
                cfg = { health: 8, maxHealth: 8, score: 500, fireRate: 1.0 };
                break;
            case 'boss':
                mesh = AircraftFactory.createBoss();
                cfg = { health: 100, maxHealth: 100, score: 5000, fireRate: 0.4, isBoss: true, phase: 1 };
                break;
            default:
                return;
        }

        mesh.position.set(spec.x, spec.y, spec.z);
        // 初始朝向玩家
        mesh.lookAt(0, 0, 0);

        this.scene.add(mesh);

        const enemy = Object.assign({
            mesh,
            type: spec.type,
            spawnZ: spec.z,
            spawnX: spec.x,
            spawnY: spec.y,
            behavior: spec.behavior,
            speed: spec.speed || (spec.type === 'scout' ? 18 : spec.type === 'fighter' ? 14 : 10),
            pattern: spec.pattern,
            time: 0,
            lastFire: 0,
            dodgeCooldown: 0,
            dodgeDir: 0
        }, cfg);

        // BOSS 添加头顶血条
        if (spec.type === 'boss') {
            const hb = this._createBossHealthBar();
            mesh.add(hb.sprite);
            enemy._healthBar = hb;
            this._updateBossHealthBar(enemy);
        }

        this.enemies.push(enemy);
    },

    _updateEnemy(e, dt, playerPos, game) {
        e.time += dt;
        AircraftFactory.animate(e.mesh, dt, 1);

        // 闪避冷却
        if (e.dodgeCooldown > 0) {
            e.dodgeCooldown -= dt;
            if (e.dodgeCooldown <= 0) {
                e.dodgeCooldown = 0;
                e.dodgeDir = 0;
            }
        }
        // 检查是否需要闪避
        const dodgeForce = this._checkDodge(e, playerPos);

        // 行为
        switch (e.behavior) {
            case 'straight':
                e.mesh.position.z += e.speed * dt;
                e.mesh.position.x += dodgeForce * dt;
                break;
            case 'sine':
                e.mesh.position.z += e.speed * dt;
                e.mesh.position.x = e.spawnX + Math.sin(e.time * 1.5) * 6 + dodgeForce * 0.3;
                break;
            case 'dive':
                if (e.mesh.position.z > -30) {
                    e.mesh.position.z += e.speed * dt;
                } else {
                    // 朝玩家俯冲
                    const dir = new THREE.Vector3().subVectors(playerPos, e.mesh.position).normalize();
                    e.mesh.position.addScaledVector(dir, e.speed * 1.5 * dt);
                    e.mesh.lookAt(playerPos);
                }
                break;
            case 'circle':
                e.mesh.position.z += e.speed * 0.5 * dt;
                e.mesh.position.x = Math.cos(e.time * 1.0 + e.spawnX) * 8 + dodgeForce * 0.3;
                e.mesh.position.y = e.spawnY + Math.sin(e.time * 1.5) * 3;
                break;
            case 'orbit':
                e.mesh.position.z += e.speed * 0.3 * dt;
                e.mesh.position.x = Math.cos(e.time * 1.2) * 10 + dodgeForce * 0.3;
                e.mesh.position.y = 5 + Math.sin(e.time * 0.8) * 4;
                break;
            case 'boss':
                this._updateBoss(e, dt, playerPos, game);
                return;
            default:
                e.mesh.position.z += e.speed * dt;
                e.mesh.position.x += dodgeForce * dt;
        }

        // 限制敌机位置范围
        e.mesh.position.x = Utils.clamp(e.mesh.position.x, -30, 30);
        e.mesh.position.y = Utils.clamp(e.mesh.position.y, -15, 18);

        // 始终朝向飞行方向
        if (e.behavior !== 'dive') {
            e.mesh.rotation.set(0, Math.PI, 0); // 敌机朝 +Z 飞
            // 倾斜
            if (e.behavior === 'sine') {
                e.mesh.rotation.z = Math.cos(e.time * 1.5) * 0.4;
            } else if (e.behavior === 'circle') {
                e.mesh.rotation.z = Math.sin(e.time * 1.0 + e.spawnX) * 0.5;
            }
        }

        // 射击 (玩家进入射程)
        if (e.mesh.position.z > -80 && e.mesh.position.z < 50) {
            if (e.time - e.lastFire > e.fireRate) {
                this._fireAtPlayer(e, playerPos);
                e.lastFire = e.time;
            }
        }
    },

    _updateBoss(e, dt, playerPos, game) {
        // BOSS 阶段 (血量决定)
        const hpPercent = e.health / e.maxHealth;
        if (hpPercent < 0.3 && e.phase < 3) {
            e.phase = 3;
            e.fireRate = 0.2;
            AudioMgr.playWarning();
            HUD.showMessage('⚠ BOSS 狂暴模式！', 2);
        } else if (hpPercent < 0.6 && hpPercent >= 0.3 && e.phase < 2) {
            e.phase = 2;
            e.fireRate = 0.3;
            HUD.showMessage('⚠ BOSS 进入第二阶段', 2);
        }

        // BOSS 移动模式 - 阶段越高移动越快
        const moveSpeed = e.phase === 3 ? 0.8 : e.phase === 2 ? 0.5 : 0.3;
        e.mesh.position.z = -40 + Math.sin(e.time * moveSpeed) * 6;
        e.mesh.position.x = Math.sin(e.time * moveSpeed * 1.5) * 10;
        e.mesh.position.y = Math.cos(e.time * moveSpeed * 1.2) * 5;
        e.mesh.lookAt(playerPos);

        // 更新 3D 头顶血条
        if (e._healthBar) {
            e._healthBar.ctx = e._healthBar.ctx; // ensure ctx
            this._updateBossHealthBar(e);
        }

        // 阶段3 召唤小弟
        if (e.phase === 3 && e.time - (e.lastSummon || 0) > 8) {
            this._spawnMinions(e);
            e.lastSummon = e.time;
        }

        // 多方向射击
        if (e.time - e.lastFire > e.fireRate) {
            this._fireBoss(e, playerPos);
            e.lastFire = e.time;
        }
    },

    _createBossHealthBar() {
        // 头顶血条 (使用 Sprite 始终面向相机)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 32;
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(8, 1, 1);
        sprite.position.set(0, 3, 0);
        return { sprite, canvas, ctx: canvas.getContext('2d'), texture };
    },

    _updateBossHealthBar(e) {
        const hb = e._healthBar;
        if (!hb) return;
        const percent = e.health / e.maxHealth;
        const ctx = hb.ctx;
        const w = 256, h = 32;
        ctx.clearRect(0, 0, w, h);
        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, h);
        // 边框
        ctx.strokeStyle = percent > 0.3 ? '#ffd43b' : '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);
        // 血量
        const fillW = (w - 4) * percent;
        const grad = ctx.createLinearGradient(2, 0, 2 + fillW, 0);
        if (percent > 0.5) {
            grad.addColorStop(0, '#51cf66');
            grad.addColorStop(1, '#94d82d');
        } else if (percent > 0.3) {
            grad.addColorStop(0, '#ffd43b');
            grad.addColorStop(1, '#fab005');
        } else {
            grad.addColorStop(0, '#ff6b6b');
            grad.addColorStop(1, '#c92a2a');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(2, 2, fillW, h - 4);
        hb.texture.needsUpdate = true;
    },

    _spawnMinions(boss) {
        for (let i = 0; i < 3; i++) {
            const pos = boss.mesh.position.clone();
            pos.x += Utils.rand(-5, 5);
            pos.y += Utils.rand(-3, 3);
            pos.z -= 5;
            const mesh = AircraftFactory.createFighter();
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.enemies.push({
                mesh,
                type: 'fighter',
                spawnZ: pos.z,
                spawnX: pos.x,
                spawnY: pos.y,
                behavior: 'straight',
                speed: 16,
                health: 2,
                maxHealth: 2,
                score: 200,
                fireRate: 1.2,
                time: 0,
                lastFire: 0
            });
        }
        HUD.showMessage('⚠ BOSS 召唤战斗机！', 2);
    },

    _fireAtPlayer(e, playerPos) {
        const pos = e.mesh.position.clone();
        const dir = new THREE.Vector3().subVectors(playerPos, pos).normalize();
        // 添加散布
        dir.x += Utils.rand(-0.1, 0.1);
        dir.y += Utils.rand(-0.1, 0.1);
        dir.normalize();
        BulletMgr.spawnEnemyBullet(pos, dir, { speed: 25, damage: 10, color: 0xff4444 });
    },

    _fireBoss(e, playerPos) {
        const pos = e.mesh.position.clone();
        const centerDir = new THREE.Vector3().subVectors(playerPos, pos).normalize();

        // 阶段3 弹幕更密集
        if (e.phase === 3) {
            // 中心三发
            for (let i = -1; i <= 1; i++) {
                const d = centerDir.clone();
                d.x += i * 0.05;
                BulletMgr.spawnEnemyBullet(pos, d, { speed: 32, damage: 15, color: 0xffaa00 });
            }
            // 12 向散射
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const dir = new THREE.Vector3(
                    Math.cos(angle) * 0.7,
                    Math.sin(angle) * 0.7,
                    0.7
                ).normalize();
                BulletMgr.spawnEnemyBullet(pos, dir, { speed: 24, damage: 10, color: 0xff3333 });
            }
        } else if (e.phase === 2) {
            // 中心一发
            BulletMgr.spawnEnemyBullet(pos, centerDir, { speed: 32, damage: 15, color: 0xffaa00 });
            // 8 向散射
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const dir = new THREE.Vector3(
                    Math.cos(angle) * 0.65,
                    Math.sin(angle) * 0.65,
                    0.7
                ).normalize();
                BulletMgr.spawnEnemyBullet(pos, dir, { speed: 23, damage: 10, color: 0xff3333 });
            }
        } else {
            // 阶段1
            BulletMgr.spawnEnemyBullet(pos, centerDir, { speed: 30, damage: 15, color: 0xffaa00 });
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const dir = new THREE.Vector3(
                    Math.cos(angle) * 0.6,
                    Math.sin(angle) * 0.6,
                    0.7
                ).normalize();
                BulletMgr.spawnEnemyBullet(pos, dir, { speed: 22, damage: 10, color: 0xff3333 });
            }
        }
    },

    /**
     * 检测敌机受击
     */
    checkHit(bullets) {
        const hits = [];
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi];
            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const e = this.enemies[ei];
                const d = Utils.distance(b.mesh.position, e.mesh.position);
                const hitRadius = e.type === 'boss' ? 5 : e.type === 'bomber' ? 2.5 : 1.5;
                if (d < hitRadius) {
                    e.health -= b.damage;
                    hits.push({ bullet: b, enemy: e, ei, bi });
                    if (e.health <= 0) {
                        hits[hits.length - 1].killed = true;
                    }
                    break;
                }
            }
        }
        return hits;
    },

    removeEnemy(idx) {
        const e = this.enemies[idx];
        if (!e) return null;
        this.scene.remove(e.mesh);
        this._disposeEnemy(e);
        // 清理 BOSS 血条
        if (e._healthBar) {
            e._healthBar.texture.dispose();
            e._healthBar.sprite.material.dispose();
        }
        this.enemies.splice(idx, 1);
        return e;
    }
};
