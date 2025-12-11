// frontend/js/generator.js

// Глобальное состояние текущей чакры для графики и звука
let currentChakra = 'anahata';

// Смещения оттенков для каждой чакры (используется в цвете частиц)
const chakraHueOffset = {
    muladhara: 0,
    svadhishthana: 20,
    manipura: 40,
    anahata: 100,
    vishuddha: 190,
    ajna: 260,
    sahasrara: 300
};

// Частоты для звука (тон меняется при смене чакры)
const chakraFrequencies = {
    muladhara: 194.18,
    svadhishthana: 210.42,
    manipura: 126.22,
    anahata: 136.10,
    vishuddha: 141.27,
    ajna: 221.23,
    sahasrara: 172.06
};

// Сутры для каждой чакры
const sutras = {
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

let audioContext = null;
let currentOscillator = null;
let currentGain = null;
let isSoundPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
    initHeartwinsCanvas();
    initChakraControls();
});

/* ---------------- HEARTWINS BACKGROUND CANVAS ---------------- */

function initHeartwinsCanvas() {
    const canvas = document.getElementById('heartwinsCanvas'); // обязательно такой id в HTML
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // базовое сердечко
    function heartPointBase(t, scale, cx, cy) {
        let x = 16 * Math.pow(Math.sin(t), 3);
        let y = 13 * Math.cos(t)
            - 5 * Math.cos(2 * t)
            - 2 * Math.cos(3 * t)
            - Math.cos(4 * t);
        x = x * scale + cx;
        y = -y * scale + cy;
        return { x, y };
    }

    // двойное сердце: branch = 0 (верх), 1 (нижнее — перевёрнутое и опущенное)
    function heartPointDouble(t, scale, cx, cy, branch) {
        const p = heartPointBase(t, scale, cx, cy);

        if (branch === 0) {
            return p;
        } else {
            const reflectedY = 2 * cy - p.y;
            const offset = 12 * scale; // 17*scale - 5*scale
            return {
                x: p.x,
                y: reflectedY + offset
            };
        }
    }

    const particles = [];
    const PARTICLE_COUNT = 450;

    function createParticle() {
        return {
            t: Math.random() * Math.PI * 2,
            speed: 0.00008 + Math.random() * 0.0002,
            branch: Math.random() < 0.5 ? 0 : 1,
            size: 0.4 + Math.random() * 1.1,
            life: Math.random(),
            hueShift: Math.random(),
            offsetX: (Math.random() - 0.5) * 0.8,
            offsetY: (Math.random() - 0.5) * 0.8
        };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
    }

    let lastTime = performance.now();
    let startTime = lastTime;

    const CYCLE_DURATION = 120000; // 120 секунд
    const MAX_ANGULAR_SPEED = 0.0015; // рад/мс
    const MIN_SPEED_FACTOR = 0.03;

    let angle = 0;

    function animate(now) {
        const dt = now - lastTime;
        lastTime = now;

        // Лёгкий шлейф, как в эталонном примере
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        const R = 30;
        const baseScale = Math.min(width, height) * 0.9 / (2 * R);
        const scale = baseScale;

        const elapsed = (now - startTime) % CYCLE_DURATION;
        const phase = elapsed / CYCLE_DURATION;

        let speedFactor = Math.sin(Math.PI * phase); // 0..1
        speedFactor = MIN_SPEED_FACTOR + (1 - MIN_SPEED_FACTOR) * speedFactor;
        const angularSpeed = MAX_ANGULAR_SPEED * speedFactor;

        angle += angularSpeed * dt;
        const cosA = Math.cos(angle);

        const chakraOffset = chakraHueOffset[currentChakra] || 0;

        for (let p of particles) {
            p.t += p.speed * dt;
            if (p.t > Math.PI * 2) p.t -= Math.PI * 2;

            p.life += 0.0004 * dt;
            if (p.life > 1) {
                const np = createParticle();
                p.t = np.t;
                p.speed = np.speed;
                p.branch = np.branch;
                p.size = np.size;
                p.life = 0;
                p.hueShift = np.hueShift;
                p.offsetX = np.offsetX;
                p.offsetY = np.offsetY;
            }

            const basePoint = heartPointDouble(p.t, scale, cx, cy, p.branch);

            const sprayedX = basePoint.x + p.offsetX * scale;
            const sprayedY = basePoint.y + p.offsetY * scale;

            // Вращение вокруг вертикальной оси Y (ортографическая проекция)
            const dx = sprayedX - cx;
            const finalX = cx + dx * cosA;
            const finalY = sprayedY;

            const alpha = (1 - p.life) * 0.8;
            const radius = p.size;

            let hue, sat, light;

            if (p.branch === 0) {
                // верх — розовое золото с оттенком чакры
                hue = 18 + chakraOffset + p.hueShift * 10;
                sat = 85 + p.hueShift * 10;
                light = 62 + p.hueShift * 8;
            } else {
                // низ — платина / белое золото с легким оттенком чакры
                hue = 210 + chakraOffset * 0.3 + p.hueShift * 20;
                sat = 10 + p.hueShift * 25;
                light = 78 + p.hueShift * 10;
            }

            ctx.beginPath();
            ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
            ctx.arc(finalX, finalY, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

/* ---------------- CHAKRAS, СУТРЫ, ЗВУК ---------------- */

function initChakraControls() {
    const chakraButtons = Array.from(document.querySelectorAll('.chakra-btn'));
    const sutraDisplay = document.getElementById('sutraDisplay');
    const playBtn = document.getElementById('playBtn');
    const volumeSlider = document.getElementById('volumeSlider');

    // Восстановим текущую чакру из состояния, если есть
    if (window.hwState && window.hwState.currentChakra) {
        currentChakra = window.hwState.currentChakra;
    }

    function updateSutra() {
        const s = sutras[currentChakra];
        if (!sutraDisplay) return;

        if (s) {
            sutraDisplay.innerHTML = `
                <p>"${s.text}"</p>
                <small>— ${s.source}</small>
            `;
        } else {
            sutraDisplay.innerHTML = '';
        }
    }

    function setChakra(chakra) {
        currentChakra = chakra;

        // Сохраняем в локальное состояние, если оно есть
        if (window.hwState) {
            window.hwState.currentChakra = chakra;
            window.hwSaveState && window.hwSaveState();
        }

        chakraButtons.forEach(btn =>
            btn.classList.toggle('active', btn.dataset.chakra === chakra)
        );

        updateSutra();

        // Если звук уже играет — мягко сменим частоту
        if (isSoundPlaying && currentOscillator && audioContext) {
            const freq = chakraFrequencies[chakra] || 440;
            try {
                currentOscillator.frequency.setTargetAtTime(
                    freq,
                    audioContext.currentTime,
                    0.05
                );
            } catch (e) {
                currentOscillator.frequency.value = freq;
            }
        }
    }

    chakraButtons.forEach(btn => {
        const chakra = btn.dataset.chakra;
        if (!chakra) return;

        if (chakra === currentChakra) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            setChakra(chakra);
        });
    });

    updateSutra();

    // ---- звук ----
    function startAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (currentOscillator) {
            try { currentOscillator.stop(); } catch (e) {}
            currentOscillator.disconnect();
        }

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        const freq = chakraFrequencies[currentChakra] || 440;
        osc.frequency.value = freq;
        osc.type = 'sine';

        const vol = volumeSlider ? volumeSlider.value / 100 : 0.4;
        gain.gain.value = vol;

        osc.start();

        currentOscillator = osc;
        currentGain = gain;
        isSoundPlaying = true;
    }

    function stopAudio() {
        if (currentOscillator) {
            try { currentOscillator.stop(); } catch (e) {}
            currentOscillator.disconnect();
            currentOscillator = null;
            currentGain = null;
        }
        isSoundPlaying = false;
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!isSoundPlaying) {
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
            if (currentGain) {
                currentGain.gain.value = volumeSlider.value / 100;
            }
        });
    }

    // Делаем API для колеса (wheel.js), чтобы оно могло менять чакру
    window.heartwinsField = {
        setChakraFromGame(chakra) {
            setChakra(chakra);
        }
    };
}
