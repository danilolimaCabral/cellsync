import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkSettings() {
  const connection = await createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await connection.execute('SELECT * FROM systemSettings');
    console.log('Configurações encontradas:', rows);
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkSettings();
