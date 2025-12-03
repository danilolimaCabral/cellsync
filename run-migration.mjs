import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'database.sqlite');
const migrationPath = join(__dirname, 'migrations', 'create_stripe_pending_sessions.sql');

console.log('📦 Executando migration...');
console.log('DB:', dbPath);
console.log('Migration:', migrationPath);

const db = new Database(dbPath);
const sql = readFileSync(migrationPath, 'utf-8');

// Executar cada statement separadamente
const statements = sql.split(';').filter(s => s.trim());

for (const statement of statements) {
  if (statement.trim()) {
    console.log('Executando:', statement.trim().substring(0, 60) + '...');
    db.exec(statement);
  }
}

console.log('✅ Migration executada com sucesso!');
db.close();
