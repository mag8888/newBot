const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// Telegram Bot
const BOT_TOKEN = process.env.BOT_TOKEN || '8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const GAME_URL = 'https://energy888.onrender.com';

// Middleware
app.use(express.json());

// Хранилище пользователей
const users = new Map(); // userId -> { id, name, photo, authorized }

// Функция отправки сообщения
async function sendMessage(chatId, text, replyMarkup = null) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    return null;
  }
}

// Функция создания кнопки "Играть"
function createPlayButton(userId) {
  return {
    inline_keyboard: [[
      {
        text: '🎮 Играть',
        callback_data: `play_${userId}`
      }
    ]]
  };
}

// Обработка webhook
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const username = message.from.username || message.from.first_name;
      const firstName = message.from.first_name || 'Пользователь';
      const lastName = message.from.last_name || '';
      const photo = message.from.photo_url || '';
      
      console.log('📱 Получено сообщение от:', { userId, username, firstName });
      
      // Сохраняем данные пользователя
      users.set(userId, {
        id: userId,
        name: `${firstName} ${lastName}`.trim(),
        username: username,
        photo: photo,
        authorized: false
      });
      
      const text = message.text;
      
      if (text === '/start') {
        await sendMessage(chatId, 
          `🎮 <b>Добро пожаловать в Energy of Money!</b>\n\n` +
          `Привет, ${firstName}! 👋\n\n` +
          `Это игра про управление деньгами и достижение целей.\n` +
          `Нажмите кнопку "Играть" чтобы начать!`,
          createPlayButton(userId)
        );
      } 
      else if (text === '/help') {
        await sendMessage(chatId, 
          `📋 <b>Помощь</b>\n\n` +
          `/start - Начать игру\n` +
          `/help - Эта справка\n` +
          `/play - Играть\n\n` +
          `Используйте кнопку "Играть" для быстрого входа!`
        );
      }
      else if (text === '/play') {
        await sendMessage(chatId, 
          `🎮 <b>Начинаем игру!</b>\n\n` +
          `Нажмите кнопку "Играть" чтобы войти в лобби!`,
          createPlayButton(userId)
        );
      }
      else {
        await sendMessage(chatId, 
          `❓ Неизвестная команда. Используйте /help для списка команд.`
        );
      }
    }
    
    // Обработка callback кнопок
    if (update.callback_query) {
      const callback = update.callback_query;
      const chatId = callback.message.chat.id;
      const userId = callback.from.id;
      const data = callback.data;
      
      console.log('🔘 Callback получен:', { userId, data });
      
      if (data.startsWith('play_')) {
        const targetUserId = data.split('_')[1];
        
        if (targetUserId == userId) {
          // Получаем данные пользователя
          const userData = users.get(userId);
          
          if (userData) {
            // Авторизуем пользователя
            userData.authorized = true;
            users.set(userId, userData);
            
            // Создаем токен авторизации
            const authToken = `tg_${userId}_${Date.now()}`;
            
            // Отправляем ссылку на лобби с авторизацией
            const gameLink = `${GAME_URL}/simple-rooms?auth=telegram&token=${authToken}&user=${encodeURIComponent(JSON.stringify({
              id: userData.id,
              name: userData.name,
              username: userData.username,
              photo: userData.photo
            }))}`;
            
            await sendMessage(chatId, 
              `✅ <b>Авторизация успешна!</b>\n\n` +
              `👤 Пользователь: ${userData.name}\n` +
              `🆔 ID: ${userData.id}\n\n` +
              `🎮 <a href="${gameLink}">Нажмите здесь чтобы войти в лобби</a>\n\n` +
              `Или скопируйте ссылку:\n<code>${gameLink}</code>`
            );
            
            // Отвечаем на callback
            await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: callback.id,
                text: '✅ Авторизация успешна!'
              })
            });
          } else {
            await sendMessage(chatId, '❌ Ошибка: данные пользователя не найдены');
          }
        } else {
          await sendMessage(chatId, '❌ Ошибка: неверный пользователь');
        }
      }
    }
    
    res.json({ status: 'OK' });
  } catch (error) {
    console.error('❌ Ошибка webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для проверки авторизации
app.get('/auth/:token', (req, res) => {
  const token = req.params.token;
  
  if (token.startsWith('tg_')) {
    const userId = token.split('_')[1];
    const userData = users.get(parseInt(userId));
    
    if (userData && userData.authorized) {
      res.json({
        ok: true,
        authorized: true,
        user: {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          photo: userData.photo
        }
      });
    } else {
      res.json({ ok: false, authorized: false });
    }
  } else {
    res.json({ ok: false, authorized: false });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    uptime: process.uptime(),
    users: users.size,
    timestamp: new Date().toISOString()
  });
});

// Главная страница
app.get('/', (req, res) => {
  res.json({
    name: 'Energy of Money Bot',
    status: 'running',
    users: users.size,
    endpoints: {
      webhook: '/webhook',
      health: '/health',
      auth: '/auth/:token'
    }
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('🚀 Simple Bot Server running on port', PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('🔗 Webhook: http://localhost:' + PORT + '/webhook');
  console.log('🎮 Game URL:', GAME_URL);
  console.log('🤖 Bot Token:', BOT_TOKEN ? '✅ Set' : '❌ Not set');
});

module.exports = app;
