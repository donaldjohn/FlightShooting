// 子弹系统 - 玩家子弹 & 敌机子弹
const BulletMgr = {
    bullets: [], // {mesh, dir, speed, life, from, damage, isEnemy}
    scene: null,

    init(scene) {
        this.scene = scene;
    },

    reset() {
        this.bullets.forEach(b => {
            this.scene.remove(b.mesh);
            Utils.disposeMesh(b.mesh);
            if (b.trail) {
                this.scene.remove(b.trail);
            }
        });
        this.bullets = [];
    },

    /**
     * 创建玩家子弹 - 流光弹
     */
    spawnPlayerBullet(pos, dir, damage = 1) {
        const mesh = this._createPlayerBulletMesh();
        if (damage > 1) {
            // 双倍伤害时子弹变大变金
            mesh.scale.set(1.5, 1.5, 1.5);
        }
        mesh.position.copy(pos);
        this.scene.add(mesh);

        // 拖尾粒子
        const trail = this._createTrail(0x88ddff, 0xffffff);
        trail.position.copy(pos);
        this.scene.add(trail);

        this.bullets.push({
            mesh,
            trail,
            dir: dir.clone().normalize(),
            speed: 80,
            life: 2.5,
            from: 'player',
            damage: damage,
            isEnemy: false
        });
        AudioMgr.playShoot();
    },

    /**
     * 创建敌机子弹 - 红色光球
     */
    spawnEnemyBullet(pos, dir, opts = {}) {
        const mesh = this._createEnemyBulletMesh(opts.color || 0xff4444);
        mesh.position.copy(pos);
        this.scene.add(mesh);

        const trail = this._createTrail(opts.color || 0xff4444, 0xffaa88);
        trail.position.copy(pos);
        this.scene.add(trail);

        this.bullets.push({
            mesh,
            trail,
            dir: dir.clone().normalize(),
            speed: opts.speed || 30,
            life: 4.0,
            from: 'enemy',
            damage: opts.damage || 10,
            isEnemy: true
        });
    },

    _createPlayerBulletMesh() {
        const group = new THREE.Group();
        // 弹头 (圆锥)
        const head = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.5, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        head.rotation.x = -Math.PI / 2;
        group.add(head);
        // 弹体光晕
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.6 })
        );
        group.add(glow);
        // 弹尾光柱
        const tail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.03, 0.6, 6),
            new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0.8 })
        );
        tail.position.z = 0.4;
        tail.rotation.x = Math.PI / 2;
        group.add(tail);
        return group;
    },

    _createEnemyBulletMesh(color) {
        const group = new THREE.Group();
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 10, 8),
            new THREE.MeshBasicMaterial({ color: color })
        );
        group.add(head);
        // 内部高亮
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        group.add(core);
        // 外圈光晕
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 8, 8),
            new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.4 })
        );
        group.add(halo);
        return group;
    },

    _createTrail(color, coreColor) {
        const group = new THREE.Group();
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this._getTrailTexture(),
                color: color,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.6
            })
        );
        sprite.scale.set(0.5, 0.5, 0.5);
        group.add(sprite);
        return group;
    },

    _trailTexture: null,
    _getTrailTexture() {
        if (this._trailTexture) return this._trailTexture;
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        this._trailTexture = new THREE.CanvasTexture(canvas);
        return this._trailTexture;
    },

    update(dt) {
        const toRemove = [];
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            b.life -= dt;
            if (b.life <= 0) {
                toRemove.push(i);
                continue;
            }
            const move = b.speed * dt;
            b.mesh.position.addScaledVector(b.dir, move);
            if (b.trail) b.trail.position.copy(b.mesh.position);

            // 距离太远也移除
            if (b.mesh.position.length() > 300) {
                toRemove.push(i);
            }
        }
        // 倒序删除
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const idx = toRemove[i];
            const b = this.bullets[idx];
            this.scene.remove(b.mesh);
            Utils.disposeMesh(b.mesh);
            if (b.trail) this.scene.remove(b.trail);
            this.bullets.splice(idx, 1);
        }
    },

    getEnemyBullets() {
        return this.bullets.filter(b => b.isEnemy);
    },
    getPlayerBullets() {
        return this.bullets.filter(b => !b.isEnemy);
    }
};
