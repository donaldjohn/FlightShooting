// HUD 管理
const HUD = {
    elLevel: null,
    elScore: null,
    elCombo: null,
    elHealth: null,
    elAmmo: null,
    elTime: null,
    elMessage: null,
    elHealthFill: null,
    elBossHp: null,
    elBossFill: null,
    elGameScreen: null,

    messageTimer: 0,
    comboTimer: 0,

    init() {
        this.elLevel = document.getElementById('hudLevel');
        this.elScore = document.getElementById('hudScore');
        this.elCombo = document.getElementById('hudCombo');
        this.elHealth = document.getElementById('hudHealth');
        this.elAmmo = document.getElementById('hudAmmo');
        this.elTime = document.getElementById('hudTime');
        this.elMessage = document.getElementById('hudMessage');
        this.elHealthFill = document.getElementById('healthFill');
        this.elBossHp = document.getElementById('bossHp');
        this.elBossFill = document.getElementById('bossFill');
        this.elGameScreen = document.getElementById('gameScreen');
    },

    setLevel(n) {
        this.elLevel.textContent = n;
    },

    setScore(n) {
        this.elScore.textContent = n;
    },

    setCombo(n) {
        this.elCombo.textContent = n;
        this.comboTimer = 3.0;
    },

    setHealth(n) {
        this.elHealth.textContent = Math.max(0, Math.round(n));
        this.elHealthFill.style.width = Math.max(0, n) + '%';
        // 受伤闪烁
        if (n < 30) {
            this.elHealthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
        } else if (n < 60) {
            this.elHealthFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ffd43b)';
        } else {
            this.elHealthFill.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #ffd43b 50%, #51cf66 100%)';
        }
    },

    setTime(t) {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        this.elTime.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },

    showMessage(text, duration = 2) {
        this.elMessage.textContent = text;
        this.elMessage.classList.add('show');
        this.messageTimer = duration;
    },

    setBossHP(percent) {
        this.elBossHp.style.display = percent !== null ? 'block' : 'none';
        if (percent !== null) {
            this.elBossFill.style.width = percent + '%';
        }
    },

    showDamage() {
        const flash = document.createElement('div');
        flash.className = 'damage-flash flash';
        this.elGameScreen.appendChild(flash);
        setTimeout(() => flash.remove(), 300);

        this.elGameScreen.classList.add('shake');
        setTimeout(() => this.elGameScreen.classList.remove('shake'), 400);
    },

    update(dt) {
        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.elMessage.classList.remove('show');
            }
        }
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.elCombo.textContent = '0';
            }
        }
    }
};
