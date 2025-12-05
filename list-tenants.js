
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function listTenants() {
  try {
    const connection = await createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Aceitar certificados auto-assinados do Railway
    });
    const [rows] = await connection.execute('SELECT id, name, subdomain, cnpj, status FROM tenants');
    console.log('--- CLIENTES CADASTRADOS ---');
    console.table(rows);
    await connection.end();
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
  }
}

listTenants();
