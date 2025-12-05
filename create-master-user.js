
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs'; // Assumindo que bcryptjs está instalado, se não, usaremos texto plano temporariamente para teste ou instalaremos

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function createMasterUser() {
  console.log('=== CRIANDO USUÁRIO MASTER ADMIN ===');
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Verificar se já existe um master
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['master@cellsync.com']
    );

    const email = 'master@cellsync.com';
    const password = 'master_password_123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Inserir ou Atualizar
    if (existing.length > 0) {
      console.log('Usuário master já existe. Atualizando permissões e senha...');
      await connection.execute(
        'UPDATE users SET role = ?, password = ?, name = ? WHERE email = ?',
        ['master_admin', passwordHash, 'Master Admin', email]
      );
    } else {
      console.log('Criando novo usuário master...');
      const tenantId = 1; 
      
      await connection.execute(
        'INSERT INTO users (tenant_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
        [tenantId, email, passwordHash, 'Master Admin', 'master_admin']
      );
    }
    
    console.log('Usuário master configurado com sucesso.');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);

  } catch (error) {
    console.error('Erro ao criar master user:', error);
  } finally {
    if (connection) await connection.end();
  }
}

createMasterUser();
