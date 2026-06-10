// 教程系统
const Tutorial = {
    overlay: null,
    currentStep: 0,
    steps: [
        {
            icon: '✈️',
            title: '欢迎来到天空霸者！',
            desc: '驾驶你的战机，与来袭的敌机展开空中对决。准备好开始你的飞行之旅了吗？'
        },
        {
            icon: '🎮',
            title: '操作控制',
            desc: '使用 W/A/S/D 或方向键控制战机移动<br>移动鼠标辅助瞄准射击方向'
        },
        {
            icon: '🔫',
            title: '开火射击',
            desc: '按 空格键 / Q / E 或点击鼠标左键发射子弹<br>击毁敌机获得分数，2秒内连续击毁可触发连击加成'
        },
        {
            icon: '🎁',
            title: '收集道具',
            desc: '击毁敌机有概率掉落道具<br>🟢 医疗包  🟡 双倍伤害  🔵 护盾<br>合理利用道具挑战 BOSS！'
        }
    ],
    isActive: false,

    init() {
        this.overlay = document.getElementById('tutorialOverlay');
        if (!this.overlay) return;
        document.getElementById('tutNext').addEventListener('click', () => this.next());
        document.getElementById('tutSkip').addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('flightShooting_tutorial_seen', 'true');
            }
        });
    },

    shouldShow() {
        return localStorage.getItem('flightShooting_tutorial_seen') !== 'true';
    },

    show() {
        if (!this.shouldShow()) return;
        this.overlay.style.display = 'flex';
        this.isActive = true;
        this.currentStep = 0;
        this.render();
    },

    hide() {
        this.overlay.style.display = 'none';
        this.isActive = false;
    },

    next() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            if (document.getElementById('tutSkip').checked) {
                localStorage.setItem('flightShooting_tutorial_seen', 'true');
            }
            this.hide();
            return;
        }
        this.render();
    },

    render() {
        const step = this.steps[this.currentStep];
        document.getElementById('tutIcon').textContent = step.icon;
        document.getElementById('tutTitle').textContent = step.title;
        document.getElementById('tutDesc').innerHTML = step.desc;
        // 更新进度点
        const dots = document.querySelectorAll('#tutProgress .dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentStep);
        });
        // 更新按钮文字
        document.getElementById('tutNext').textContent =
            this.currentStep === this.steps.length - 1 ? '开始游戏！' : '下一步';
    }
};

// 成就系统
const Achievements = {
    definitions: [
        {
            id: 'first_victory',
            name: '首战告捷',
            desc: '完成任意一个关卡'
        },
        {
            id: 'combo_10',
            name: '连击大师',
            desc: '达成 10 连击'
        },
        {
            id: 'perfect_clear',
            name: '完美通关',
            desc: '以满血完成一个关卡'
        },
        {
            id: 'boss_hunter',
            name: 'BOSS 猎手',
            desc: '击毁终极 BOSS'
        },
        {
            id: 'centurion',
            name: '百战精英',
            desc: '累计击毁 100 架敌机'
        }
    ],
    unlocked: {},
    notification: null,
    achName: null,
    achDesc: null,
    queue: [],
    showing: false,

    init() {
        // 从 localStorage 恢复
        try {
            this.unlocked = JSON.parse(localStorage.getItem('flightShooting_achievements') || '{}');
        } catch (e) {
            this.unlocked = {};
        }
        this.notification = document.getElementById('achievementNotification');
        this.achName = document.getElementById('achName');
        this.achDesc = document.getElementById('achDesc');
    },

    unlock(id) {
        if (this.unlocked[id]) return false;
        const def = this.definitions.find(d => d.id === id);
        if (!def) return false;
        this.unlocked[id] = { date: new Date().toISOString() };
        this.save();
        this.queue.push(def);
        this.showNext();
        return true;
    },

    showNext() {
        if (this.showing || this.queue.length === 0) return;
        const def = this.queue.shift();
        this.showing = true;
        this.achName.textContent = def.name;
        this.achDesc.textContent = def.desc;
        this.notification.classList.add('show');
        AudioMgr.playPowerup();
        setTimeout(() => {
            this.notification.classList.remove('show');
            setTimeout(() => {
                this.showing = false;
                this.showNext();
            }, 500);
        }, 3000);
    },

    save() {
        try {
            localStorage.setItem('flightShooting_achievements', JSON.stringify(this.unlocked));
        } catch (e) {}
    },

    isUnlocked(id) {
        return !!this.unlocked[id];
    },

    getUnlockedCount() {
        return Object.keys(this.unlocked).length;
    },

    reset() {
        this.unlocked = {};
        this.save();
    }
};
