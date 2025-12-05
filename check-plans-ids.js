import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkPlanIds() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('IDs dos Planos no Banco:');
    const [rows] = await connection.execute('SELECT id, name, slug FROM plans');
    console.table(rows);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

checkPlanIds();
