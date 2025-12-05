import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function createProbeUser() {
  const uniqueId = Date.now();
  const email = `probe_${uniqueId}@cellsync.com`;
  const password = 'probe_password_123';
  
  console.log(`Criando usuário de sonda: ${email}`);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    // Inserir usuário
    await connection.execute(`
      INSERT INTO users (name, email, password, role, tenant_id, active, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, ['Probe User', email, hashedPassword, 'admin', 1, 1]);
    
    console.log('Usuário de sonda criado com sucesso no banco.');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    await connection.end();
  }
}

createProbeUser();
