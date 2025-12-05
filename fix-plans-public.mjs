import mysql from 'mysql2/promise';

// Public connection URL from Railway
const databaseUrl = 'mysql://root:kPmsrdOqERKFlhvaWXaWrSEApsAkczkC@switchback.proxy.rlwy.net:32656/railway';

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

async function fixPlans() {
  let connection;
  try {
    console.log('🔄 Conectando ao banco de dados...');
    const config = getDatabaseConfig();
    console.log(`📍 Host: ${config.host}:${config.port}`);
    console.log(`📍 Database: ${config.database}\n`);
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida!\n');
    
    // Get current plans
    console.log('📊 Preços ATUAIS:');
    const [currentPlans] = await connection.execute(
      'SELECT id, name, price_monthly, price_yearly FROM plans ORDER BY id'
    );
    currentPlans.forEach(plan => {
      const monthly = (plan.price_monthly / 100).toFixed(2);
      const yearly = (plan.price_yearly / 100).toFixed(2);
      console.log(`  ${plan.name}: R$ ${monthly}/mês | R$ ${yearly}/ano`);
    });
    
    // Update plans
    console.log('\n🔄 Atualizando preços...\n');
    
    const updates = [
      {
        slug: 'basico',
        name: 'Básico',
        priceMonthly: 9700,
        priceYearly: 97000
      },
      {
        slug: 'profissional',
        name: 'Profissional',
        priceMonthly: 19700,
        priceYearly: 197000
      },
      {
        slug: 'empresarial',
        name: 'Empresarial',
        priceMonthly: 59900,
        priceYearly: 599000
      }
    ];
    
    for (const update of updates) {
      await connection.execute(
        'UPDATE plans SET price_monthly = ?, price_yearly = ? WHERE slug = ?',
        [update.priceMonthly, update.priceYearly, update.slug]
      );
      console.log(`✅ ${update.name}: R$ ${(update.priceMonthly/100).toFixed(2)}/mês`);
    }
    
    // Verify updates
    console.log('\n📊 Preços ATUALIZADOS:');
    const [updatedPlans] = await connection.execute(
      'SELECT id, name, price_monthly, price_yearly FROM plans ORDER BY id'
    );
    updatedPlans.forEach(plan => {
      const monthly = (plan.price_monthly / 100).toFixed(2);
      const yearly = (plan.price_yearly / 100).toFixed(2);
      console.log(`  ${plan.name}: R$ ${monthly}/mês | R$ ${yearly}/ano`);
    });
    
    console.log('\n✅ Preços atualizados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixPlans();
