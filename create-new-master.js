
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function createNewMaster() {
  console.log('=== CRIANDO NOVO USUÁRIO MASTER ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    const email = 'admin@cellsync.com';
    const password = 'admin_master_2025';
    const name = 'Super Admin';
    
    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Verificar se já existe
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.log('Usuário já existe. Atualizando...');
      await connection.execute(
        'UPDATE users SET password = ?, role = ?, name = ?, active = 1 WHERE email = ?',
        [passwordHash, 'master_admin', name, email]
      );
    } else {
      console.log('Criando novo usuário...');
      // Usar tenant 1
      await connection.execute(
        'INSERT INTO users (tenant_id, email, password, name, role, active) VALUES (?, ?, ?, ?, ?, ?)',
        [1, email, passwordHash, name, 'master_admin', 1]
      );
    }
    
    console.log('✅ Usuário criado/atualizado com sucesso!');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (connection) await connection.end();
  }
}

createNewMaster();
