import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function debugInsert() {
  console.log('Conectando ao banco:', process.env.DATABASE_URL);
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    // Parâmetros exatos do erro
    const params = [
      'NEGRAO', // name
      'negrao', // subdomain
      '76639285000177', // cnpj
      1, // plan_id
      'trial', // status
      new Date('2025-12-18 14:23:45.625') // trial_ends_at
    ];

    console.log('Tentando inserir com parâmetros:', params);

    const [result] = await connection.execute(
      `INSERT INTO tenants 
      (name, subdomain, cnpj, plan_id, status, trial_ends_at) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      params
    );
    
    console.log('✅ SUCESSO! Insert funcionou manualmente.');
    console.log('ID gerado:', result.insertId);

  } catch (error) {
    console.error('❌ ERRO DETALHADO:', error);
    console.error('Código:', error.code);
    console.error('Mensagem:', error.sqlMessage);
  } finally {
    await connection.end();
  }
}

debugInsert();
