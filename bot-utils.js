const fetch = require('node-fetch');

// Безопасная работа с Telegram Bot API
class BotUtils {
  constructor() {
    this.botToken = process.env.BOT_TOKEN || '8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // Получить информацию о webhook
  async getWebhookInfo() {
    try {
      const response = await fetch(`${this.apiUrl}/getWebhookInfo`);
      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения webhook info:', error);
      return null;
    }
  }

  // Установить webhook
  async setWebhook(url) {
    try {
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка установки webhook:', error);
      return null;
    }
  }

  // Удалить webhook
  async deleteWebhook() {
    try {
      const response = await fetch(`${this.apiUrl}/deleteWebhook`);
      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка удаления webhook:', error);
      return null;
    }
  }

  // Получить информацию о боте
  async getMe() {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения информации о боте:', error);
      return null;
    }
  }
}

// Если запущен напрямую
if (require.main === module) {
  const bot = new BotUtils();
  
  async function main() {
    console.log('🤖 Проверка бота...');
    
    const me = await bot.getMe();
    if (me && me.ok) {
      console.log('✅ Бот активен:', me.result.first_name, `(@${me.result.username})`);
    } else {
      console.log('❌ Бот неактивен');
      return;
    }

    const webhookInfo = await bot.getWebhookInfo();
    if (webhookInfo && webhookInfo.ok) {
      console.log('📡 Webhook:', webhookInfo.result.url || 'Не установлен');
      console.log('⏳ Ожидающие обновления:', webhookInfo.result.pending_update_count);
    }
  }

  main().catch(console.error);
}

module.exports = BotUtils;
