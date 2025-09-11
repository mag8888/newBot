const fetch = require('node-fetch');

async function testWebhook() {
  try {
    console.log('🧪 Тестируем webhook...');
    
    const response = await fetch('https://newbot-production-fa32.up.railway.app/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        update_id: 123456791,
        message: {
          message_id: 3,
          from: {
            id: 999888777,
            is_bot: false,
            first_name: 'Webhook Test',
            username: 'webhooktest'
          },
          chat: {
            id: 999888777,
            first_name: 'Webhook Test',
            username: 'webhooktest',
            type: 'private'
          },
          date: Math.floor(Date.now() / 1000),
          text: '/start'
        }
      })
    });
    
    const result = await response.text();
    console.log('📤 Ответ от webhook:', result);
    
    // Ждем немного и проверяем БД
    console.log('⏳ Ждем 5 секунд...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Проверяем БД
    const { MongoClient } = require('mongodb');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://xqrmedia_db_user:zs1T2CBkIM8CPZvt@energy-cluster.e8cwdia.mongodb.net/?retryWrites=true&w=majority&appName=energy-cluster';
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('energy888');
    
    const users = await db.collection('users').find({}).toArray();
    console.log('👥 Пользователи в БД после теста:', users.length);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.telegramId}, Имя: ${user.firstName}`);
      });
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

testWebhook();
