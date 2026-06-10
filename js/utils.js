// 工具函数集
const Utils = {
    // 随机数 [min, max]
    rand(min, max) {
        return min + Math.random() * (max - min);
    },
    randInt(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    },
    // 范围限制
    clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    },
    // 线性插值
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    // 距离
    distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    distance2D(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    // 角度标准化到 [-PI, PI]
    normalizeAngle(a) {
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        return a;
    },
    // 全局对象池
    pools: {},
    // 从池中获取对象
    poolGet(key, factory, resetFn) {
        if (!this.pools[key]) this.pools[key] = [];
        if (this.pools[key].length === 0) {
            const obj = factory();
            obj.__poolKey = key;
            return obj;
        }
        const obj = this.pools[key].pop();
        if (resetFn) resetFn(obj);
        obj.__poolKey = key;
        return obj;
    },
    // 归还对象到池
    poolPut(obj) {
        if (!obj || !obj.__poolKey) return;
        if (!this.pools[obj.__poolKey]) this.pools[obj.__poolKey] = [];
        this.pools[obj.__poolKey].push(obj);
    },
    // 创建THREE.Object3D
    disposeMesh(mesh) {
        if (!mesh) return;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                mesh.material.dispose();
            }
        }
    }
};
