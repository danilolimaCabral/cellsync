import mysql from 'mysql2/promise';

const connectionConfig = {
  host: 'mysql.railway.internal',
  port: 3306,
  user: 'root',
  password: 'kPmsrdOqERKFlhvaWXaWrSEApsAkczkC',
  database: 'railway'
};

async function updatePlans() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connection successful!');
    
    // Update Básico plan
    console.log('\nUpdating Básico plan...');
    await connection.execute(
      'UPDATE plans SET price_monthly = 9700, price_yearly = 97000, max_users = 3, max_products = 1000, max_storage = 2048, ai_imports_limit = 20 WHERE slug = ?',
      ['basico']
    );
    console.log('✅ Básico updated');
    
    // Update Profissional plan
    console.log('Updating Profissional plan...');
    await connection.execute(
      'UPDATE plans SET price_monthly = 19700, price_yearly = 197000, max_users = 10, max_products = 5000, max_storage = 10240, ai_imports_limit = 100 WHERE slug = ?',
      ['profissional']
    );
    console.log('✅ Profissional updated');
    
    // Update Empresarial plan
    console.log('Updating Empresarial plan...');
    await connection.execute(
      'UPDATE plans SET price_monthly = 59900, price_yearly = 599000, max_users = 50, max_products = 50000, max_storage = 102400, ai_imports_limit = -1 WHERE slug = ?',
      ['empresarial']
    );
    console.log('✅ Empresarial updated');
    
    // Verify updates
    console.log('\nVerifying updates...');
    const [plans] = await connection.execute(
      'SELECT id, name, slug, price_monthly, price_yearly FROM plans ORDER BY price_monthly ASC'
    );
    
    console.log('\n📊 Current plans:');
    plans.forEach(plan => {
      const monthlyPrice = (plan.price_monthly / 100).toFixed(2);
      const yearlyPrice = plan.price_yearly ? (plan.price_yearly / 100).toFixed(2) : 'N/A';
      console.log(`  ${plan.name} (${plan.slug}): R$ ${monthlyPrice}/mês | R$ ${yearlyPrice}/ano`);
    });
    
    console.log('\n✅ All plans updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updatePlans();
