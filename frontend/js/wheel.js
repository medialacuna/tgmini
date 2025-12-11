class WheelAwareness {
  constructor() {
    this.discEl = document.getElementById('wheelDisc');
    this.spinBtn = document.getElementById('wheelSpinBtn');
    this.resultEl = document.getElementById('wheelResult');

    if (!this.discEl || !this.spinBtn || !this.resultEl) return;

    this.segments = [
      'sahasrara',
      'ajna',
      'vishuddha',
      'anahata',
      'manipura',
      'svadhishthana',
      'muladhara'
    ];

    this.currentRotation = 0;
    this.isSpinning = false;

    this.spinBtn.addEventListener('click', () => this.spin());
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinBtn.disabled = true;
    this.spinBtn.textContent = '… колесо крутится';

    const n = this.segments.length;
    const segmentAngle = 360 / n;

    const targetIndex = Math.floor(Math.random() * n);
    const chakra = this.segments[targetIndex];

    const baseSpins = 3 * 360;
    const targetCenter = targetIndex * segmentAngle + segmentAngle / 2;
    const newRotation = this.currentRotation + baseSpins + targetCenter;

    this.discEl.style.transform = `rotate(${newRotation}deg)`;
    this.currentRotation = newRotation % 360;

    const SPIN_DURATION = 4000;
    setTimeout(() => {
      this.isSpinning = false;
      this.spinBtn.disabled = false;
      this.spinBtn.textContent = '🎡 Запустить колесо';

      const reward = 0.2 + Math.random() * 0.4;

      if (window.hwState) {
        window.hwState.awarenessScore += reward;
        window.hwSaveState && window.hwSaveState();
        window.hwUpdateAwarenessUI && window.hwUpdateAwarenessUI();
      }

      if (window.heartwinsField && window.heartwinsField.setChakraFromGame) {
        window.heartwinsField.setChakraFromGame(chakra);
      }

      const chakraNames = {
        sahasrara: 'Сахасрара',
        ajna: 'Аджна',
        vishuddha: 'Вишуддха',
        anahata: 'Анахата',
        manipura: 'Манипура',
        svadhishthana: 'Свадхистхана',
        muladhara: 'Муладхара'
      };

      const humanName = chakraNames[chakra] || chakra;

      this.resultEl.innerHTML = `
        Колесо выбрало чакру <b>${humanName}</b>.<br/>
        Бонус к осознанности: <b>${reward.toFixed(2)}</b> HW · points.<br/>
        Центральная анимация и тон звука синхронизированы под эту чакру.
      `;
    }, SPIN_DURATION);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WheelAwareness();
});
