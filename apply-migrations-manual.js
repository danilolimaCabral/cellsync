import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function applyMigrations() {
  // Conexão robusta com IP direto (já no .env) e family: 4
  const connection = await createConnection({
    uri: process.env.DATABASE_URL,
    family: 4,
    multipleStatements: true // Permitir múltiplos comandos SQL por arquivo
  });
  
  try {
    console.log('Conectado ao banco. Lendo journal de migrações...');
    
    const journalPath = path.resolve(process.cwd(), 'drizzle/meta/_journal.json');
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    
    // Ordenar migrações por idx
    const entries = journal.entries.sort((a, b) => a.idx - b.idx);
    
    console.log(`Encontradas ${entries.length} migrações para aplicar.`);

    // Criar tabela de controle de migrações se não existir (opcional, mas bom para controle)
    // Aqui vamos aplicar tudo cegamente pois sabemos que o banco está vazio.
    
    for (const entry of entries) {
      const sqlPath = path.resolve(process.cwd(), `drizzle/${entry.tag}.sql`);
      console.log(`Aplicando: ${entry.tag}.sql ...`);
      
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      
      if (!sqlContent.trim()) {
        console.log('  (Arquivo vazio, pulando)');
        continue;
      }

      // Dividir pelos breakpoints do Drizzle
      const statements = sqlContent.split('--> statement-breakpoint');
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
          } catch (err) {
            if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
              console.log('    ⚠️ Tabela/Index já existe, pulando...');
            } else {
              throw err;
            }
          }
        }
      }
      console.log(`  ✅ Sucesso (${statements.length} statements executados)`);
    }

    console.log('Todas as migrações aplicadas com sucesso!');

  } catch (error) {
    console.error('Erro fatal na migração:', error);
  } finally {
    await connection.end();
  }
}

applyMigrations();
