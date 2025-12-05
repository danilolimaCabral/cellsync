import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkLatest() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('--- Último Tenant Cadastrado ---');
    const [tenants] = await connection.execute(
      'SELECT id, name, subdomain, cnpj, status, plan_id, createdAt FROM tenants ORDER BY id DESC LIMIT 1'
    );
    
    if (tenants.length > 0) {
      console.table(tenants);
      const tenantId = tenants[0].id;

      console.log(`\n--- Usuário Admin do Tenant ID ${tenantId} ---`);
      const [users] = await connection.execute(
        'SELECT id, name, email, role, active, createdAt FROM users WHERE tenant_id = ?',
        [tenantId]
      );
      console.table(users);
    } else {
      console.log('Nenhum tenant encontrado.');
    }

  } catch (error) {
    console.error('Erro ao verificar:', error);
  } finally {
    await connection.end();
  }
}

checkLatest();
