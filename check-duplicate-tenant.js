import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkDuplicate() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    const subdomain = 'negrao';
    console.log(`Verificando existência do subdomínio: ${subdomain}`);

    const [rows] = await connection.execute(
      'SELECT id, name, subdomain, status FROM tenants WHERE subdomain = ?', 
      [subdomain]
    );

    if (rows.length > 0) {
      console.log('ALERTA: Subdomínio JÁ EXISTE!');
      console.table(rows);
    } else {
      console.log('Subdomínio disponível (não encontrado no banco).');
    }

  } catch (error) {
    console.error('Erro ao verificar:', error);
  } finally {
    await connection.end();
  }
}

checkDuplicate();
