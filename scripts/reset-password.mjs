import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('❌ Uso: node scripts/reset-password.mjs <email> <nova-senha>');
    console.log('Exemplo: node scripts/reset-password.mjs dlim@ferragensnegrao.com.br senha123');
    process.exit(1);
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Verificar se usuário existe
    const [users] = await conn.query(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ Usuário com email "${email}" não encontrado`);
      process.exit(1);
    }

    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log('');

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await conn.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    console.log('✅ Senha atualizada com sucesso!');
    console.log('');
    console.log('📋 Credenciais de acesso:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${newPassword}`);
    console.log('');
    console.log('🔗 Acesse: https://3000-iob7ye059hwvp4sz9bjn9-f9914a8d.manusvm.computer/login');

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error.message);
  } finally {
    await conn.end();
  }
}

resetPassword();
