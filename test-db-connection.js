
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function testConnection() {
  console.log('Tentando conectar ao banco de dados...');
  try {
    const connection = await mysql.createConnection(dbUrl);
    console.log('Conexão bem-sucedida!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao conectar:', error.message);
    console.error('Código:', error.code);
    process.exit(1);
  }
}

testConnection();
