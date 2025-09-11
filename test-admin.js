const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://xqrmedia_db_user:zs1T2CBkIM8CPZvt@energy-cluster.e8cwdia.mongodb.net/?retryWrites=true&w=majority&appName=energy-cluster';

async function testAdmin() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('energy888');
    
    // Показываем всех пользователей
    const users = await db.collection('users').find({}).toArray();
    console.log('👥 Пользователи в базе:', users.length);
    
    if (users.length > 0) {
      console.log('\n📋 Список пользователей:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.telegramId}, Имя: ${user.firstName || 'N/A'}, Баланс: $${user.balance || 0}, Рефералы: ${user.referralsCount || 0}`);
      });
      
      // Показываем статистику
      const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
      const totalReferrals = users.reduce((sum, user) => sum + (user.referralsCount || 0), 0);
      
      console.log('\n📊 Статистика:');
      console.log(`👥 Всего пользователей: ${users.length}`);
      console.log(`💰 Общий баланс: $${totalBalance}`);
      console.log(`👥 Всего рефералов: ${totalReferrals}`);
      console.log(`🎯 Средний баланс: $${users.length > 0 ? (totalBalance / users.length).toFixed(2) : 0}`);
    } else {
      console.log('❌ Пользователей в базе нет');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.close();
  }
}

testAdmin();
