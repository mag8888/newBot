# 🚨 СРОЧНОЕ ОБНОВЛЕНИЕ БОТА

## ❌ Проблема
Бот работает, но не обновился до версии 3.1.0 с кнопкой "Сообщество"

## ✅ Решение

### Вариант 1: Обновить существующий сервис

1. **Зайдите в [Render Dashboard](https://dashboard.render.com)**
2. **Найдите сервис `botEnergy`**
3. **Откройте Settings**
4. **Проверьте настройки:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `newBot`
5. **Нажмите "Save Changes"**
6. **Перейдите в "Manual Deploy"**
7. **Выберите "Deploy latest commit"**

### Вариант 2: Создать новый сервис

1. **New + Web Service**
2. **Connect GitHub:** `mag8888/newBot`
3. **Настройки:**
   - **Name:** `energy-money-menu-bot`
   - **Root Directory:** `newBot`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `BOT_TOKEN` = `8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4`
     - `GAME_URL` = `https://energy888.onrender.com`

## 🔧 Настройка Webhook

После обновления настройте webhook:

```bash
curl -X POST "https://api.telegram.org/bot8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-bot-url.onrender.com/webhook"}'
```

## ✅ Проверка

После обновления проверьте:

1. **Health Check:** `https://your-bot-url.onrender.com/health`
2. **Версия:** `https://your-bot-url.onrender.com/` (должна быть 3.1.0)
3. **Тест бота:** Напишите `/start` боту
4. **Проверка меню:** Должны появиться 5 кнопок с кнопкой "Сообщество"

## 🎯 Ожидаемый результат

```
┌─────────────────────────────────────┐
│  📖 О проекте    │  🌐 Сообщество   │
├─────────────────────────────────────┤
│        👥 Получить клиентов         │
├─────────────────────────────────────┤
│    💰 Заработать  │  🎮 Играть     │
└─────────────────────────────────────┘
```

## 🚨 Если не работает

1. Проверьте логи в Render.com
2. Убедитесь, что webhook настроен правильно
3. Проверьте, что токен бота правильный
4. Попробуйте перезапустить сервис
