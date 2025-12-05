import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Carregar .env manualmente para garantir
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Sobrescrever process.env com valores do arquivo
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function checkFullSchema() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('ERRO: DATABASE_URL não encontrada no .env');
    return;
  }

  console.log('URL encontrada:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Log seguro

  try {
    // Usar a URL diretamente na conexão, é mais seguro que fazer parse manual
    console.log('Conectando...');
    const connection = await createConnection(dbUrl);
    console.log('Conexão estabelecida com sucesso!');

    // Listar todas as tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log(`\nEncontradas ${tableNames.length} tabelas no banco de dados:`);
    console.log('---------------------------------------------------');
    
    // Verificar contagem de registros para tabelas críticas
    const criticalTables = [
      'users', 'tenants', 'customers', 'products', 'sales', 
      'stock_items', 'stock_movements', 'service_orders',
      'accounts_payable', 'accounts_receivable', 'chatbot_conversations'
    ];

    for (const table of tableNames) {
      const isCritical = criticalTables.includes(table);
      const marker = isCritical ? '(*)' : '   ';
      
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${marker} ${table.padEnd(30)} : ${rows[0].count} registros`);
      } catch (err) {
        console.log(`${marker} ${table.padEnd(30)} : ERRO ao ler (${err.message})`);
      }
    }
    
    console.log('---------------------------------------------------');
    console.log('(*) Tabelas críticas do sistema');
    
    await connection.end();
    console.log('\nVerificação concluída.');
    
  } catch (error) {
    console.error('Erro fatal ao conectar ou verificar o banco:', error);
  }
}

checkFullSchema();
