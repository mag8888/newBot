const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN || '8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4';
const GAME_URL = 'https://botenergy-7to1-production.up.railway.app';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.use(express.json());

// Хранилище пользователей
const users = new Map();

// Функция отправки сообщения
async function sendMessage(chatId, text, replyMarkup = null) {
  try {
    console.log('📤 Отправляем сообщение:', { chatId, text: text.substring(0, 100) + '...' });
    
    const messageData = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
      messageData.reply_markup = replyMarkup;
    }
    
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    const result = await response.json();
    console.log('📤 Ответ от Telegram API:', result);
    return result;
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    return null;
  }
}

// Функция отправки фото
async function sendPhoto(chatId, photo, caption = '', replyMarkup = null) {
  try {
    const messageData = {
      chat_id: chatId,
      photo: photo,
      caption: caption,
      parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
      messageData.reply_markup = replyMarkup;
    }
    
    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка отправки фото:', error);
    return null;
  }
}

// Функция отправки видео
async function sendVideo(chatId, video, caption = '', replyMarkup = null) {
  try {
    const messageData = {
      chat_id: chatId,
      video: video,
      caption: caption,
      parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
      messageData.reply_markup = replyMarkup;
    }
    
    const response = await fetch(`${TELEGRAM_API}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка отправки видео:', error);
    return null;
  }
}

// Главное меню
function getMainMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📖 О проекте', callback_data: 'about' },
        { text: '👥 Получить клиентов', callback_data: 'clients' }
      ],
      [
        { text: '💰 Заработать', callback_data: 'earn' },
        { text: '🎮 Играть', callback_data: 'play' }
      ]
    ]
  };
}

// Приветственное сообщение
function getWelcomeMessage() {
  return `👋 Привет, друг (или подруга)! 👑

Добро пожаловать в <b>Энергию Денег</b> ✨
— пространство, где игра соединяется с реальными возможностями в квантовом поле.

Здесь ты сможешь:
🫂 Найти друзей
💰 Увеличить доход
🤝 Получить клиентов
🎲 Играть и развиваться

🎯 Выбирай, что интересно прямо сейчас 👇`;
}

// О проекте
function getAboutMessage() {
  return `📖 <b>О проекте</b>

«<b>Энергия Денег</b>» — это новая образовательная игра, созданная на основе принципов CashFlow.  
Она помогает менять мышление, прокачивать навыки и открывать новые финансовые возможности.

🎯 <b>Основные принципы:</b>
• Обучение через игру
• Развитие финансового мышления
• Поиск новых возможностей
• Создание полезных связей

🚀 <b>Начни свой путь к финансовой свободе!</b>`;
}

// Получить клиентов
function getClientsMessage() {
  return `👥 <b>Получить клиентов</b>

Через игру ты можешь находить новых клиентов и партнёров.  
Это современный инструмент продвижения твоего бизнеса и укрепления связей.

💼 <b>Как это работает:</b>
• Играй и развивайся
• Знакомься с единомышленниками
• Находи потенциальных клиентов
• Строй долгосрочные отношения

🎯 <b>Готов стать мастером?</b>`;
}

// Заработать
function getEarnMessage() {
  return `💰 <b>Заработать</b>

Хочешь зарабатывать вместе с «<b>Энергией Денег</b>»?  
Стань партнёром проекта и получай доход, играя и помогая другим людям развиваться.

💎 <b>Возможности:</b>
• Партнёрская программа
• Реферальные бонусы
• Совместные проекты
• Монетизация навыков

🚀 <b>Начни зарабатывать уже сегодня!</b>`;
}

// Обработка webhook
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    console.log('📱 Получено обновление:', update);

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text;

      console.log('📱 Получено сообщение от:', { userId, username: message.from.username, firstName: message.from.first_name });

      // Сохраняем пользователя
      const userData = {
        id: userId,
        name: message.from.first_name || message.from.username || `User${userId}`,
        username: message.from.username,
        photo: message.from.photo_url || ''
      };
      users.set(userId, userData);

      if (text === '/start') {
        await sendMessage(chatId, getWelcomeMessage(), getMainMenu());
      } else if (text === '/help') {
        await sendMessage(chatId, 
          '🆘 <b>Помощь</b>\n\n' +
          'Используй кнопки меню для навигации:\n' +
          '📖 О проекте - узнай больше\n' +
          '👥 Получить клиентов - найди партнёров\n' +
          '💰 Заработать - монетизируй навыки\n' +
          '🎮 Играть - запусти игру\n\n' +
          'Или просто напиши /start для главного меню!',
          getMainMenu()
        );
      } else {
        await sendMessage(chatId, 
          '❓ Неизвестная команда. Используй кнопки меню или /help для помощи.',
          getMainMenu()
        );
      }
    }

    // Обработка callback кнопок
    if (update.callback_query) {
      const callback = update.callback_query;
      const chatId = callback.message.chat.id;
      const userId = callback.from.id;
      const data = callback.data;

      console.log('🔘 Callback получен:', { userId, data, chatId });

      // Отвечаем на callback
      try {
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callback.id,
            text: '✅ Обрабатываем запрос...'
          })
        });
      } catch (error) {
        console.error('❌ Ошибка отправки callback ответа:', error);
      }

      if (data === 'about') {
        await sendMessage(chatId, getAboutMessage(), getMainMenu());
      } else if (data === 'clients') {
        const clientsKeyboard = {
          inline_keyboard: [
            [{ text: '🎯 Стать мастером', callback_data: 'become_master' }],
            [{ text: '🔙 Главное меню', callback_data: 'main_menu' }]
          ]
        };
        await sendMessage(chatId, getClientsMessage(), clientsKeyboard);
      } else if (data === 'earn') {
        const earnKeyboard = {
          inline_keyboard: [
            [{ text: '📝 Оставить заявку', callback_data: 'submit_application' }],
            [{ text: '🔙 Главное меню', callback_data: 'main_menu' }]
          ]
        };
        await sendMessage(chatId, getEarnMessage(), earnKeyboard);
      } else if (data === 'play') {
        const userData = users.get(userId);
        if (userData) {
          const authToken = `tg_${userId}_${Date.now()}`;
          
          const gameLink = `${GAME_URL}/simple-auth?auth=telegram&token=${authToken}&user=${encodeURIComponent(JSON.stringify({
            id: userData.id,
            name: userData.name,
            username: userData.username,
            photo: userData.photo
          }))}`;

          const playKeyboard = {
            inline_keyboard: [
              [{ text: '🎮 Запустить игру', url: gameLink }],
              [{ text: '🔙 Главное меню', callback_data: 'main_menu' }]
            ]
          };

          await sendMessage(chatId, 
            `🎮 <b>Играть</b>\n\n` +
            `Готов попробовать? 🎲\n` +
            `Запускай игру прямо сейчас и прокачивай свои навыки в мире финансовых решений!\n\n` +
            `👤 Пользователь: ${userData.name}\n` +
            `🆔 ID: ${userData.id}`,
            playKeyboard
          );
        } else {
          await sendMessage(chatId, '❌ Ошибка: данные пользователя не найдены', getMainMenu());
        }
      } else if (data === 'become_master') {
        await sendMessage(chatId, 
          '🎯 <b>Стать мастером</b>\n\n' +
          '✅ <b>Отлично!</b> С вами свяжется менеджер в ближайшее время.\n\n' +
          '📞 Мы рассмотрим вашу заявку и расскажем о возможностях партнёрства.\n\n' +
          '⏰ Ожидайте звонка в течение 24 часов!',
          getMainMenu()
        );
      } else if (data === 'submit_application') {
        await sendMessage(chatId, 
          '📝 <b>Оставить заявку</b>\n\n' +
          '✅ <b>Заявка принята!</b> Наш менеджер свяжется с вами для обсуждения возможностей заработка.\n\n' +
          '💼 Мы рассмотрим ваши навыки и предложим подходящие варианты сотрудничества.\n\n' +
          '⏰ Ожидайте звонка в течение 24 часов!',
          getMainMenu()
        );
      } else if (data === 'main_menu') {
        await sendMessage(chatId, getWelcomeMessage(), getMainMenu());
      }
    }

    res.json({ status: 'OK' });
  } catch (error) {
    console.error('❌ Ошибка webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    name: 'energy-money-advanced-bot',
    version: '2.0.0',
    features: ['menu', 'game', 'partnership', 'clients']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Advanced Bot Server запущен на порту ${PORT}`);
  console.log(`🤖 Bot Token: ${BOT_TOKEN ? '✅ Установлен' : '❌ Не установлен'}`);
  console.log(`🎮 Game URL: ${GAME_URL}`);
});
