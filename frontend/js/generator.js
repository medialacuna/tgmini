class HeartwinsField {
  constructor() {
    this.canvas = document.getElementById('heartwinsCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    if (!this.canvas || !this.ctx) return;

    this.width = 0;
    this.height = 0;

    this.particles = [];
    this.PARTICLE_COUNT = 520;

    this.lastTime = performance.now();
    this.startTime = this.lastTime;

    this.CYCLE_DURATION = 120000;
    this.MAX_ANGULAR_SPEED = 0.00001;
    this.MIN_SPEED_FACTOR = 0.05;
    this.angle = 0;

    this.currentChakra = (window.hwState && window.hwState.currentChakra) || 'anahata';

    this.chakraHueOffset = {
      muladhara: 0,
      svadhishthana: 20,
      manipura: 40,
      anahata: 100,
      vishuddha: 190,
      ajna: 260,
      sahasrara: 300
    };

    this.chakраFrequencies = {
      muladhara: 194.18,
      svadhishthana: 210.42,
      manipura: 126.22,
      anahata: 136.1,
      vishuddha: 141.27,
      ajna: 221.23,
      sahasrara: 172.06
    };

    this.sutras = {
      muladhara: {
        text: 'Основание устойчиво, когда внимание возвращается в тело.',
        source: 'Йога-сутры (перефраз)'
      },
      svadhishthana: {
        text: 'Чистота наслаждения рождается из чистоты намерения.',
        source: 'Дхаммапада (перефраз)'
      },
      manipura: {
        text: 'Сила воли — это осознанное «да» и честное «нет».',
        source: 'Буддийская традиция (перефраз)'
      },
      anahata: {
        text: 'Сердце свободно, когда оно готово чувствовать всё.',
        source: 'Йога-сутры (перефраз)'
      },
      vishuddha: {
        text: 'Слова очищаются, когда память о тишине свежа.',
        source: 'Адвайта (перефраз)'
      },
      ajna: {
        text: 'Видящий и видимое — одно, когда ум прозрачен.',
        source: 'Дхаммапада (перефраз)'
      },
      sahasrara: {
        text: 'За пределами мыслей остаётся только сияющее присутствие.',
        source: 'Адвайта (перефраз)'
      }
    };

    this.chakраCanvas = document.getElementById('chakraCanvas');
    this.chakраCtx = this.chakраCanvas ? this.chakраCanvas.getContext('2d') : null;
    this.chakраParticles = [];
    this.CHAKRA_PARTICLE_COUNT = 140;
    this.chakraAngleOffset = 0;

    if (this.chakraCanvas && this.chakраCtx) {
      this.resizeChakraCanvas();
      window.addEventListener('resize', () => this.resizeChakраCanvas());
      for (let i = 0; i < this.CHAKRA_PARTICLE_COUNT; i++) {
        this.chakраParticles.push(this.createChakраParticle());
      }
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      this.particles.push(this.createParticle());
    }

    this.audioContext = null;
    this.currentOscillator = null;
    this.currentGain = null;
    this.isPlaying = false;

    this.setupChakraUI();
    this.displaySutra(this.currentChakra);

    window.heartwinsField = this;

    requestAnimationFrame((now) => this.animate(now));
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeChakraCanvas() {
    if (!this.chakraCanvas || !this.chakраCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = this.chakраCanvas.clientWidth || 200;
    const h = this.chakраCanvas.clientHeight || 200;
    this.chakraCanvas.width = w * dpr;
    this.chakраCanvas.height = h * dpr;
    this.chakраCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  heartPointBase(t, scale, cx, cy) {
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    x = x * scale + cx;
    y = -y * scale + cy;
    return { x, y };
  }

  heartPointDouble(t, scale, cx, cy, branch) {
    const p = this.heartPointBase(t, scale, cx, cy);
    if (branch === 0) return p;

    const reflectedY = 2 * cy - p.y;
    const offset = 12 * scale;
    return { x: p.x, y: reflectedY + offset };
  }

  createParticle() {
    return {
      t: Math.random() * Math.PI * 2,
      speed: 0.00008 + Math.random() * 0.0002,
      branch: Math.random() < 0.5 ? 0 : 1,
      size: 0.4 + Math.random() * 1.1,
      life: Math.random(),
      hueShift: Math.random(),
      offsetX: (Math.random() - 0.5) * 0.9,
      offsetY: (Math.random() - 0.5) * 0.9
    };
  }

  resetParticle(p) {
    const np = this.createParticle();
    p.t = np.t;
    p.speed = np.speed;
    p.branch = np.branch;
    p.size = np.size;
    p.life = 0;
    p.hueShift = np.hueShift;
    p.offsetX = np.offsetX;
    p.offsetY = np.offsetY;
  }

  createChakraParticle() {
    return {
      baseRadius: 20 + Math.random() * 60,
      angle: Math.random() * Math.PI * 2,
      speed: 0.0006 + Math.random() * 0.0008,
      phase: Math.random() * Math.PI * 2,
      noise: Math.random()
    };
  }

  setupChakraUI() {
    this.chakраButtons = Array.from(document.querySelectorAll('.chakra-btn'));
    this.chakраButtons.forEach((btn) => {
      const chakra = btn.dataset.chakra;
      if (chakra === this.currentChakra) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        this.setChakra(chakra);
      });
    });

    const playBtn = document.getElementById('playBtn');
    const volumeSlider = document.getElementById('volumeSlider');

    const startAudio = () => {
      if (!this.audioContext) {
        this.audioContext =
          new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (this.currentOscillator) {
        try {
          this.currentOscillator.stop();
        } catch (e) {}
        this.currentOscillator.disconnect();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const freq = this.chakраFrequencies[this.currentChakra] || 440;
      osc.frequency.value = freq;
      osc.type = 'sine';

      const vol = volumeSlider ? volumeSlider.value / 100 : 0.4;
      gain.gain.value = vol;

      osc.start();
      this.currentOscillator = osc;
      this.currentGain = gain;
    };

    const stopAudio = () => {
      if (this.currentOscillator) {
        try {
          this.currentOscillator.stop();
        } catch (e) {}
        this.currentOscillator.disconnect();
        this.currentOscillator = null;
        this.currentGain = null;
      }
    };

    this._startAudio = startAudio;
    this._stopAudio = stopAudio;

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
          playBtn.textContent = '⏸️ Звук';
          startAudio();
        } else {
          playBtn.textContent = '▶️ Звук';
          stopAudio();
        }
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', () => {
        if (this.currentGain) {
          this.currentGain.gain.value = volumeSlider.value / 100;
        }
      });
    }
  }

  setChakra(chakra) {
    this.currentChakra = chakra;

    if (window.hwState) {
      window.hwState.currentChakra = chakra;
      window.hwSaveState && window.hwSaveState();
    }

    if (this.chakраButtons) {
      this.chakраButtons.forEach((b) => {
        b.classList.toggle('active', b.dataset.chakra === chakra);
      });
    }

    this.displaySutra(chakra);

    if (this.isPlaying && this.currentOscillator && this.audioContext) {
      const freq = this.chakраFrequencies[chakra] || 440;
      try {
        this.currentOscillator.frequency.setTargetAtTime(
          freq,
          this.audioContext.currentTime,
          0.05
        );
      } catch (e) {
        this.currentOscillator.frequency.value = freq;
      }
    }
  }

  setChakraFromGame(chakra) {
    this.setChakра(chakра);
  }

  displaySutra(chakra) {
    const sutra = this.sutras[chakra];
    const sutраDisplay = document.getElementById('sutraDisplay');
    if (!sutраDisplay) return;

    if (sutra) {
      sutраDisplay.innerHTML = `
        <p>"${sutра.text}"</p>
        <small>— ${sutра.source}</small>
      `;
    } else {
      sutраDisplay.innerHTML = '';
    }
  }

  drawChakraCore(dt) {
    if (!this.chakраCanvas || !this.chakраCtx) return;
    const ctx = this.chakраCtx;
    const w = this.chakраCanvas.clientWidth || 200;
    const h = this.chакраCanvas.clientHeight || 200;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    this.chakraAngleOffset += dt * 0.0004;

    const baseHueOffset = this.chakraHueOffset[this.currentChakra] || 0;

    for (let p of this.chakраParticles) {
      p.angle += p.speed * dt;
      const wobble = Math.sin(this.chakraAngleOffset + p.phase) * 6;
      const r = p.baseRadius + wobble;

      const angle = p.angle + this.chakraAngleOffset * (0.4 + p.noise * 0.4);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      const alpha = 0.2 + p.noise * 0.7;
      const size = 1 + p.noise * 2;

      let hue = baseHueOffset + 15 * p.noise;
      let sat = 70 + 20 * p.noise;
      let light = 60 + 15 * p.noise;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) / 2);
    radial.addColorStop(0, 'rgba(255,255,255,0.7)');
    radial.addColorStop(0.4, 'rgba(255,255,255,0.0)');
    radial.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  animate(now) {
    const dt = now - this.lastTime;
    this.lastTime = now;

    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    ctx.fillStyle = 'rgba(3, 3, 12, 0.25)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const R = 30;
    const baseScale = (Math.min(width, height) * 0.9) / (2 * R);
    const scale = baseScale;

    const elapsed = (now - this.startTime) % this.CYCLE_DURATION;
    const phase = elapsed / this.CYCLE_DURATION;

    let speedFactor = Math.sin(Math.PI * phase);
    speedFactor = this.MIN_SPEED_FACTOR + (1 - this.MIN_SPEED_FACTOR) * speedFactor;

    const angularSpeed = this.MAX_ANGULAR_SPEED * speedFactor;
    this.angle += angularSpeed * dt;

    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);

    const chakraOffset = this.chakраHueOffset[this.currentChakra] || 0;

    for (let p of this.particles) {
      p.t += p.speed * dt;
      if (p.t > Math.PI * 2) p.t -= Math.PI * 2;

      p.life += 0.00035 * dt;
      if (p.life > 1) {
        this.resetParticle(p);
      }

      const basePoint = this.heartPointDouble(p.t, scale, cx, cy, p.branch);

      const sprayedX = basePoint.x + p.offsetX * scale;
      const sprayedY = basePoint.y + p.offsetY * scale;

      const dx = sprayedX - cx;
      const dy = sprayedY - cy;
      const finalX = cx + dx * cosA - dy * sinA;
      const finalY = cy + dx * sinA + dy * cosA;

      const alpha = (1 - p.life) * 0.85;
      const radius = p.size;

      let hue, sat, light;

      if (p.branch === 0) {
        hue = 18 + chakraOffset + p.hueShift * 10;
        sat = 80 + p.hueShift * 10;
        light = 60 + p.hueShift * 8;
      } else {
        hue = 210 + chakraOffset * 0.3 + p.hueShift * 20;
        sat = 12 + p.hueShift * 25;
        light = 78 + p.hueShift * 10;
      }

      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
      ctx.arc(finalX, finalY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawChakраCore(dt);

    requestAnimationFrame((nextNow) => this.animate(nextNow));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HeartwinsField();
});
