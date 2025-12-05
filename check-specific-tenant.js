import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkSpecific() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Buscando tenant com subdomínio "negrao"...');
    const [rows] = await connection.execute(
      'SELECT * FROM tenants WHERE subdomain = ? OR name LIKE ?',
      ['negrao', '%NEGRAO%']
    );
    
    if (rows.length > 0) {
      console.log('✅ ENCONTRADO!');
      console.table(rows);
      
      const tenantId = rows[0].id;
      console.log(`Verificando usuários para tenant ${tenantId}...`);
      const [users] = await connection.execute('SELECT * FROM users WHERE tenant_id = ?', [tenantId]);
      console.table(users);
    } else {
      console.log('❌ NÃO ENCONTRADO. O cadastro ainda não foi persistido no banco.');
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

checkSpecific();
