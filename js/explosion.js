// 爆炸特效系统
const ExplosionMgr = {
    explosions: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.explosions = [];
    },

    reset() {
        this.explosions.forEach(ex => this._disposeExplosion(ex));
        this.explosions = [];
    },

    _disposeExplosion(ex) {
        ex.particles.forEach(p => {
            this.scene.remove(p.mesh);
            Utils.disposeMesh(p.mesh);
        });
        if (ex.light) {
            this.scene.remove(ex.light);
        }
        if (ex.shockwave) {
            this.scene.remove(ex.shockwave);
            Utils.disposeMesh(ex.shockwave);
        }
    },

    /**
     * 创建爆炸 - 粒子+冲击波+闪光
     */
    spawn(pos, size = 1, isBig = false) {
        const particleCount = isBig ? 80 : 30;
        const particles = [];
        const colors = isBig
            ? [0xffaa00, 0xff4400, 0xffdd44, 0xffffff, 0xff0000]
            : [0xff8800, 0xffdd44, 0xffffff];

        for (let i = 0; i < particleCount; i++) {
            const color = colors[Utils.randInt(0, colors.length - 1)];
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            const geo = new THREE.SphereGeometry(Utils.rand(0.05, 0.2) * size, 6, 6);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);

            // 随机方向
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = Utils.rand(8, 20) * size;
            const vel = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            ).multiplyScalar(speed);

            this.scene.add(mesh);
            particles.push({ mesh, vel, life: Utils.rand(0.6, 1.2) * size, maxLife: 0 });
        }
        particles.forEach(p => p.maxLife = p.life);

        // 闪光
        const light = new THREE.PointLight(0xffaa44, isBig ? 8 : 3, isBig ? 30 : 15);
        light.position.copy(pos);
        this.scene.add(light);

        // 冲击波 (环)
        let shockwave = null;
        if (isBig) {
            const swGeo = new THREE.RingGeometry(0.1, 0.5, 32);
            const swMat = new THREE.MeshBasicMaterial({
                color: 0xffdd66,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            shockwave = new THREE.Mesh(swGeo, swMat);
            shockwave.position.copy(pos);
            // 让它面向摄像机
            shockwave.lookAt(0, 0, 100);
            this.scene.add(shockwave);
        }

        this.explosions.push({
            particles,
            light,
            shockwave,
            time: 0,
            size,
            isBig
        });

        AudioMgr.playExplosion(size);
    },

    /**
     * 小型火花 (子弹击中敌机)
     */
    spawnSpark(pos, color = 0xffaa00) {
        for (let i = 0; i < 6; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            const geo = new THREE.SphereGeometry(0.06, 4, 4);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = Utils.rand(3, 8);
            const vel = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            ).multiplyScalar(speed);

            this.scene.add(mesh);
            this.explosions.push({
                particles: [{ mesh, vel, life: 0.3, maxLife: 0.3 }],
                light: null,
                shockwave: null,
                time: 0,
                size: 0.3,
                isBig: false,
                isSpark: true
            });
            this.explosions[this.explosions.length - 1].particles.forEach(p => p.maxLife = p.life);
        }
    },

    update(dt) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const ex = this.explosions[i];
            ex.time += dt;

            // 粒子
            for (let j = ex.particles.length - 1; j >= 0; j--) {
                const p = ex.particles[j];
                p.life -= dt;
                if (p.life <= 0) {
                    this.scene.remove(p.mesh);
                    Utils.disposeMesh(p.mesh);
                    ex.particles.splice(j, 1);
                    continue;
                }
                p.mesh.position.addScaledVector(p.vel, dt);
                p.vel.multiplyScalar(0.96); // 阻力
                p.vel.y -= 5 * dt; // 重力
                p.mesh.material.opacity = p.life / p.maxLife;
                p.mesh.scale.setScalar(p.life / p.maxLife);
            }

            // 闪光衰减
            if (ex.light) {
                ex.light.intensity = (ex.isBig ? 8 : 3) * Math.max(0, 1 - ex.time / 0.5);
            }

            // 冲击波
            if (ex.shockwave) {
                const t = ex.time / 1.0;
                ex.shockwave.scale.setScalar(1 + t * 12);
                ex.shockwave.material.opacity = Math.max(0, 0.8 - t);
            }

            // 全部消失
            if (ex.particles.length === 0) {
                this._disposeExplosion(ex);
                this.explosions.splice(i, 1);
            }
        }
    }
};
