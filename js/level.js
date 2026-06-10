// 关卡管理
const LevelMgr = {
    // 关卡配置
    levels: [
        {
            id: 1,
            name: '训练场',
            desc: '学习基本操作，击落所有侦察机',
            duration: 60,
            skyColor: 0x87ceeb,
            fogColor: 0xb0d8e8,
            fogNear: 60,
            fogFar: 200,
            groundColor: 0x335533,
            waves: [
                { type: 'scout', count: 5, delay: 2, interval: 2.0, x: 0, y: 2, z: -100, behavior: 'straight', score: 100 },
                { type: 'scout', count: 4, delay: 12, interval: 1.5, behavior: 'sine', y: 4, score: 100 },
                { type: 'fighter', count: 3, delay: 25, interval: 3.0, behavior: 'straight', y: 3, score: 200 },
                { type: 'scout', count: 6, delay: 40, interval: 1.0, behavior: 'sine', y: 5, score: 100 },
                { type: 'fighter', count: 4, delay: 50, interval: 1.5, behavior: 'circle', y: 4, score: 200 }
            ]
        },
        {
            id: 2,
            name: '峡谷风暴',
            desc: '穿越峡谷，迎战战斗机编队',
            duration: 75,
            skyColor: 0xff9966,
            fogColor: 0xddaa88,
            fogNear: 40,
            fogFar: 180,
            groundColor: 0x664433,
            waves: [
                { type: 'fighter', count: 4, delay: 2, interval: 2.0, behavior: 'straight', score: 200 },
                { type: 'scout', count: 6, delay: 10, interval: 1.0, behavior: 'sine', score: 100 },
                { type: 'fighter', count: 3, delay: 20, interval: 3.0, behavior: 'dive', y: 6, score: 250 },
                { type: 'bomber', count: 2, delay: 30, interval: 8.0, behavior: 'straight', y: 0, score: 500 },
                { type: 'fighter', count: 5, delay: 45, interval: 2.0, behavior: 'circle', score: 200 },
                { type: 'scout', count: 8, delay: 55, interval: 0.8, behavior: 'sine', score: 100 }
            ]
        },
        {
            id: 3,
            name: '云层激战',
            desc: '高空云层激战，敌机更密集',
            duration: 80,
            skyColor: 0xaaccff,
            fogColor: 0xffffff,
            fogNear: 30,
            fogFar: 150,
            groundColor: 0x445566,
            waves: [
                { type: 'fighter', count: 5, delay: 2, interval: 1.5, behavior: 'circle', y: 3, score: 200 },
                { type: 'bomber', count: 3, delay: 15, interval: 6.0, behavior: 'straight', y: -2, score: 500 },
                { type: 'scout', count: 10, delay: 25, interval: 0.5, behavior: 'sine', score: 100 },
                { type: 'fighter', count: 4, delay: 40, interval: 2.0, behavior: 'dive', y: 8, score: 250 },
                { type: 'bomber', count: 3, delay: 55, interval: 5.0, behavior: 'circle', y: 0, score: 500 },
                { type: 'fighter', count: 6, delay: 65, interval: 1.5, behavior: 'circle', score: 200 }
            ]
        },
        {
            id: 4,
            name: '终极BOSS',
            desc: '挑战巨型战机，胜负在此一举',
            duration: 90,
            skyColor: 0x331133,
            fogColor: 0x221122,
            fogNear: 50,
            fogFar: 200,
            groundColor: 0x222222,
            waves: [
                { type: 'fighter', count: 3, delay: 2, interval: 2.0, behavior: 'straight', score: 200 },
                { type: 'scout', count: 4, delay: 10, interval: 1.5, behavior: 'sine', score: 100 },
                { type: 'boss', count: 1, delay: 18, behavior: 'boss', y: 0, z: -40, score: 5000 },
                { type: 'fighter', count: 4, delay: 30, interval: 3.0, behavior: 'circle', score: 200 },
                { type: 'scout', count: 6, delay: 45, interval: 1.0, behavior: 'sine', score: 100 },
                { type: 'bomber', count: 2, delay: 60, interval: 8.0, behavior: 'straight', score: 500 }
            ]
        }
    ],

    current: null,
    currentIndex: 0,
    levelTime: 0,
    isBossSpawned: false,

    /**
     * 加载关卡
     */
    load(index, scene) {
        this.currentIndex = index;
        this.current = this.levels[index];
        this.levelTime = 0;
        this.isBossSpawned = false;

        // 设置场景
        scene.background = new THREE.Color(this.current.skyColor);
        scene.fog = new THREE.Fog(this.current.fogColor, this.current.fogNear, this.current.fogFar);

        // 加载敌机波次
        EnemyMgr.loadWaves(this.current.waves);
    },

    update(dt) {
        this.levelTime += dt;
        // 检测 BOSS 出现
        if (!this.isBossSpawned) {
            const bossWave = this.current.waves.find(w => w.type === 'boss');
            if (bossWave && this.levelTime >= bossWave.delay) {
                this.isBossSpawned = true;
                AudioMgr.playWarning();
                return { bossSpawned: true };
            }
        }
        return null;
    },

    isComplete() {
        return this.levelTime >= this.current.duration;
    }
};
