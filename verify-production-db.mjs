import mysql from 'mysql2/promise';

// Configuração do banco de dados (Railway)
const DATABASE_URL = 'mysql://root:YXCNbfZJnIgGEqKTFWvWuGOqNGUoSqVH@mysql.railway.internal:3306/railway';

async function verifyDatabase() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados de produção...\n');
    
    connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('✅ Conectado com sucesso!\n');
    
    // Verificar planos
    console.log('📋 PLANOS CONFIGURADOS:\n');
    const [plans] = await connection.execute('SELECT * FROM plans ORDER BY price ASC');
    
    if (plans.length === 0) {
      console.log('❌ Nenhum plano encontrado no banco de dados!\n');
    } else {
      plans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.name}`);
        console.log(`   Price ID: ${plan.stripe_price_id}`);
        console.log(`   Preço: R$ ${plan.price.toFixed(2)}`);
        console.log(`   Status: ${plan.is_active ? '🟢 Ativo' : '🔴 Inativo'}`);
        console.log('');
      });
    }
    
    // Verificar usuários
    console.log('👥 USUÁRIOS CADASTRADOS:\n');
    const [users] = await connection.execute('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado!\n');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Sem nome'} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    // Verificar assinaturas
    console.log('💳 ASSINATURAS:\n');
    const [subscriptions] = await connection.execute(`
      SELECT s.*, u.email, p.name as plan_name 
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);
    
    if (subscriptions.length === 0) {
      console.log('❌ Nenhuma assinatura encontrada!\n');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.email} - ${sub.plan_name}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Stripe Subscription ID: ${sub.stripe_subscription_id || 'N/A'}`);
        console.log(`   Criado em: ${new Date(sub.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    console.log('✅ Verificação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyDatabase();
