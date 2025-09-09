# 🚀 Инструкции по деплою продвинутого бота

## 📋 Настройки Render.com

### Для существующего сервиса `botEnergy`:

1. **Зайдите в [Render Dashboard](https://dashboard.render.com)**
2. **Найдите сервис `botEnergy`**
3. **Откройте Settings**
4. **Обновите настройки:**

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Root Directory:**
```
newBot
```

**Environment Variables:**
- `BOT_TOKEN` = `8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4`
- `GAME_URL` = `https://energy888.onrender.com`

### Или создайте новый сервис:

1. **New + Web Service**
2. **Connect GitHub:** `mag8888/newBot`
3. **Настройки:**
   - **Name:** `energy-money-advanced-bot`
   - **Root Directory:** `newBot`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `BOT_TOKEN` = `8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4`
     - `GAME_URL` = `https://energy888.onrender.com`

## 🔧 Настройка Webhook

После деплоя настройте webhook:

```bash
curl -X POST "https://api.telegram.org/bot8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-bot-url.onrender.com/webhook"}'
```

## ✅ Проверка

1. **Health Check:** `https://your-bot-url.onrender.com/health`
2. **Тест бота:** Напишите `/start` боту
3. **Проверка меню:** Должны появиться 4 кнопки

## 🎯 Функции продвинутого бота

- 📖 **О проекте** - информация о игре
- 👥 **Получить клиентов** - поиск партнёров
- 💰 **Заработать** - возможности монетизации
- 🎮 **Играть** - запуск игры с авторизацией

## 🔄 Обновление

Для обновления просто запушите изменения в GitHub:
```bash
git add .
git commit -m "Update bot"
git push origin main
```

Render.com автоматически пересоберет и перезапустит сервис.
