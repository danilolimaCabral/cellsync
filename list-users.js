
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function listUsers() {
  console.log('=== LISTAGEM DE USUÁRIOS ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    const [users] = await connection.execute(
      'SELECT id, name, email, role, tenant_id as tenantId FROM users'
    );

    if (users.length === 0) {
      console.log('Nenhum usuário encontrado.');
    } else {
      console.table(users);
    }

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
  } finally {
    if (connection) await connection.end();
  }
}

listUsers();
