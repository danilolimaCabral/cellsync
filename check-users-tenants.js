import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkUsersAndTenants() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  console.log('\n=== VERIFICAÇÃO DE TENANTS ===');
  // Verificar estrutura da tabela tenants primeiro
  const [columns] = await connection.execute('SHOW COLUMNS FROM tenants');
  console.log('Colunas da tabela tenants:', columns.map(c => c.Field).join(', '));

  const [tenants] = await connection.execute('SELECT * FROM tenants');
  console.table(tenants);

  console.log('\n=== VERIFICAÇÃO DE USUÁRIOS ===');
  // Verificar estrutura da tabela users
  const [userColumns] = await connection.execute('SHOW COLUMNS FROM users');
  console.log('Colunas da tabela users:', userColumns.map(c => c.Field).join(', '));

  // Tentar adivinhar o nome da coluna de tenant
  const tenantCol = userColumns.find(c => c.Field === 'tenantId' || c.Field === 'tenant_id')?.Field || 'tenant_id';

  const [users] = await connection.execute(`
    SELECT u.id, u.name, u.email, u.role, u.${tenantCol}, t.name as tenantName 
    FROM users u 
    LEFT JOIN tenants t ON u.${tenantCol} = t.id
  `);
  console.table(users);

  console.log('\n=== VERIFICAÇÃO DE CONFIGURAÇÕES DE SISTEMA ===');
  const [configs] = await connection.execute('SELECT * FROM systemSettings');
  if (configs.length === 0) {
    console.log('Nenhuma configuração de sistema encontrada (Tabela vazia).');
  } else {
    console.table(configs);
  }

  await connection.end();
}

checkUsersAndTenants();
