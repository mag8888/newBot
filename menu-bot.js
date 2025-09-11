const express = require('express');
const fetch = require('node-fetch');

// Версия бота
const BOT_VERSION = 'v2.1.3-ad4f113';

const app = express();
const PORT = process.env.PORT || 8080;
const BOT_TOKEN = process.env.BOT_TOKEN || '8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4';
const GAME_URL = 'https://energy888.onrender.com';

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

// Функция отправки фото с подписью
async function sendPhoto(chatId, photoUrl, caption = '') {
  try {
    console.log('📸 Отправляем фото с подписью:', { chatId, photoUrl, caption: caption.substring(0, 50) + '...' });
    const messageData = {
      chat_id: chatId,
      photo: photoUrl,
      parse_mode: 'HTML'
    };
    if (caption) {
      messageData.caption = caption;
    }
    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    const result = await response.json();
    console.log('📸 Ответ от Telegram API (фото):', result);
    return result;
  } catch (error) {
    console.error('❌ Ошибка отправки фото:', error);
    return null;
  }
}

// Главное меню (Reply Keyboard)
function getMainMenu() {
  return {
    keyboard: [
      [
        { text: '📖 О проекте' },
        { text: '🌐 Сообщество' }
      ],
      [
        { text: '👥 Получить клиентов' }
      ],
      [
        { text: '💰 Доход' },
        { text: '🎮 Играть' }
      ]
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    selective: false
  };
}

// Убрать меню
function removeMenu() {
  return {
    remove_keyboard: true
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

🚀 <b>Начни свой путь к финансовой свободе!</b>

Используй меню внизу для навигации 👇`;
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

🎯 <b>Готов стать мастером?</b>

Нажми кнопку "👥 Получить клиентов" еще раз для подачи заявки!`;
}

// Доход
function getEarnMessage() {
  return `💰 <b>Доход</b>

Хочешь зарабатывать вместе с «<b>Энергией Денег</b>»?  
Стань партнёром проекта и получай доход, играя и помогая другим людям развиваться.

💎 <b>Возможности:</b>
• Партнёрская программа
• Реферальные бонусы
• Совместные проекты
• Монетизация навыков

🚀 <b>Начни зарабатывать уже сегодня!</b>

Нажми кнопку "💰 Доход" еще раз для подачи заявки!`;
}

// Играть
function getPlayMessage() {
  return `🎮 <b>Играть</b>

Готов попробовать? 🎲  
Запускай игру прямо сейчас и прокачивай свои навыки в мире финансовых решений!

🎯 <b>Что тебя ждет:</b>
• Реальные финансовые сценарии
• Развитие стратегического мышления
• Новые знакомства и партнёрства
• Практические навыки управления деньгами

🚀 <b>Начни играть прямо сейчас!</b>

Нажми кнопку "🎮 Играть" еще раз для запуска!`;
}

// Сообщество
function getCommunityMessage() {
  return `🌐 <b>Сообщество</b>

Добро пожаловать в наше сообщество 🌐  
Здесь мы объединяем людей, которые хотят расти, делиться опытом и находить новых друзей, партнёров и клиентов.  
Это место поддержки, энергии и совместного развития.  

<a href="https://t.me/+9FSt-edxR1c3M2Fi">@https://t.me/+9FSt-edxR1c3M2Fi</a>

🎯 <b>Что тебя ждет в сообществе:</b>
• Единомышленники и партнёры
• Обмен опытом и знаниями
• Поддержка в развитии
• Новые возможности для бизнеса

🚀 <b>Присоединяйся к нам!</b>

Используй меню внизу для навигации 👇`;
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

      console.log('📱 Получено сообщение от:', { userId, username: message.from.username, firstName: message.from.first_name, text });

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
      } else if (text === '📖 О проекте') {
        // Отправляем картинку с текстом
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getAboutMessage());
        await sendMessage(chatId, 'Выберите действие:', getMainMenu());
      } else if (text === '🌐 Сообщество') {
        // Отправляем картинку с текстом
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1oZKXefyAPKIgxQ0tYrewUhhb5cewtUWS', getCommunityMessage());
        await sendMessage(chatId, 'Выберите действие:', getMainMenu());
      } else if (text === '👥 Получить клиентов') {
        // Отправляем картинку с текстом
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1P_RJ8gYipADlTL8zHVXmyEdgzTbwJn_8', getClientsMessage());
        
        // Отправляем дополнительное сообщение с заявкой
        setTimeout(async () => {
          await sendMessage(chatId, 
            '🎯 <b>Стать мастером</b>\n\n' +
            '✅ <b>Отлично!</b> С вами свяжется менеджер в ближайшее время.\n\n' +
            '📞 Мы рассмотрим вашу заявку и расскажем о возможностях партнёрства.\n\n' +
            '⏰ Ожидайте звонка в течение 24 часов!',
            getMainMenu()
          );
        }, 2000);
      } else if (text === '💰 Доход') {
        // Отправляем картинку с текстом
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1P_RJ8gYipADlTL8zHVXmyEdgzTbwJn_8', getEarnMessage());
        
        // Отправляем дополнительное сообщение с заявкой
        setTimeout(async () => {
          await sendMessage(chatId, 
            '📝 <b>Оставить заявку</b>\n\n' +
            '✅ <b>Заявка принята!</b> Наш менеджер свяжется с вами для обсуждения возможностей заработка.\n\n' +
            '💼 Мы рассмотрим ваши навыки и предложим подходящие варианты сотрудничества.\n\n' +
            '⏰ Ожидайте звонка в течение 24 часов!',
            getMainMenu()
          );
        }, 2000);
      } else if (text === '🎮 Играть') {
        // Отправляем картинку с текстом
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1TKi83s951WoB4FRONr8DnAITmZ8jCyfA', getPlayMessage());
        
        // Отправляем ссылку на игру
        setTimeout(async () => {
          const userData = users.get(userId);
          if (userData) {
            const authToken = `tg_${userId}_${Date.now()}`;
            
            const gameLink = `${GAME_URL}/simple-auth?auth=telegram&token=${authToken}&user=${encodeURIComponent(JSON.stringify({
              id: userData.id,
              first_name: userData.name,
              username: userData.username,
              photo_url: userData.photo
            }))}&socket=${encodeURIComponent('https://energy888-advanced-socket.onrender.com')}`;

            await sendMessage(chatId, 
              `🎮 <b>Запуск игры</b>\n\n` +
              `👤 Пользователь: ${userData.name}\n` +
              `🆔 ID: ${userData.id}\n\n` +
              `🎯 <a href="${gameLink}">Нажмите здесь чтобы войти в игру</a>\n\n` +
              `Или скопируйте ссылку:\n<code>${gameLink}</code>`,
              getMainMenu()
            );
          } else {
            await sendMessage(chatId, '❌ Ошибка: данные пользователя не найдены', getMainMenu());
          }
        }, 2000);
      } else {
        await sendMessage(chatId, 
          '❓ Неизвестная команда. Используй кнопки меню для навигации.',
          getMainMenu()
        );
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
    name: 'energy-money-menu-bot',
    version: '3.0.0',
    features: ['menu', 'game', 'partnership', 'clients', 'reply_keyboard']
  });
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Menu Bot Server v${BOT_VERSION} запущен на порту ${PORT}`);
  console.log(`🤖 Bot Token: ${BOT_TOKEN ? '✅ Установлен' : '❌ Не установлен'}`);
  console.log(`🎮 Game URL: ${GAME_URL}`);
  console.log(`🌍 Server listening on 0.0.0.0:${PORT}`);
});
