// 伤害数字弹出系统
const DamageNumbers = {
    items: [],
    container: null,
    init(container) {
        this.container = container;
    },

    spawn(worldPos, text, color = '#ffd43b', isCritical = false) {
        if (!this.container) return;
        // 将 3D 世界坐标投影到 2D 屏幕坐标
        const pos = worldPos.clone().project(Game.camera);
        const x = (pos.x * 0.5 + 0.5) * this.container.clientWidth;
        const y = (-pos.y * 0.5 + 0.5) * this.container.clientHeight;

        const el = document.createElement('div');
        el.className = 'damage-number' + (isCritical ? ' critical' : '');
        el.textContent = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.color = color;
        this.container.appendChild(el);

        this.items.push({
            el,
            x, y,
            vy: -1.5 - Math.random() * 0.5,
            life: 1.0
        });
    },

    update(dt) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.life -= dt;
            item.y += item.vy * 60 * dt;
            item.vy *= 0.95;
            item.el.style.top = item.y + 'px';
            item.el.style.opacity = Math.max(0, item.life);
            item.el.style.transform = `translate(-50%, -50%) scale(${1 + (1 - item.life) * 0.5})`;
            if (item.life <= 0) {
                item.el.remove();
                this.items.splice(i, 1);
            }
        }
    },

    reset() {
        this.items.forEach(item => item.el.remove());
        this.items = [];
    }
};
