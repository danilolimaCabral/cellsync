import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:kPmsrdOqERKFlhvaWXaWrSEApsAkczkC@mysql.railway.internal:3306/railway';

function getDatabaseConfig() {
  const urlMatch = databaseUrl.match(
    /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
  );

  if (!urlMatch) {
    throw new Error("Invalid DATABASE_URL format");
  }

  return {
    user: urlMatch[1],
    password: urlMatch[2],
    host: urlMatch[3],
    port: parseInt(urlMatch[4]),
    database: urlMatch[5]
  };
}

async function testConnection() {
  let connection;
  try {
    console.log('🔄 Attempting to connect to database...');
    const config = getDatabaseConfig();
    console.log(`📍 Host: ${config.host}:${config.port}`);
    console.log(`📍 Database: ${config.database}`);
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM plans');
    console.log(`✅ Query successful! Plans count: ${rows[0].count}`);
    
    // Get plans
    const [plans] = await connection.execute('SELECT id, name, price_monthly FROM plans');
    console.log('\n📊 Current Plans:');
    plans.forEach(plan => {
      const price = (plan.price_monthly / 100).toFixed(2);
      console.log(`  - ${plan.name}: R$ ${price}/mês`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();
