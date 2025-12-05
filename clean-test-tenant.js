import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function cleanTest() {
  const connection = await createConnection(process.env.DATABASE_URL);
  try {
    console.log('Deletando tenant NEGRAO...');
    await connection.execute('DELETE FROM tenants WHERE subdomain = ?', ['negrao']);
    console.log('✅ Tenant deletado. Pode tentar cadastrar novamente.');
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

cleanTest();
