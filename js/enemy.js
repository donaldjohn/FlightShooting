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
                cfg = { health: 50, maxHealth: 50, score: 5000, fireRate: 0.3, isBoss: true };
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
            lastFire: 0
        }, cfg);
        this.enemies.push(enemy);
    },

    _updateEnemy(e, dt, playerPos, game) {
        e.time += dt;
        AircraftFactory.animate(e.mesh, dt, 1);

        // 行为
        switch (e.behavior) {
            case 'straight':
                e.mesh.position.z += e.speed * dt;
                break;
            case 'sine':
                e.mesh.position.z += e.speed * dt;
                e.mesh.position.x = e.spawnX + Math.sin(e.time * 1.5) * 6;
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
                e.mesh.position.x = Math.cos(e.time * 1.0 + e.spawnX) * 8;
                e.mesh.position.y = e.spawnY + Math.sin(e.time * 1.5) * 3;
                break;
            case 'orbit':
                e.mesh.position.z += e.speed * 0.3 * dt;
                e.mesh.position.x = Math.cos(e.time * 1.2) * 10;
                e.mesh.position.y = 5 + Math.sin(e.time * 0.8) * 4;
                break;
            case 'boss':
                this._updateBoss(e, dt, playerPos, game);
                return;
            default:
                e.mesh.position.z += e.speed * dt;
        }

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
        // BOSS 移动模式
        e.mesh.position.z = -40 + Math.sin(e.time * 0.3) * 5;
        e.mesh.position.x = Math.sin(e.time * 0.5) * 8;
        e.mesh.position.y = Math.cos(e.time * 0.4) * 4;
        e.mesh.lookAt(playerPos);

        // 多方向射击
        if (e.time - e.lastFire > e.fireRate) {
            this._fireBoss(e, playerPos);
            e.lastFire = e.time;
        }
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
        // 中心三发
        BulletMgr.spawnEnemyBullet(pos, centerDir, { speed: 30, damage: 15, color: 0xffaa00 });

        // 散射
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dir = new THREE.Vector3(
                Math.cos(angle) * 0.6,
                Math.sin(angle) * 0.6,
                0.7
            ).normalize();
            BulletMgr.spawnEnemyBullet(pos, dir, { speed: 22, damage: 10, color: 0xff3333 });
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
        this.enemies.splice(idx, 1);
        return e;
    }
};
