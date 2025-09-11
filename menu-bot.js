const express = require('express');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

// Версия бота
const BOT_VERSION = 'v2.3.6-save-users-to-db';

const app = express();
const PORT = process.env.PORT || 8080;
const BOT_TOKEN = process.env.BOT_TOKEN || '8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4';
const GAME_URL = 'https://botenergy-7to1-production.up.railway.app';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy888';
const REF_BONUS = parseInt(process.env.REF_BONUS || '10', 10);
const ADMIN_IDS = [6840451873]; // ID пользователя из скриншота

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.use(express.json());

// MongoDB
let db;
const client = new MongoClient(MONGODB_URI, {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});

async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db('energy888');
    console.log('✅ MongoDB подключена');
    
    // Создаем коллекции если их нет
    try {
      await db.createCollection('users');
      console.log('✅ Коллекция users создана');
    } catch (e) {
      console.log('ℹ️ Коллекция users уже существует');
    }
    
    try {
      await db.createCollection('transactions');
      console.log('✅ Коллекция transactions создана');
    } catch (e) {
      console.log('ℹ️ Коллекция transactions уже существует');
    }
    
    // Создаем индексы для быстрого поиска
    try {
      await db.collection('users').createIndex({ telegramId: 1 }, { unique: true });
      await db.collection('users').createIndex({ username: 1 });
      await db.collection('users').createIndex({ referredBy: 1 });
      console.log('✅ Индексы созданы');
    } catch (e) {
      console.log('ℹ️ Индексы уже существуют');
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
  }
}

connectToMongoDB();

// Хранилище пользователей (кеш)
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

