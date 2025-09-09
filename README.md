# Energy of Money - Telegram Bot

Продвинутый Telegram бот для игры "Energy of Money" с функциями меню, партнерства и получения клиентов.

## 🚀 Возможности

- **Нижнее меню** с кнопками навигации
- **Авторизация через Telegram** для игры
- **Интеграция с игрой** Energy of Money
- **Партнерская программа** для получения клиентов
- **Система заработка** с заявками

## 🚀 Деплой на Railway

### Быстрый старт:
1. Перейдите по ссылке: https://railway.com/invite/DkU2aGG6PzW
2. Войдите через GitHub
3. Создайте новый проект
4. Выберите репозиторий `newBot`
5. Настройте переменные окружения
6. Деплой автоматически запустится!

### Переменные окружения для Railway:
```
BOT_TOKEN=ваш_токен_бота
GAME_URL=https://energy888.onrender.com
NODE_ENV=production
```

## 📋 Локальная разработка

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd newBot
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   ```bash
   echo "BOT_TOKEN=ваш_токен_бота" > .env
   echo "GAME_URL=https://energy888.onrender.com" >> .env
   ```

4. **Запустите бота:**
   ```bash
   npm start
   ```

## ⚙️ Переменные окружения

- `BOT_TOKEN` - Токен Telegram бота
- `GAME_URL` - URL игры Energy of Money
- `NODE_ENV` - Окружение (production/development)

## 📱 Использование

1. Найдите бота в Telegram: `@energy_m_bot`
2. Отправьте `/start` для начала работы
3. Используйте нижнее меню для навигации

## 🔧 Скрипты

- `npm start` - Запуск бота
- `npm run dev` - Запуск в режиме разработки
- `npm run check-bot` - Проверка статуса бота
- `npm run setup-webhook` - Настройка webhook

## 📄 Лицензия

MIT License