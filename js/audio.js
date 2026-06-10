// 音效系统 - 使用 Web Audio API 程序化生成所有音效（无需外部资源）
const AudioMgr = {
    ctx: null,
    master: null,
    sfxGain: null,
    musicGain: null,
    muted: false,
    sfxVolume: 0.6,
    musicVolume: 0.3,

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.muted ? 0 : 0.5;
            this.master.connect(this.ctx.destination);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.master);
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.master);
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    setMuted(m) {
        this.muted = m;
        if (this.master) this.master.gain.value = m ? 0 : 0.5;
    },

    setSfxVolume(v) {
        this.sfxVolume = Utils.clamp(v, 0, 1);
        if (this.sfxGain) this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume;
    },

    setMusicVolume(v) {
        this.musicVolume = Utils.clamp(v, 0, 1);
        if (this.musicGain) this.musicGain.gain.value = this.muted ? 0 : this.musicVolume;
    },

    // 创建噪声缓冲
    _noiseBuffer(duration) {
        const sr = this.ctx.sampleRate;
        const len = Math.floor(sr * duration);
        const buffer = this.ctx.createBuffer(1, len, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    // 播放射击音效
    playShoot() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    // 播放导弹发射音效
    playMissile() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.4);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);
    },

    // 爆炸音效
    playExplosion(size = 1) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        // 噪声爆炸
        const buffer = this._noiseBuffer(0.5);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + 0.4);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5 * size, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        src.start(t);
        // 低频冲击
        const osc = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
        g2.gain.setValueAtTime(0.6 * size, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(g2);
        g2.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    },

    // 受伤音效
    playHit() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
    },

    // 引擎音效（持续）
    startEngine() {
        if (!this.ctx || this.engineOsc) return;
        const t = this.ctx.currentTime;
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 80;
        this.engineGain.gain.value = 0.05;
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);
        this.engineOsc.start();
    },

    setEngineSpeed(speed) {
        if (!this.engineOsc || !this.engineGain) return;
        const t = this.ctx.currentTime;
        this.engineOsc.frequency.linearRampToValueAtTime(80 + speed * 60, t + 0.1);
        this.engineGain.gain.linearRampToValueAtTime(0.05 + speed * 0.05, t + 0.1);
    },

    stopEngine() {
        if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc = null;
        }
    },

    // UI 点击
    playClick() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.05);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.08);
    },

    // 升级 / 道具
    playPowerup() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(1200, t + 0.2);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    },

    // Boss 警告
    playWarning() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 440;
            const start = t + i * 0.2;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.15);
        }
    },

    // ===== 背景音乐 =====
    musicPlaying: false,
    musicNodes: [],

    /**
     * 启动背景音乐 - 程序化合成循环
     */
    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;

        const bpm = 110;
        const beatLen = 60 / bpm; // 秒/拍
        // 4/4 拍，4 个小节循环
        const loopLen = beatLen * 16;

        // 主旋律音符（A 小调五声音阶）
        const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
        // 4 小节的旋律
        const melody = [
            // 小节1
            { n: 0, t: 0, d: 1 }, { n: 2, t: 1, d: 1 }, { n: 4, t: 2, d: 1 }, { n: 2, t: 3, d: 1 },
            // 小节2
            { n: 0, t: 4, d: 0.5 }, { n: 4, t: 4.5, d: 0.5 }, { n: 5, t: 5, d: 1 }, { n: 4, t: 6, d: 1 },
            // 小节3
            { n: 2, t: 8, d: 1 }, { n: 4, t: 9, d: 1 }, { n: 5, t: 10, d: 1 }, { n: 4, t: 11, d: 1 },
            // 小节4
            { n: 6, t: 12, d: 1 }, { n: 4, t: 13, d: 1 }, { n: 2, t: 14, d: 1 }, { n: 0, t: 15, d: 1 }
        ];

        // 低音模式
        const bass = [
            { n: 0, t: 0, d: 2 }, { n: 0, t: 2, d: 2 },
            { n: 2, t: 4, d: 2 }, { n: 2, t: 6, d: 2 },
            { n: 4, t: 8, d: 2 }, { n: 4, t: 10, d: 2 },
            { n: 2, t: 12, d: 2 }, { n: 0, t: 14, d: 2 }
        ];

        const scheduleAhead = 0.2; // 提前调度（秒）
        let nextNoteTime = 0;
        let currentNoteIdx = 0;
        let currentBassIdx = 0;
        let lastScheduledTime = 0;

        const tick = () => {
            if (!this.musicPlaying) return;
            const now = this.ctx.currentTime;
            // 调度接下来 0.2s 的音符
            while (lastScheduledTime < now + scheduleAhead) {
                // 调度所有应该播放的旋律音符
                while (currentNoteIdx < melody.length) {
                    const note = melody[currentNoteIdx];
                    const noteTime = lastScheduledTime + note.t * beatLen - (now - this.musicStartTime);
                    if (noteTime > now + scheduleAhead) break;
                    this._playMelodyNote(scale[note.n % scale.length], note.d * beatLen * 0.9, noteTime);
                    currentNoteIdx++;
                }
                if (currentNoteIdx >= melody.length) {
                    // 一个循环结束，准备下一轮
                    lastScheduledTime += loopLen;
                    currentNoteIdx = 0;
                    currentBassIdx = 0;
                }
                // 调度低音
                while (currentBassIdx < bass.length) {
                    const note = bass[currentBassIdx];
                    const noteTime = lastScheduledTime + note.t * beatLen - (now - this.musicStartTime);
                    if (noteTime > now + scheduleAhead) break;
                    this._playBassNote(scale[note.n % scale.length] / 4, note.d * beatLen * 0.9, noteTime);
                    currentBassIdx++;
                }
                if (currentBassIdx >= bass.length) {
                    lastScheduledTime += loopLen;
                    currentBassIdx = 0;
                    currentNoteIdx = 0;
                }
                break;
            }
            if (this.musicPlaying) {
                requestAnimationFrame(tick);
            }
        };

        this.musicStartTime = this.ctx.currentTime;
        tick();
    },

    _playMelodyNote(freq, duration, when) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(0.06, when + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, when + duration);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(when);
        osc.stop(when + duration + 0.05);
    },

    _playBassNote(freq, duration, when) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        // 滤波让低音不那么刺耳
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(0.08, when + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, when + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(when);
        osc.stop(when + duration + 0.05);
    },

    stopMusic() {
        this.musicPlaying = false;
    }
};
