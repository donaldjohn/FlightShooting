// 飞行器3D模型 - 玩家飞机 & 敌机
const AircraftFactory = {
    /**
     * 创建玩家战斗机 - F22风格
     */
    createPlayer() {
        const group = new THREE.Group();
        group.userData.type = 'player';

        // 主体材质
        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0x3a4a5c,
            shininess: 80,
            specular: 0x556677
        });
        const darkMat = new THREE.MeshPhongMaterial({
            color: 0x1a1f2a,
            shininess: 60
        });
        const cockpitMat = new THREE.MeshPhongMaterial({
            color: 0x111122,
            shininess: 200,
            transparent: true,
            opacity: 0.7,
            emissive: 0x223344,
            emissiveIntensity: 0.3
        });
        const accentMat = new THREE.MeshPhongMaterial({
            color: 0xff3344,
            emissive: 0x441111,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        // 主机身 (锥形)
        const fuselage = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 3.2, 8),
            bodyMat
        );
        fuselage.rotation.x = -Math.PI / 2; // 沿 +Z 方向
        group.add(fuselage);

        // 机首尖锥
        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(0.15, 0.8, 8),
            darkMat
        );
        nose.position.set(0, 0, 1.8);
        nose.rotation.x = -Math.PI / 2;
        group.add(nose);

        // 座舱盖
        const cockpit = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
            cockpitMat
        );
        cockpit.position.set(0, 0.25, 0.6);
        cockpit.scale.set(1, 0.7, 1.5);
        group.add(cockpit);

        // 主翼 (三角翼)
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(2.4, -0.6);
        wingShape.lineTo(2.2, -1.4);
        wingShape.lineTo(0.2, -0.8);
        wingShape.lineTo(0, 0);
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: false });
        const wingMat = new THREE.MeshPhongMaterial({ color: 0x2a3548, shininess: 60 });

        const wingL = new THREE.Mesh(wingGeo, wingMat);
        wingL.position.set(0.2, -0.05, 0.4);
        wingL.rotation.y = Math.PI / 2;
        group.add(wingL);

        const wingR = new THREE.Mesh(wingGeo, wingMat);
        wingR.position.set(-0.2, -0.05, 0.4);
        wingR.rotation.y = -Math.PI / 2;
        group.add(wingR);

        // 尾翼 (双V垂尾)
        const tailShape = new THREE.Shape();
        tailShape.moveTo(0, 0);
        tailShape.lineTo(0.05, 0.8);
        tailShape.lineTo(0.7, 0.9);
        tailShape.lineTo(0.7, 0.1);
        tailShape.lineTo(0, 0);
        const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.06, bevelEnabled: false });

        const tailL = new THREE.Mesh(tailGeo, wingMat);
        tailL.position.set(0.05, 0.2, -1.0);
        tailL.rotation.y = Math.PI / 2;
        group.add(tailL);

        const tailR = new THREE.Mesh(tailGeo, wingMat);
        tailR.position.set(-0.05, 0.2, -1.0);
        tailR.rotation.y = -Math.PI / 2;
        group.add(tailR);

        // 水平尾翼
        const hStabGeo = new THREE.BoxGeometry(1.4, 0.05, 0.4);
        const hStab = new THREE.Mesh(hStabGeo, wingMat);
        hStab.position.set(0, 0.05, -1.2);
        group.add(hStab);

        // 引擎喷口
        const nozzleGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.5, 12);
        const nozzleMat = new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 100 });
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.position.set(0, 0, -1.7);
        nozzle.rotation.x = Math.PI / 2;
        group.add(nozzle);

        // 引擎喷火 (动态)
        const flameMat = new THREE.MeshBasicMaterial({
            color: 0xffaa33,
            transparent: true,
            opacity: 0.9
        });
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.18, 1.0, 12),
            flameMat
        );
        flame.position.set(0, 0, -2.3);
        flame.rotation.x = Math.PI / 2;
        flame.userData.isFlame = true;
        group.add(flame);

        // 引擎外焰
        const flame2 = new THREE.Mesh(
            new THREE.ConeGeometry(0.12, 0.7, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.7 })
        );
        flame2.position.set(0, 0, -2.6);
        flame2.rotation.x = Math.PI / 2;
        flame2.userData.isFlame = true;
        group.add(flame2);

        // 翼尖灯
        const lightR = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        lightR.position.set(2.0, -0.1, 0.2);
        group.add(lightR);

        const lightG = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        lightG.position.set(-2.0, -0.1, 0.2);
        group.add(lightG);

        // 机头雷达罩
        const radome = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 8),
            new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 100 })
        );
        radome.position.set(0, 0, 2.1);
        group.add(radome);

        // 武器挂点
        const podMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
        for (let i = 0; i < 2; i++) {
            const pod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8),
                podMat
            );
            pod.position.set(0.7 - i * 1.4, -0.25, 0.0);
            pod.rotation.x = Math.PI / 2;
            group.add(pod);
        }

        // 装饰线条 (红色)
        const stripeGeo = new THREE.BoxGeometry(0.05, 0.05, 2.0);
        const stripeL = new THREE.Mesh(stripeGeo, accentMat);
        stripeL.position.set(0.4, -0.05, 0.4);
        group.add(stripeL);
        const stripeR = new THREE.Mesh(stripeGeo, accentMat);
        stripeR.position.set(-0.4, -0.05, 0.4);
        group.add(stripeR);

        // 阴影投射
        group.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = false;
            }
        });

        return group;
    },

    /**
     * 创建敌机 - 侦察机（小、快、低血量）
     */
    createScout() {
        const group = new THREE.Group();
        group.userData.type = 'scout';

        const mat = new THREE.MeshPhongMaterial({ color: 0x882222, shininess: 40 });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x441111, shininess: 30 });

        // 机身
        const body = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 1.8, 6),
            mat
        );
        body.rotation.x = -Math.PI / 2;
        group.add(body);

        // 机翼
        const wing = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.04, 0.5),
            mat
        );
        wing.position.set(0, -0.05, -0.1);
        group.add(wing);

        // 尾翼
        const tail = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.04, 0.3),
            mat
        );
        tail.position.set(0, 0.15, -0.8);
        group.add(tail);

        const vTail = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.5, 0.3),
            mat
        );
        vTail.position.set(0, 0.3, -0.8);
        group.add(vTail);

        // 引擎
        const nozzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.22, 0.3, 8),
            darkMat
        );
        nozzle.position.set(0, 0, -1.0);
        nozzle.rotation.x = Math.PI / 2;
        group.add(nozzle);

        // 喷火
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.12, 0.5, 8),
            new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.8 })
        );
        flame.position.set(0, 0, -1.35);
        flame.rotation.x = Math.PI / 2;
        flame.userData.isFlame = true;
        group.add(flame);

        return group;
    },

    /**
     * 创建敌机 - 战斗机（中、攻击型）
     */
    createFighter() {
        const group = new THREE.Group();
        group.userData.type = 'fighter';

        const mat = new THREE.MeshPhongMaterial({ color: 0x225522, shininess: 50 });
        const accentMat = new THREE.MeshPhongMaterial({ color: 0x336633, shininess: 80 });

        // 机身
        const body = new THREE.Mesh(
            new THREE.ConeGeometry(0.35, 2.4, 8),
            mat
        );
        body.rotation.x = -Math.PI / 2;
        group.add(body);

        // 主翼 (后掠)
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(1.6, -0.4);
        wingShape.lineTo(1.5, -0.9);
        wingShape.lineTo(0.1, -0.6);
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.06, bevelEnabled: false });

        const wingL = new THREE.Mesh(wingGeo, mat);
        wingL.position.set(0.15, -0.05, 0.3);
        wingL.rotation.y = Math.PI / 2;
        group.add(wingL);

        const wingR = new THREE.Mesh(wingGeo, mat);
        wingR.position.set(-0.15, -0.05, 0.3);
        wingR.rotation.y = -Math.PI / 2;
        group.add(wingR);

        // 尾翼
        const vTail = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.6, 0.3),
            accentMat
        );
        vTail.position.set(0, 0.35, -1.0);
        group.add(vTail);

        const hStab = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.05, 0.3),
            mat
        );
        hStab.position.set(0, 0.05, -1.1);
        group.add(hStab);

        // 引擎
        const nozzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.26, 0.4, 10),
            new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 80 })
        );
        nozzle.position.set(0, 0, -1.4);
        nozzle.rotation.x = Math.PI / 2;
        group.add(nozzle);

        // 喷火
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.14, 0.6, 10),
            new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.8 })
        );
        flame.position.set(0, 0, -1.8);
        flame.rotation.x = Math.PI / 2;
        flame.userData.isFlame = true;
        group.add(flame);

        return group;
    },

    /**
     * 创建敌机 - 轰炸机（大、慢、高血量）
     */
    createBomber() {
        const group = new THREE.Group();
        group.userData.type = 'bomber';

        const mat = new THREE.MeshPhongMaterial({ color: 0x553333, shininess: 30 });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x2a1a1a, shininess: 20 });

        // 机身
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 3.5, 10),
            mat
        );
        body.rotation.x = Math.PI / 2;
        group.add(body);

        // 机头
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 10, 8),
            mat
        );
        nose.position.set(0, 0, 1.75);
        group.add(nose);

        // 大型主翼
        const wing = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 0.08, 1.0),
            mat
        );
        wing.position.set(0, -0.1, 0.0);
        group.add(wing);

        // 翼尖引擎舱
        for (let s of [-1, 1]) {
            const pod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.18, 0.6, 8),
                darkMat
            );
            pod.position.set(s * 1.5, -0.1, 0.0);
            pod.rotation.x = Math.PI / 2;
            group.add(pod);

            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.13, 0.6, 8),
                new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.8 })
            );
            flame.position.set(s * 1.5, -0.1, -0.4);
            flame.rotation.x = Math.PI / 2;
            flame.userData.isFlame = true;
            group.add(flame);
        }

        // 尾翼
        const vTail = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.9, 0.5),
            mat
        );
        vTail.position.set(0, 0.45, -1.5);
        group.add(vTail);

        const hStab = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.06, 0.4),
            mat
        );
        hStab.position.set(0, 0.1, -1.6);
        group.add(hStab);

        // 装饰红色
        const accent = new THREE.Mesh(
            new THREE.TorusGeometry(0.35, 0.04, 6, 16),
            new THREE.MeshPhongMaterial({ color: 0xcc3333, emissive: 0x551111, emissiveIntensity: 0.5 })
        );
        accent.position.set(0, 0, 1.75);
        accent.rotation.y = Math.PI / 2;
        group.add(accent);

        return group;
    },

    /**
     * 创建BOSS - 重型战机（巨型，多武器）
     */
    createBoss() {
        const group = new THREE.Group();
        group.userData.type = 'boss';

        const mat = new THREE.MeshPhongMaterial({ color: 0x442222, shininess: 100, specular: 0xaa3333 });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x220000, shininess: 80 });
        const glowMat = new THREE.MeshPhongMaterial({
            color: 0xff3333,
            emissive: 0xff0000,
            emissiveIntensity: 1.5,
            shininess: 200
        });

        // 主体 - 巨大菱形
        const body = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 8, 8),
            mat
        );
        body.rotation.x = -Math.PI / 2;
        group.add(body);

        // 副体
        const subBody = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 4, 6),
            mat
        );
        subBody.position.set(0, 0, -1);
        subBody.rotation.x = -Math.PI / 2;
        group.add(subBody);

        // 巨型机翼
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(5, -1);
        wingShape.lineTo(4.5, -2.5);
        wingShape.lineTo(0.3, -1.5);
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.2, bevelEnabled: false });

        const wingL = new THREE.Mesh(wingGeo, mat);
        wingL.position.set(0.5, -0.1, 1.0);
        wingL.rotation.y = Math.PI / 2;
        group.add(wingL);

        const wingR = new THREE.Mesh(wingGeo, mat);
        wingR.position.set(-0.5, -0.1, 1.0);
        wingR.rotation.y = -Math.PI / 2;
        group.add(wingR);

        // 尾翼
        const tailL = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 1.8, 1.0),
            mat
        );
        tailL.position.set(0.3, 0.5, -2.8);
        group.add(tailL);
        const tailR = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 1.8, 1.0),
            mat
        );
        tailR.position.set(-0.3, 0.5, -2.8);
        group.add(tailR);

        // 多引擎
        for (let s of [-1, 1]) {
            for (let z of [-1, 1]) {
                const nozzle = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.35, 0.45, 1.0, 12),
                    darkMat
                );
                nozzle.position.set(s * 1.8, -0.05, z * 1.5);
                nozzle.rotation.x = Math.PI / 2;
                group.add(nozzle);

                const flame = new THREE.Mesh(
                    new THREE.ConeGeometry(0.3, 1.4, 12),
                    new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.9 })
                );
                flame.position.set(s * 1.8, -0.05, z * 1.5 - 1.2);
                flame.rotation.x = Math.PI / 2;
                flame.userData.isFlame = true;
                group.add(flame);
            }
        }

        // 核心能量球 (会脉动)
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            glowMat
        );
        core.position.set(0, 0, 1);
        core.userData.isCore = true;
        group.add(core);

        // 武器炮塔
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const turret = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8),
                darkMat
            );
            turret.position.set(Math.cos(angle) * 1.5, -0.15, Math.sin(angle) * 1.5 + 0.5);
            turret.rotation.x = Math.PI / 2;
            group.add(turret);
        }

        // 红色装饰灯
        for (let i = 0; i < 8; i++) {
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                glowMat
            );
            const a = (i / 8) * Math.PI * 2;
            light.position.set(Math.cos(a) * 4.0, 0, Math.sin(a) * 4.0 + 0.5);
            group.add(light);
        }

        return group;
    },

    /**
     * 动画所有飞行器：引擎喷火抖动、姿态插值
     */
    animate(aircraft, dt, speed = 1) {
        // 喷火抖动
        aircraft.traverse(obj => {
            if (obj.userData.isFlame) {
                obj.scale.z = Utils.lerp(obj.scale.z, 0.7 + Math.random() * 0.6, 0.5);
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.opacity = Utils.lerp(obj.material.opacity, 0.6 + Math.random() * 0.4, 0.5);
                }
            }
            if (obj.userData.isCore) {
                obj.scale.setScalar(0.9 + Math.sin(performance.now() * 0.005) * 0.2);
            }
        });
    }
};
