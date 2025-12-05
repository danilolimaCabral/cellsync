import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function checkConstraints() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('--- Verificando Subdomínio: negrao ---');
    const [subdomainRows] = await connection.execute(
      'SELECT id, name, subdomain FROM tenants WHERE subdomain = ?', 
      ['negrao']
    );
    if (subdomainRows.length > 0) console.table(subdomainRows);
    else console.log('Subdomínio DISPONÍVEL.');

    console.log('\n--- Verificando CNPJ: 76639285000177 ---');
    const [cnpjRows] = await connection.execute(
      'SELECT id, name, cnpj FROM tenants WHERE cnpj = ?', 
      ['76639285000177']
    );
    if (cnpjRows.length > 0) console.table(cnpjRows);
    else console.log('CNPJ DISPONÍVEL.');

    console.log('\n--- Verificando Plano ID: 1 ---');
    const [planRows] = await connection.execute(
      'SELECT id, name, slug FROM plans WHERE id = ?', 
      [1]
    );
    if (planRows.length > 0) console.table(planRows);
    else console.log('ALERTA: Plano ID 1 NÃO ENCONTRADO!');

  } catch (error) {
    console.error('Erro ao verificar:', error);
  } finally {
    await connection.end();
  }
}

checkConstraints();
