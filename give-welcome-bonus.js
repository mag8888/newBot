const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://xqrmedia_db_user:zs1T2CBkIM8CPZvt@energy-cluster.e8cwdia.mongodb.net/?retryWrites=true&w=majority&appName=energy-cluster';
const BOT_TOKEN = process.env.BOT_TOKEN || '8480976603:AAGwXGSfMAMQkndmNX7JFe2aZDI6zSTXc_4';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const REF_BONUS = 10;

async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    return null;
  }
}

async function giveWelcomeBonus() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('energy888');
    
    // Получаем всех пользователей
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Найдено пользователей: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ Пользователей в базе нет');
      return;
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
          console.log(`✅ Бонус начислен пользователю ${user.telegramId} (${user.firstName || 'N/A'})`);
          successCount++;
        } else {
          console.log(`❌ Ошибка отправки сообщения пользователю ${user.telegramId}`);
          errorCount++;
        }
        
        // Небольшая задержка между отправками
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Ошибка обработки пользователя ${user.telegramId}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Результат:`);
    console.log(`✅ Успешно: ${successCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📈 Всего обработано: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе:', error);
  } finally {
    await client.close();
  }
}

// Запускаем скрипт
giveWelcomeBonus();
