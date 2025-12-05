import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Carregar .env
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function resetPassword() {
  const email = 'admin@cellsync.com';
  const newPassword = 'admin_master_2025';
  
  console.log(`Iniciando reset de senha para: ${email}`);
  
  // Gerar hash novo
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  console.log('Novo hash gerado com sucesso.');

  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    // Verificar usuário existente
    const [users] = await connection.execute('SELECT id, email, password FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.error('ERRO: Usuário não encontrado!');
      return;
    }

    const user = users[0];
    console.log(`Usuário encontrado: ID ${user.id}`);

    // Atualizar senha
    await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    console.log('Senha atualizada no banco com sucesso!');
    
    // Verificar se a atualização funcionou comparando imediatamente
    const isMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`Verificação local do hash: ${isMatch ? 'OK' : 'FALHOU'}`);

  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
  } finally {
    await connection.end();
  }
}

resetPassword();
