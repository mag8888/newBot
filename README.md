# Energy of Money - Telegram Bot

Простой Telegram бот для игры "Energy of Money" с авторизацией через кнопку "Играть".

## Функции

- 🎮 Приветствие и команды `/start`, `/help`, `/play`
- 🔘 Кнопка "Играть" для авторизации
- 🔐 Передача данных пользователя (ID, имя, фото) в игру
- 🔗 Создание ссылки на игру с авторизацией

## Установка

```bash
npm install
```

## Запуск

```bash
npm start
```

## Environment Variables

- `BOT_TOKEN` - Токен Telegram бота
- `PORT` - Порт сервера (по умолчанию 3001)

## Endpoints

- `POST /webhook` - Webhook для Telegram
- `GET /health` - Проверка здоровья сервера
- `GET /auth/:token` - Проверка авторизации пользователя

## Деплой на Render.com

1. Подключите репозиторий к Render.com
2. Установите переменные окружения:
   - `BOT_TOKEN=ваш_токен_бота`
3. Настройте webhook в Telegram:
   - URL: `https://ваш-домен.onrender.com/webhook`
