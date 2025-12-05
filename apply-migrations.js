
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function applyMigrations() {
  console.log('Conectando ao banco de dados...');
  let connection;
  try {
    connection = await mysql.createConnection({
      uri: dbUrl,
      multipleStatements: true
    });
    console.log('Conectado!');

    // Criar tabela de controle de migrações se não existir
    await connection.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text,
        created_at bigint
      );
    `);

    // Ler arquivos de migração
    const migrationsDir = path.join(__dirname, 'drizzle');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Encontradas ${files.length} migrações.`);

    for (const file of files) {
      console.log(`Aplicando ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const statements = fileContent.split('--> statement-breakpoint');
      
      for (const sql of statements) {
        if (!sql.trim()) continue;
        
        try {
          await connection.query(sql);
        } catch (err) {
          // Ignorar erro se tabela/coluna já existe
          if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME') {
            console.log(`Objeto já existe, ignorando comando em ${file}.`);
          } else {
            console.error(`Erro ao aplicar comando em ${file}:`, err.message);
            console.error('SQL:', sql.substring(0, 100) + '...');
          }
        }
      }
      console.log(`Migração ${file} processada.`);
    }

    console.log('Todas as migrações processadas.');
    
    // Agora aplicar a migração de tenancy manualmente (adicionar colunas tenantId)
    // pois os arquivos SQL antigos podem não ter essa coluna
    console.log('Aplicando correções de tenancy...');
    
    const tables = [
      "customers", "products", "sales", "stockItems", "stockMovements", 
      "serviceOrders", "accountsPayable", "accountsReceivable",
      "chatbot_conversations", "chatbot_messages", "chatbot_events"
    ];

    for (const table of tables) {
      try {
        // Verificar se coluna existe
        const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'tenantId'`);
        if (columns.length === 0) {
          console.log(`Adicionando tenantId em ${table}...`);
          await connection.query(`ALTER TABLE ${table} ADD COLUMN tenantId INT NOT NULL DEFAULT 1`);
        }
      } catch (err) {
        console.log(`Erro ao verificar/alterar ${table}: ${err.message}`);
      }
    }

    console.log('Processo concluído.');
    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('Erro fatal:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

applyMigrations();
