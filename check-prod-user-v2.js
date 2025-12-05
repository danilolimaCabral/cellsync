
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function checkProdUserV2() {
  console.log('=== VERIFICANDO USUÁRIO DE TESTE V2 ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    const email = 'teste_conexao_v2@cellsync.com';
    
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error('❌ Usuário de teste V2 NÃO encontrado neste banco.');
      console.error('CONCLUSÃO: O site em produção AINDA está usando OUTRO banco de dados.');
    } else {
      console.log('✅ Usuário de teste V2 ENCONTRADO!');
      console.log('CONCLUSÃO: O site em produção AGORA está conectado ao banco correto.');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) await connection.end();
  }
}

checkProdUserV2();
