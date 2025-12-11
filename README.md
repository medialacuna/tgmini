# HEARTWINS · Telegram Mini App

Мини-апп под Telegram:

- Без регистрации по почте.
- Авторизация через Telegram WebApp (если открыт внутри Telegram).
- Весь прогресс и баланс HW points хранятся локально (демо-кошелёк).
- Визуальный стиль — HEARTWINS point cloud (двойное сердце на фоне + чакровое ядро).

## Структура

- `backend/` — Node.js + Express (отдаёт фронтенд как статику).
- `frontend/`
  - `index.html` — основной экран.
  - `css/styles.css` — стили.
  - `js/app.js` — local state + Telegram.
  - `js/generator.js` — фон HEARTWINS, чакровое ядро, звук, сутры.
  - `js/breath.js` — дыхательная медитация 8–2–8.
  - `js/wheel.js` — колесо осознанности.

## Локальный запуск

```bash
cd backend
npm install
npm start
```

Откройте `http://localhost:5000` в браузере.