// Функция отправки приветственного бонуса
async function sendWelcomeBonus(chatId, userId) {
  try {
    // Проверяем, что пользователь новый
    const existingUser = await db.collection('users').findOne({ telegramId: userId });
    if (!existingUser) {
      // Создаём пользователя с бонусом
      await db.collection('users').insertOne({
        telegramId: userId,
        balance: REF_BONUS,
        referralsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Записываем транзакцию
      await db.collection('transactions').insertOne({
        type: 'welcome_bonus',
        amount: REF_BONUS,
        userId: userId,
        createdAt: new Date()
      });
      
      // Отправляем сообщение с бонусом
      const bonusMessage = `🎉 <b>Добро пожаловать в Energy of Money!</b>\n\n` +
        `💰 <b>Вы получили $${REF_BONUS} на баланс!</b>\n\n` +
        `🎮 <b>Стоимость игры: $20</b>\n` +
        `👥 <b>Пригласите друга и играйте бесплатно!</b>\n\n` +
        `🔗 <b>Ваша реферальная ссылка:</b>\n` +
        `<code>https://t.me/energy_m_bot?start=ref_${userId}</code>\n\n` +
        `💡 <b>За каждого приглашённого друга вы получите $${REF_BONUS} на баланс!</b>\n\n` +
        `🚀 Начните играть прямо сейчас!`;
      
      await sendMessage(chatId, bonusMessage, getMainMenu());
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке приветственного бонуса:', error);
  }
}

// Функция начисления бонусов всем пользователям (админская)
async function giveWelcomeBonusToAll(db) {
  try {
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Найдено пользователей для начисления бонуса: ${users.length}`);
    
    if (users.length === 0) {
      return { success: 0, errors: 0, message: 'Пользователей в базе нет' };
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Начисляем бонус
        await db.collection('users').updateOne(
          { telegramId: user.telegramId },
          { 
            $inc: { balance: REF_BONUS },
            $set: { updatedAt: new Date() }
          }
        );
        
        // Записываем транзакцию
        await db.collection('transactions').insertOne({
          type: 'welcome_bonus_retroactive',
          amount: REF_BONUS,
          userId: user.telegramId,
          createdAt: new Date()
        });
        
        // Отправляем сообщение
        const message = `🎉 <b>Специальное предложение!</b>\n\n` +
          `💰 <b>Вам начислен приветственный бонус $${REF_BONUS}!</b>\n\n` +
          `🎮 <b>Стоимость игры: $20</b>\n` +
          `👥 <b>Пригласите друга и играйте бесплатно!</b>\n\n` +
          `🔗 <b>Ваша реферальная ссылка:</b>\n` +
          `<code>https://t.me/energy_m_bot?start=ref_${user.telegramId}</code>\n\n` +
          `💡 <b>За каждого приглашённого друга вы получите $${REF_BONUS} на баланс!</b>\n\n` +
          `🚀 Начните играть прямо сейчас!`;
        
        const result = await sendMessage(user.telegramId, message);
        
        if (result && result.ok) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Небольшая задержка между отправками
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Ошибка обработки пользователя ${user.telegramId}:`, error);
        errorCount++;
      }
    }
    
    return { 
      success: successCount, 
      errors: errorCount, 
      total: users.length,
      message: `Начислено бонусов: ${successCount}, Ошибок: ${errorCount}, Всего пользователей: ${users.length}`
    };
    
  } catch (error) {
    console.error('❌ Ошибка начисления бонусов:', error);
    return { success: 0, errors: 0, message: 'Ошибка: ' + error.message };
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

// Доход (реферальная программа)
async function getEarnMessage(userId) {
  const refLink = `https://t.me/energy_m_bot?start=ref_${userId}`;
  
  // Получаем данные пользователя из БД
  let userData = { balance: 0, referralsCount: 0 };
  try {
    if (db) {
      const user = await db.collection('users').findOne({ telegramId: userId });
      if (user) {
        userData = { balance: user.balance || 0, referralsCount: user.referralsCount || 0 };
      }
    }
  } catch (error) {
    console.error('❌ Ошибка получения данных пользователя:', error);
  }
  
  return `💰 <b>Реферальная программа</b>

💵 <b>Ваш баланс:</b> $${userData.balance}
👥 <b>Приглашено:</b> ${userData.referralsCount} человек

🎮 <b>Стоимость игры: $20</b>
👥 <b>Пригласите друга и играйте бесплатно!</b>

🔗 <b>Ваша ссылка:</b>
<code>${refLink}</code>

💡 <b>Как это работает:</b>
• Отправьте ссылку другу
• Он переходит и жмёт Start
• Вы получаете $10 на баланс
• Бонусы можно тратить в игре и турнирах

🎯 <b>Начните приглашать прямо сейчас!</b>`;
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
      
      // Сохраняем/обновляем пользователя в БД
      if (db) {
        try {
          console.log('💾 Сохраняем пользователя в БД:', userId);
          const result = await db.collection('users').updateOne(
            { telegramId: userId },
            { 
              $set: {
                telegramId: userId,
                username: message.from.username,
                firstName: message.from.first_name,
                updatedAt: new Date()
              },
              $setOnInsert: {
                balance: 0,
                referralsCount: 0,
                createdAt: new Date()
              }
            },
            { upsert: true }
          );
          console.log('✅ Пользователь сохранен в БД:', result);
        } catch (error) {
          console.error('❌ Ошибка сохранения пользователя в БД:', error);
        }
      } else {
        console.error('❌ База данных не подключена!');
      }

      if (text === '/start') {
        // Отправляем картинку с приветственным сообщением
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
        await sendMessage(chatId, 'Выберите действие:', getMainMenu());
        // Отправляем приветственный бонус через 30 секунд
        setTimeout(() => {
          sendWelcomeBonus(chatId, userId);
        }, 30000);
      } else if (text.startsWith('/start ref_')) {
        // Обработка реферальной ссылки
        const refId = text.replace('/start ref_', '');
        const inviterId = parseInt(refId, 10);
        if (inviterId && inviterId !== userId) {
          try {
            if (!db) {
              console.error('❌ База данных не подключена');
              await sendMessage(chatId, '❌ Ошибка: база данных не подключена', getMainMenu());
              return;
            }
            // Проверяем, что приглашающий существует
            const inviter = await db.collection('users').findOne({ telegramId: inviterId });
            if (inviter) {
              // Проверяем, что приглашённый новый
              const existingUser = await db.collection('users').findOne({ telegramId: userId });
              if (!existingUser) {
                // Создаём нового пользователя
                await db.collection('users').insertOne({
                  telegramId: userId,
                  username: message.from.username,
                  firstName: message.from.first_name,
                  referredBy: inviterId,
                  balance: 0,
                  referralsCount: 0,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                // Начисляем бонус пригласившему
                await db.collection('users').updateOne(
                  { telegramId: inviterId },
                  { $inc: { balance: REF_BONUS, referralsCount: 1 }, $set: { updatedAt: new Date() } }
                );
                // Записываем транзакцию
                await db.collection('transactions').insertOne({
                  type: 'referral_bonus',
                  amount: REF_BONUS,
                  inviterId,
                  inviteeId: userId,
                  createdAt: new Date()
                });
                // Уведомляем пригласившего
                await sendMessage(inviterId, `🎉 +$${REF_BONUS} за приглашённого @${message.from.username || 'пользователя'}!`);
                // Приветствуем нового пользователя
                await sendMessage(chatId, `🎉 Добро пожаловать! Вы пришли по приглашению.`, getMainMenu());
              } else {
                await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
                await sendMessage(chatId, 'Выберите действие:', getMainMenu());
              }
            } else {
              await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
              await sendMessage(chatId, 'Выберите действие:', getMainMenu());
            }
          } catch (error) {
            console.error('❌ Ошибка обработки реферальной ссылки:', error);
            await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
            await sendMessage(chatId, 'Выберите действие:', getMainMenu());
          }
        } else {
          await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
          await sendMessage(chatId, 'Выберите действие:', getMainMenu());
        }
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
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1P_RJ8gYipADlTL8zHVXmyEdgzTbwJn_8', await getEarnMessage(userId));
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
      } else if (text === '/admin_give_bonus' && ADMIN_IDS.includes(userId)) {
        // Админская команда для начисления бонусов всем пользователям
        await sendMessage(chatId, '🔄 Начинаю начисление бонусов всем пользователям...');
        const result = await giveWelcomeBonusToAll(db);
        await sendMessage(chatId, `📊 Результат: ${result.message}`);
      } else if (text === '/admin_stats' && ADMIN_IDS.includes(userId)) {
        // Админская команда для просмотра статистики
        try {
          const users = await db.collection('users').find({}).toArray();
          const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
          const totalReferrals = users.reduce((sum, user) => sum + (user.referralsCount || 0), 0);
          
          const statsMessage = `📊 <b>Статистика бота</b>\n\n` +
            `👥 Всего пользователей: ${users.length}\n` +
            `💰 Общий баланс: $${totalBalance}\n` +
            `👥 Всего рефералов: ${totalReferrals}\n` +
            `🎯 Средний баланс: $${users.length > 0 ? (totalBalance / users.length).toFixed(2) : 0}`;
          
          await sendMessage(chatId, statsMessage);
        } catch (error) {
          await sendMessage(chatId, '❌ Ошибка получения статистики: ' + error.message);
        }
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
