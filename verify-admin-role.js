
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function verifyAdminRole() {
  console.log('=== VERIFICANDO PERMISSÕES DO ADMIN ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    const email = 'admin@cellsync.com';
    
    const [users] = await connection.execute(
      'SELECT id, name, email, role, active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error('❌ Usuário NÃO encontrado.');
    } else {
      const user = users[0];
      console.log('✅ Usuário encontrado:');
      console.table([user]);
      
      if (user.role === 'master_admin') {
        console.log('✅ CONFIRMADO: Usuário possui permissão TOTAL (master_admin).');
      } else {
        console.error(`❌ ALERTA: Usuário tem permissão '${user.role}', não 'master_admin'.`);
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) await connection.end();
  }
}

verifyAdminRole();
