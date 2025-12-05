
import { sql } from "drizzle-orm";
import { getDb } from "./db";

export async function migrateTenancy() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Starting tenancy migration...");

  try {
    // 1. Adicionar coluna tenantId nas tabelas principais se não existir
    const tables = [
      "customers", 
      "products", 
      "sales", 
      "stockItems", 
      "stockMovements", 
      "serviceOrders", 
      "accountsPayable", 
      "accountsReceivable",
      "chatbot_conversations",
      "chatbot_messages",
      "chatbot_events"
    ];

    for (const table of tables) {
      try {
        // Verificar se a coluna já existe
        const [columns] = await db.execute(sql`SHOW COLUMNS FROM ${sql.raw(table)} LIKE 'tenantId'`);
        
        if ((columns as any[]).length === 0) {
          console.log(`Adding tenantId to ${table}...`);
          // Adicionar coluna tenantId (nullable por enquanto para não quebrar dados existentes)
          await db.execute(sql`ALTER TABLE ${sql.raw(table)} ADD COLUMN tenantId INT`);
          
          // Atualizar registros existentes para o tenant padrão (ID 1) ou NULL
          // Assumindo que o tenant 1 é o principal/admin
          await db.execute(sql`UPDATE ${sql.raw(table)} SET tenantId = 1 WHERE tenantId IS NULL`);
          
          console.log(`Updated ${table} with default tenantId`);
        } else {
          console.log(`Table ${table} already has tenantId column`);
        }
      } catch (err) {
        console.error(`Error processing table ${table}:`, err);
      }
    }

    console.log("Tenancy migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Executar se chamado diretamente
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateTenancy().then(() => process.exit(0));
}
