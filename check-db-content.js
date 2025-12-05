
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function checkDbContent() {
  console.log('=== VERIFICANDO CONTEÚDO DO BANCO DE DADOS ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    // Verificar Tenants
    const [tenants] = await connection.execute('SELECT * FROM tenants');
    console.log(`\n🏢 Tenants encontrados: ${tenants.length}`);
    console.table(tenants);

    // Verificar Usuários
    const [users] = await connection.execute('SELECT id, name, email, role, tenant_id FROM users');
    console.log(`\n👤 Usuários encontrados: ${users.length}`);
    console.table(users);

    // Verificar Produtos (Amostra)
    const [products] = await connection.execute('SELECT id, name, price, tenant_id FROM products LIMIT 5');
    console.log(`\n📦 Produtos (Amostra): ${products.length}`);
    if (products.length > 0) console.table(products);

    // Verificar Vendas (Amostra)
    const [sales] = await connection.execute('SELECT id, total_amount, status, tenant_id FROM sales LIMIT 5');
    console.log(`\n💰 Vendas (Amostra): ${sales.length}`);
    if (sales.length > 0) console.table(sales);

  } catch (error) {
    console.error('Erro ao verificar banco:', error);
  } finally {
    if (connection) await connection.end();
  }
}

checkDbContent();
