
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function checkProdUser() {
  console.log('=== VERIFICANDO USUÁRIO DE TESTE ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    const email = 'teste_diagnostico@cellsync.com';
    
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error('❌ Usuário de teste NÃO encontrado neste banco.');
      console.error('CONCLUSÃO: O site em produção está usando OUTRO banco de dados.');
    } else {
      console.log('✅ Usuário de teste ENCONTRADO!');
      console.log('CONCLUSÃO: O site em produção está usando ESTE banco de dados.');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) await connection.end();
  }
}

checkProdUser();
