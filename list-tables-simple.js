import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function listTables() {
  const connection = await createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await connection.execute('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);
    console.log(JSON.stringify(tables));
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

listTables();
