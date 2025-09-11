const express = require('express');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

// Версия бота
const BOT_VERSION = 'v3.0.0-complete-rewrite';

const app = express();
const PORT = process.env.PORT || 8080;
const BOT_TOKEN = process.env.BOT_TOKEN || '8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4';
const GAME_URL = 'https://botenergy-7to1-production.up.railway.app';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://xqrmedia_db_user:zs1T2CBkIM8CPZvt@energy-cluster.e8cwdia.mongodb.net/?retryWrites=true&w=majority&appName=energy-cluster';
const REF_BONUS = parseInt(process.env.REF_BONUS || '10', 10);
const ADMIN_IDS = [6840451873]; // ID администратора

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.use(express.json());

// Глобальные переменные
let db = null;
let client = null;

// Подключение к MongoDB
async function connectToMongoDB() {
  try {
    console.log('🔄 Подключаемся к MongoDB...');
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    await client.connect();
    db = client.db('energy888');
    console.log('✅ MongoDB подключена');
    
    // Создаем коллекции и индексы
    await initializeDatabase();
    
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
}

// Инициализация базы данных
async function initializeDatabase() {
  try {
    // Создаем коллекции
    const collections = ['users', 'transactions'];
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Коллекция ${collectionName} создана`);
      } catch (e) {
        console.log(`ℹ️ Коллекция ${collectionName} уже существует`);
      }
    }
    
    // Создаем индексы
    try {
      await db.collection('users').createIndex({ telegramId: 1 }, { unique: true });
      await db.collection('users').createIndex({ username: 1 });
      await db.collection('users').createIndex({ referredBy: 1 });
      await db.collection('transactions').createIndex({ userId: 1 });
      await db.collection('transactions').createIndex({ inviterId: 1 });
      console.log('✅ Индексы созданы');
    } catch (e) {
      console.log('ℹ️ Индексы уже существуют');
    }
    
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
  }
}

// Функция отправки сообщения
async function sendMessage(chatId, text, replyMarkup = null) {
  try {
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
    if (!result.ok) {
      console.error('❌ Ошибка отправки сообщения:', result);
    }
    return result;
  } catch (error) {
    console.error('❌ Ошибка при отправке сообщения:', error);
    return null;
  }
}

// Функция отправки фото
async function sendPhoto(chatId, photoUrl, caption = '') {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (!result.ok) {
      console.error('❌ Ошибка отправки фото:', result);
    }
    return result;
  } catch (error) {
    console.error('❌ Ошибка при отправке фото:', error);
    return null;
  }
}

// Сохранение/обновление пользователя в БД
async function saveUserToDB(userId, userData) {
  if (!db) {
    console.error('❌ База данных не подключена');
    return false;
  }
  
  try {
    const result = await db.collection('users').updateOne(
      { telegramId: userId },
      { 
        $set: {
          telegramId: userId,
          username: userData.username,
          firstName: userData.firstName,
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
    
    console.log('💾 Пользователь сохранен в БД:', userId, result.upsertedId ? 'создан' : 'обновлен');
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения пользователя:', error);
    return false;
  }
}

// Получение пользователя из БД
async function getUserFromDB(userId) {
  if (!db) return null;
  
  try {
    return await db.collection('users').findOne({ telegramId: userId });
  } catch (error) {
    console.error('❌ Ошибка получения пользователя:', error);
    return null;
  }
}

// Начисление реферального бонуса
async function processReferralBonus(inviterId, inviteeId, inviteeData) {
  if (!db) return false;
  
  try {
    // Проверяем, что приглашающий существует
    const inviter = await db.collection('users').findOne({ telegramId: inviterId });
    if (!inviter) {
      console.log('❌ Приглашающий не найден:', inviterId);
      return false;
    }
    
    // Проверяем, что приглашенный новый
    const existingUser = await db.collection('users').findOne({ telegramId: inviteeId });
    if (existingUser) {
      console.log('❌ Пользователь уже существует:', inviteeId);
      return false;
    }
    
    // Создаем нового пользователя с реферальной связью
    await db.collection('users').insertOne({
      telegramId: inviteeId,
      username: inviteeData.username,
      firstName: inviteeData.firstName,
      referredBy: inviterId,
      balance: 0,
      referralsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Начисляем бонус приглашающему
    await db.collection('users').updateOne(
      { telegramId: inviterId },
      { 
        $inc: { balance: REF_BONUS, referralsCount: 1 }, 
        $set: { updatedAt: new Date() } 
      }
    );
    
    // Записываем транзакцию
    await db.collection('transactions').insertOne({
      type: 'referral_bonus',
      amount: REF_BONUS,
      inviterId: inviterId,
      inviteeId: inviteeId,
      createdAt: new Date()
    });
    
    // Уведомляем пригласившего
    await sendMessage(inviterId, `🎉 +$${REF_BONUS} за приглашённого @${inviteeData.username || inviteeData.firstName}!`);
    
    console.log('✅ Реферальный бонус начислен:', inviterId, '->', inviteeId);
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка начисления реферального бонуса:', error);
    return false;
  }
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

// Главное меню
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

// Сообщение о доходе
async function getEarnMessage(userId) {
  const user = await getUserFromDB(userId);
  const balance = user ? user.balance : 0;
  const referralsCount = user ? user.referralsCount : 0;
  const refLink = `https://t.me/energy_m_bot?start=ref_${userId}`;

  return `💰 <b>Реферальная программа</b>

💵 <b>Ваш баланс:</b> $${balance}
👥 <b>Приглашено:</b> ${referralsCount} человек

🎮 <b>Стоимость игры: $20</b>
👥 <b>Пригласите друга и играйте бесплатно!</b>

🔗 <b>Ваша ссылка:</b>
<code>${refLink}</code>

💡 <b>Как это работает:</b>
• Отправьте ссылку другу
• Он переходит и жмёт Start
• Вы получаете $${REF_BONUS} на баланс
• Бонусы можно тратить в игре и турнирах

🎯 <b>Начните приглашать прямо сейчас!</b>`;
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
      const username = message.from.username;
      const firstName = message.from.first_name;

      console.log('📱 Обрабатываем сообщение от:', { userId, username, firstName, text });

      // Сохраняем пользователя в БД
      await saveUserToDB(userId, { username, firstName });

      if (text === '/start') {
        // Обычный старт
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
        await sendMessage(chatId, 'Выберите действие:', getMainMenu());
        
        // Отправляем приветственный бонус через 30 секунд
        setTimeout(async () => {
          const user = await getUserFromDB(userId);
          if (user && user.balance === 0) {
            await db.collection('users').updateOne(
              { telegramId: userId },
              { $inc: { balance: REF_BONUS }, $set: { updatedAt: new Date() } }
            );
            
            await db.collection('transactions').insertOne({
              type: 'welcome_bonus',
              amount: REF_BONUS,
              userId: userId,
              createdAt: new Date()
            });
            
            const bonusMessage = `🎉 <b>Добро пожаловать в Energy of Money!</b>

💰 <b>Вы получили $${REF_BONUS} на баланс!</b>

🎮 <b>Стоимость игры: $20</b>
👥 <b>Пригласите друга и играйте бесплатно!</b>

🔗 <b>Ваша реферальная ссылка:</b>
<code>https://t.me/energy_m_bot?start=ref_${userId}</code>

💡 <b>За каждого приглашённого друга вы получите $${REF_BONUS} на баланс!</b>

🚀 Начните играть прямо сейчас!`;
            
            await sendMessage(chatId, bonusMessage, getMainMenu());
          }
        }, 30000);
        
      } else if (text.startsWith('/start ref_')) {
        // Реферальная ссылка
        const refId = text.replace('/start ref_', '');
        const inviterId = parseInt(refId, 10);
        
        if (inviterId && inviterId !== userId) {
          const success = await processReferralBonus(inviterId, userId, { username, firstName });
          if (success) {
            await sendMessage(chatId, `🎉 Добро пожаловать! Вы пришли по приглашению.`, getMainMenu());
          } else {
            await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
            await sendMessage(chatId, 'Выберите действие:', getMainMenu());
          }
        } else {
          await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1DVFh1fEm5CG0crg_OYWKBrLIjnmgwjm8', getWelcomeMessage());
          await sendMessage(chatId, 'Выберите действие:', getMainMenu());
        }
        
      } else if (text === '💰 Доход') {
        await sendPhoto(chatId, 'https://drive.google.com/uc?export=view&id=1P_RJ8gYipADlTL8zHVXmyEdgzTbwJn_8', await getEarnMessage(userId));
        
      } else if (text === '/admin_stats' && ADMIN_IDS.includes(userId)) {
        // Админская статистика
        const users = await db.collection('users').find({}).toArray();
        const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
        const totalReferrals = users.reduce((sum, user) => sum + (user.referralsCount || 0), 0);
        
        const statsMessage = `📊 <b>Статистика бота</b>

👥 Всего пользователей: ${users.length}
💰 Общий баланс: $${totalBalance}
👥 Всего рефералов: ${totalReferrals}
🎯 Средний баланс: $${users.length > 0 ? (totalBalance / users.length).toFixed(2) : 0}`;
        
        await sendMessage(chatId, statsMessage);
        
      } else if (text === '/admin_give_bonus' && ADMIN_IDS.includes(userId)) {
        // Начисление бонусов всем
        await sendMessage(chatId, '🔄 Начинаю начисление бонусов всем пользователям...');
        
        const users = await db.collection('users').find({}).toArray();
        let successCount = 0;
        let errorCount = 0;
        
        for (const user of users) {
          try {
            await db.collection('users').updateOne(
              { telegramId: user.telegramId },
              { $inc: { balance: REF_BONUS }, $set: { updatedAt: new Date() } }
            );
            
            await db.collection('transactions').insertOne({
              type: 'welcome_bonus_retroactive',
              amount: REF_BONUS,
              userId: user.telegramId,
              createdAt: new Date()
            });
            
            const message = `🎉 <b>Специальное предложение!</b>

💰 <b>Вам начислен приветственный бонус $${REF_BONUS}!</b>

🎮 <b>Стоимость игры: $20</b>
👥 <b>Пригласите друга и играйте бесплатно!</b>

🔗 <b>Ваша реферальная ссылка:</b>
<code>https://t.me/energy_m_bot?start=ref_${user.telegramId}</code>

💡 <b>За каждого приглашённого друга вы получите $${REF_BONUS} на баланс!</b>

🚀 Начните играть прямо сейчас!`;
            
            await sendMessage(user.telegramId, message);
            successCount++;
            
            // Задержка между отправками
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`❌ Ошибка для пользователя ${user.telegramId}:`, error);
            errorCount++;
          }
        }
        
        await sendMessage(chatId, `📊 Результат: Начислено ${successCount}, Ошибок ${errorCount}, Всего ${users.length}`);
        
      } else {
        await sendMessage(chatId, '❓ Неизвестная команда. Используй кнопки меню для навигации.', getMainMenu());
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
    users: 0,
    timestamp: new Date().toISOString(),
    version: BOT_VERSION
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    message: `Energy Money Bot v${BOT_VERSION} is running`,
    endpoints: {
      health: '/health',
      webhook: '/webhook'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Получен SIGTERM, завершение работы...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Получен SIGINT, завершение работы...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

// Запуск сервера
async function startServer() {
  try {
    await connectToMongoDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Energy Money Bot v${BOT_VERSION} запущен на порту ${PORT}`);
      console.log(`🤖 Bot Token: ${BOT_TOKEN ? '✅ Установлен' : '❌ Не установлен'}`);
      console.log(`🎮 Game URL: ${GAME_URL}`);
      console.log(`💰 Referral Bonus: $${REF_BONUS}`);
      console.log(`👑 Admin IDs: ${ADMIN_IDS.join(', ')}`);
      console.log(`🌍 Server listening on 0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();
