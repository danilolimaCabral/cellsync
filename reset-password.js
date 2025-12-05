
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function resetPassword() {
  console.log('=== REDEFININDO SENHA MASTER ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    const email = 'master@cellsync.com';
    const newPassword = '123456';
    
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [newHash, email]
    );
    
    console.log(`✅ Senha redefinida para: ${newPassword}`);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) await connection.end();
  }
}

resetPassword();
