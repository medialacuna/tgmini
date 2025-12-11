const HEARTWINS_LOCAL_KEY = 'heartwins_miniapp_state';

const defaultState = {
  awarenessScore: 0,
  lastBreathCompletedAt: null,
  currentChakra: 'anahata',
  walletId: null
};

let hwState = { ...defaultState };

function loadState() {
  try {
    const raw = localStorage.getItem(HEARTWINS_LOCAL_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    hwState = { ...defaultState, ...parsed };
  } catch (e) {
    console.warn('Failed to parse local state:', e);
  }
  if (!hwState.walletId) {
    hwState.walletId = 'HW-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }
}

function saveState() {
  try {
    localStorage.setItem(HEARTWINS_LOCAL_KEY, JSON.stringify(hwState));
  } catch (e) {
    console.warn('Failed to save local state:', e);
  }
}

function updateAwarenessUI() {
  const score = hwState.awarenessScore || 0;
  const el1 = document.getElementById('awarenessScore');
  const el2 = document.getElementById('walletBalance');
  if (el1) el1.textContent = score.toFixed(2);
  if (el2) el2.textContent = score.toFixed(2);
}

function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    try {
      tg.expand();
    } catch (e) {}

    const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
    const greet = document.getElementById('tgUserGreeting');
    if (greet && user) {
      greet.textContent = `@${user.username || user.first_name || 'гость'}`;
    } else if (greet) {
      greet.textContent = 'гость · offline';
    }
  } else {
    const greet = document.getElementById('tgUserGreeting');
    if (greet) {
      greet.textContent = 'web preview · без Telegram';
    }
  }
}

function initWalletUI() {
  const walletStatus = document.getElementById('walletStatus');
  if (walletStatus && hwState.walletId) {
    walletStatus.textContent =
      `Локальный ID: ${hwState.walletId}. В следующих версиях он будет связан с блокчейн-кошельком HEARTWINS.`;
  }

  const copyBtn = document.getElementById('walletCopyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!hwState.walletId) return;
      navigator.clipboard?.writeText(hwState.walletId).then(
        () => {
          copyBtn.textContent = 'ID скопирован ✓';
          setTimeout(() => (copyBtn.textContent = 'Скопировать локальный ID'), 2000);
        },
        () => {
          copyBtn.textContent = 'Не удалось скопировать';
          setTimeout(() => (copyBtn.textContent = 'Скопировать локальный ID'), 2000);
        }
      );
    });
  }

  const resetBtn = document.getElementById('walletResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Сбросить локальный кошелёк и начать сначала? Данные не восстановить.')) return;
      hwState.awarenessScore = 0;
      hwState.lastBreathCompletedAt = null;
      hwState.walletId = 'HW-' + Math.random().toString(36).slice(2, 10).toUpperCase();
      saveState();
      updateAwarenessUI();
      initWalletUI();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateAwarenessUI();
  initTelegram();
  initWalletUI();
});

window.hwState = hwState;
window.hwUpdateAwarenessUI = updateAwarenessUI;
window.hwSaveState = saveState;
