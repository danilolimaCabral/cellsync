import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkStructure() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Verificando estrutura da tabela tenants...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM tenants');
    console.table(columns);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

checkStructure();
