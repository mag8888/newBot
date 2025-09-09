# 🔒 Безопасность

## ⚠️ Важно!

**НИКОГДА не показывайте токен бота в открытом виде!**

## 🛡️ Безопасная работа с ботом

### 1. Используйте переменные окружения

```bash
# Создайте .env файл
echo "BOT_TOKEN=your_bot_token_here" > .env
echo "WEBHOOK_URL=https://your-domain.onrender.com/webhook" >> .env
```

### 2. Используйте скрипты для работы с ботом

```bash
# Проверить статус бота
npm run check-bot

# Настроить webhook
npm run setup-webhook
```

### 3. НЕ используйте curl с токеном в открытом виде

❌ **НЕ ДЕЛАЙТЕ ТАК:**
```bash
curl "https://api.telegram.org/botTOKEN/getWebhookInfo"
```

✅ **ДЕЛАЙТЕ ТАК:**
```bash
npm run check-bot
```

## 🔧 Настройка

1. Создайте `.env` файл с вашими токенами
2. Используйте скрипты из `package.json`
3. Никогда не коммитьте `.env` файл в Git

## 📝 Команды

- `npm run check-bot` - проверить статус бота
- `npm run setup-webhook` - настроить webhook
- `npm start` - запустить бота

## 🚨 Если токен скомпрометирован

1. Создайте нового бота через @BotFather
2. Обновите токен в переменных окружения
3. Перезапустите сервис
