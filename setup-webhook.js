#!/usr/bin/env node

const BotUtils = require('./bot-utils');

async function setupWebhook() {
  const bot = new BotUtils();
  
  console.log('🔧 Настройка webhook для бота...');
  
  // Получаем информацию о боте
  const me = await bot.getMe();
  if (!me || !me.ok) {
    console.error('❌ Ошибка: Бот неактивен или токен неверный');
    process.exit(1);
  }
  
  console.log('✅ Бот активен:', me.result.first_name, `(@${me.result.username})`);
  
  // Получаем текущий webhook
  const webhookInfo = await bot.getWebhookInfo();
  if (webhookInfo && webhookInfo.ok) {
    console.log('📡 Текущий webhook:', webhookInfo.result.url || 'Не установлен');
    
    if (webhookInfo.result.pending_update_count > 0) {
      console.log('⚠️  Ожидающие обновления:', webhookInfo.result.pending_update_count);
    }
  }
  
  // Устанавливаем webhook
  const webhookUrl = process.env.WEBHOOK_URL || 'https://botenergy-7to1.onrender.com/webhook';
  console.log('🔗 Устанавливаем webhook:', webhookUrl);
  
  const result = await bot.setWebhook(webhookUrl);
  if (result && result.ok) {
    console.log('✅ Webhook успешно установлен!');
  } else {
    console.error('❌ Ошибка установки webhook:', result);
    process.exit(1);
  }
  
  // Проверяем webhook
  const newWebhookInfo = await bot.getWebhookInfo();
  if (newWebhookInfo && newWebhookInfo.ok) {
    console.log('📡 Новый webhook:', newWebhookInfo.result.url);
    console.log('✅ Настройка завершена!');
  }
}

// Запуск
if (require.main === module) {
  setupWebhook().catch(console.error);
}

module.exports = setupWebhook;
