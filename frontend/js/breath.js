class BreathingMini {
  constructor() {
    this.circleEl = document.getElementById('breathCircle');
    this.phaseLabelEl = document.getElementById('breathPhaseLabel');
    this.timerEl = document.getElementById('breathTimer');
    this.micBarEl = document.getElementById('breathMicLevel');
    this.micStatusEl = document.getElementById('breathMicStatus');
    this.rewardEl = document.getElementById('breathRewardDisplay');

    this.startBtn = document.getElementById('breathStartBtn');
    this.stopBtn = document.getElementById('breathStopBtn');

    this.phaseDurations = {
      inhale: 8000,
      hold: 2000,
      exhale: 8000
    };

    this.totalDuration = 90000;
    this.startTime = null;
    this.elapsed = 0;

    this.currentPhase = 'idle';
    this.phaseStartTime = null;

    this.running = false;
    this.rafId = null;

    this.audioStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.micData = null;
    this.micRafId = null;

    this.init();
  }

  init() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.start());
    }
    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => this.stop());
    }

    this.updateTimerUI(this.totalDuration);
    this.updatePhaseUI('idle');
  }

  async initMic() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (this.micStatusEl) {
          this.micStatusEl.textContent = 'Микрофон не поддерживается этим устройством.';
        }
        return;
      }

      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.micData = new Uint8Array(this.analyser.fftSize);

      source.connect(this.analyser);

      if (this.micStatusEl) {
        this.micStatusEl.textContent = 'Микрофон активен: наблюдайте за дыханием.';
      }

      this.updateMicLevel();
    } catch (e) {
      console.error('Mic error:', e);
      if (this.micStatusEl) {
        this.micStatusEl.textContent = 'Не удалось получить доступ к микрофону.';
      }
    }
  }

  updateMicLevel() {
    if (!this.analyser || !this.micData || !this.micBarEl) return;

    const loop = () => {
      if (!this.analyser) return;

      this.analyser.getByteTimeDomainData(this.micData);

      let sum = 0;
      for (let i = 0; i < this.micData.length; i++) {
        const v = this.micData[i] - 128;
        sum += v * v;
      }

      const rms = Math.sqrt(sum / this.micData.length);
      const level = Math.min((rms / 50) * 100, 100);

      this.micBarEl.style.width = `${level}%`;

      this.micRafId = requestAnimationFrame(loop);
    };

    loop();
  }

  stopMic() {
    if (this.micRafId) {
      cancelAnimationFrame(this.micRafId);
      this.micRafId = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((t) => t.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.micData = null;

    if (this.micBarEl) {
      this.micBarEl.style.width = '0%';
    }

    if (this.micStatusEl) {
      this.micStatusEl.textContent = 'Микрофон отключен.';
    }
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.startTime = performance.now();
    this.elapsed = 0;

    this.currentPhase = 'inhale';
    this.phaseStartTime = this.startTime;

    this.updatePhaseUI(this.currentPhase);
    this.updateTimerUI(this.totalDuration);

    this.initMic();

    const loop = (now) => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(loop);
      this.tick(now);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.stopMic();

    this.currentPhase = 'idle';
    this.updatePhaseUI('idle');
    this.updateTimerUI(this.totalDuration);

    if (this.rewardEl) {
      this.rewardEl.textContent = 'Сессия прервана. Можно начать снова в любой момент.';
    }
  }

  tick(now) {
    if (!this.startTime) this.startTime = now;

    this.elapsed = now - this.startTime;
    const remaining = Math.max(this.totalDuration - this.elapsed, 0);

    this.updateTimerUI(remaining);
    this.updatePhase(now);

    if (remaining <= 0) {
      this.finishSession();
    }
  }

  updatePhase(now) {
    if (!this.phaseStartTime) this.phaseStartTime = now;
    const phaseElapsed = now - this.phaseStartTime;

    const d = this.phaseDurations;

    if (this.currentPhase === 'inhale' && phaseElapsed >= d.inhale) {
      this.currentPhase = 'hold';
      this.phaseStartTime = now;
      this.updatePhaseUI('hold');
    } else if (this.currentPhase === 'hold' && phaseElapsed >= d.hold) {
      this.currentPhase = 'exhale';
      this.phaseStartTime = now;
      this.updatePhaseUI('exhale');
    } else if (this.currentPhase === 'exhale' && phaseElapsed >= d.exhale) {
      this.currentPhase = 'inhale';
      this.phaseStartTime = now;
      this.updatePhaseUI('inhale');
    }
  }

  updatePhaseUI(phase) {
    if (!this.circleEl || !this.phaseLabelEl) return;

    this.circleEl.classList.remove('inhale', 'hold', 'exhale');

    switch (phase) {
      case 'inhale':
        this.circleEl.classList.add('inhale');
        this.phaseLabelEl.textContent = 'Вдох · 8 сек';
        break;
      case 'hold':
        this.circleEl.classList.add('hold');
        this.phaseLabelEl.textContent = 'Пауза · 2 сек';
        break;
      case 'exhale':
        this.circleEl.classList.add('exhale');
        this.phaseLabelEl.textContent = 'Выдох · 8 сек';
        break;
      default:
        this.phaseLabelEl.textContent = 'Готовы?';
        break;
    }
  }

  updateTimerUI(ms) {
    if (!this.timerEl) return;

    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;

    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');

    this.timerEl.textContent = `${mm}:${ss}`;
  }

  finishSession() {
    this.running = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.stopMic();
    this.updatePhaseUI('idle');
    this.updateTimerUI(0);

    const durationSec = Math.round(this.elapsed / 1000);

    const baseSessionSeconds = 90;
    const baseReward = 1;
    const ratio = Math.min(durationSec / baseSessionSeconds, 1);
    const reward = baseReward * ratio;

    if (window.hwState) {
      window.hwState.awarenessScore += reward;
      window.hwSaveState && window.hwSaveState();
      window.hwUpdateAwarenessUI && window.hwUpdateAwarenessUI();
    }

    if (this.rewardEl) {
      this.rewardEl.innerHTML = `
        Сессия завершена. Начислено примерно <b>${reward.toFixed(2)}</b> HW · points.<br/>
        Продолжайте практику, чтобы накапливать токен осознанности HEARTWINS.
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BreathingMini();
});
