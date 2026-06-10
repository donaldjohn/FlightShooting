// 道具系统
const PowerupMgr = {
    items: [], // 场景中的道具
    activeEffects: {}, // 玩家激活的效果
    scene: null,

    init(scene) {
        this.scene = scene;
        this.items = [];
        this.activeEffects = {};
    },

    reset() {
        this.items.forEach(item => {
            this.scene.remove(item.mesh);
            Utils.disposeMesh(item.mesh);
        });
        this.items = [];
        this.activeEffects = {};
    },

    /**
     * 敌机被击毁时尝试掉落道具
     */
    tryDrop(pos, enemyType) {
        // BOSS 必掉大血包
        if (enemyType === 'boss') {
            this.spawn(pos.clone(), 'health', 2);
            this.spawn(pos.clone().add(new THREE.Vector3(3, 0, 0)), 'damage', 2);
            this.spawn(pos.clone().add(new THREE.Vector3(-3, 0, 0)), 'shield', 2);
            return;
        }
        // 普通敌机 25% 概率掉落
        if (Math.random() > 0.25) return;
        // 按敌机类型决定掉落倾向
        const r = Math.random();
        if (enemyType === 'bomber' && r < 0.5) {
            this.spawn(pos.clone(), 'health', 2);
        } else if (r < 0.4) {
            this.spawn(pos.clone(), 'health', 1);
        } else if (r < 0.7) {
            this.spawn(pos.clone(), 'damage', 1);
        } else {
            this.spawn(pos.clone(), 'shield', 1);
        }
    },

    /**
     * 生成道具
     */
    spawn(pos, type, size = 1) {
        const mesh = this._createMesh(type, size);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.items.push({
            mesh,
            type,
            time: 0,
            life: 15 // 15秒后消失
        });
    },

    _createMesh(type, size = 1) {
        const group = new THREE.Group();
        const s = 0.4 * size;
        const colors = {
            health: 0x51cf66,  // 绿色
            damage: 0xffd43b,  // 金色
            shield: 0x4dabf7   // 蓝色
        };
        const color = colors[type] || 0xffffff;

        // 主体立方体
        const core = new THREE.Mesh(
            new THREE.BoxGeometry(s, s, s),
            new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                shininess: 200
            })
        );
        group.add(core);

        // 光晕
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(s * 0.9, 12, 12),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            })
        );
        group.add(halo);

        // 文字标识（用不同形状）
        let icon;
        if (type === 'health') {
            // 十字
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            icon = new THREE.Group();
            icon.add(new THREE.Mesh(new THREE.BoxGeometry(s * 0.15, s * 0.6, s * 0.15), mat));
            icon.add(new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.15, s * 0.15), mat));
        } else if (type === 'damage') {
            // 双箭头
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            icon = new THREE.Group();
            for (let i = 0; i < 2; i++) {
                const arr = new THREE.Mesh(new THREE.ConeGeometry(s * 0.15, s * 0.3, 4), mat);
                arr.position.set(0, (i === 0 ? s * 0.25 : -s * 0.25), 0);
                arr.rotation.x = Math.PI;
                icon.add(arr);
            }
        } else {
            // 护盾
            icon = new THREE.Mesh(
                new THREE.SphereGeometry(s * 0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
            );
        }
        group.add(icon);

        // 点光源
        const light = new THREE.PointLight(color, 1.5, 5);
        group.add(light);

        return group;
    },

    update(dt, playerPos, onPickup) {
        // 更新场景中的道具
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.time += dt;
            item.life -= dt;
            // 飘向玩家 (近距离时吸引)
            const dist = Utils.distance(item.mesh.position, playerPos);
            if (dist < 8) {
                const dir = new THREE.Vector3().subVectors(playerPos, item.mesh.position).normalize();
                item.mesh.position.addScaledVector(dir, 20 * dt);
            } else {
                item.mesh.position.z += 8 * dt; // 缓慢漂移
            }
            // 旋转
            item.mesh.rotation.y += dt * 2;
            item.mesh.rotation.x += dt;

            // 闪烁 (快消失)
            if (item.life < 3) {
                item.mesh.visible = Math.sin(item.time * 10) > 0;
            }

            // 拾取检测
            if (dist < 1.5) {
                onPickup(item.type);
                this.scene.remove(item.mesh);
                Utils.disposeMesh(item.mesh);
                this.items.splice(i, 1);
                continue;
            }
            // 超时
            if (item.life <= 0) {
                this.scene.remove(item.mesh);
                Utils.disposeMesh(item.mesh);
                this.items.splice(i, 1);
            }
        }

        // 更新激活效果
        for (const key in this.activeEffects) {
            this.activeEffects[key] -= dt;
            if (this.activeEffects[key] <= 0) {
                delete this.activeEffects[key];
            }
        }
    },

    /**
     * 应用道具效果
     */
    applyEffect(type) {
        switch (type) {
            case 'health':
                Game.playerHealth = Math.min(Game.playerMaxHealth, Game.playerHealth + 30);
                HUD.setHealth(Game.playerHealth);
                HUD.showMessage('+ 30 生命值', 1.5);
                break;
            case 'damage':
                this.activeEffects.damage = 10;
                HUD.showMessage('⚡ 双倍伤害 10秒', 1.5);
                break;
            case 'shield':
                this.activeEffects.shield = 5;
                Game.playerInvuln = 5;
                HUD.showMessage('🛡 护盾 5秒', 1.5);
                break;
        }
        AudioMgr.playPowerup();
    },

    isActive(type) {
        return this.activeEffects[type] > 0;
    },

    getActiveEffects() {
        const list = [];
        if (this.activeEffects.damage > 0) list.push({ type: 'damage', time: this.activeEffects.damage });
        if (this.activeEffects.shield > 0) list.push({ type: 'shield', time: this.activeEffects.shield });
        return list;
    }
};
