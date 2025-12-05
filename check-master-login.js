
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function checkMasterLogin() {
  console.log('=== VERIFICANDO LOGIN MASTER ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    const email = 'master@cellsync.com';
    const passwordToCheck = 'master_password_123';

    // 1. Buscar usuário
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error('❌ Usuário master NÃO encontrado no banco de dados.');
      return;
    }

    const user = users[0];
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
      passwordHash: user.password.substring(0, 20) + '...' // Mostrar apenas parte do hash
    });

    // 2. Verificar senha
    const isValid = await bcrypt.compare(passwordToCheck, user.password);
    
    if (isValid) {
      console.log('✅ Senha VÁLIDA. O login deveria funcionar.');
    } else {
      console.error('❌ Senha INVÁLIDA. O hash no banco não corresponde à senha fornecida.');
      
      // Tentar corrigir a senha
      console.log('Tentando redefinir a senha...');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(passwordToCheck, salt);
      
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [newHash, user.id]
      );
      console.log('✅ Senha redefinida com sucesso. Tente logar novamente.');
    }

  } catch (error) {
    console.error('Erro na verificação:', error);
  } finally {
    if (connection) await connection.end();
  }
}

checkMasterLogin();
