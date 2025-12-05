import mysql from 'mysql2/promise';

const connectionConfig = {
  host: 'switchback.proxy.rlwy.net',
  port: 32656,
  user: 'root',
  password: 'kPmsrdOqERKFlhvaWXaWrSEApsAkczkC',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Host:', connectionConfig.host);
    console.log('Port:', connectionConfig.port);
    console.log('User:', connectionConfig.user);
    console.log('Database:', connectionConfig.database);
    
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful!', rows);
    
    // Get plans
    const [plans] = await connection.execute('SELECT id, name, slug, price_monthly FROM plans');
    console.log('✅ Plans found:');
    plans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.slug}): R$ ${(plan.price_monthly / 100).toFixed(2)}/mês`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testConnection();
