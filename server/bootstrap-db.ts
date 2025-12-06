import { getDb } from "./db";
import { sql } from "drizzle-orm";

export async function bootstrapDatabase() {
  console.log("[Bootstrap] Starting database bootstrap check...");
  const db = await getDb();
  
  if (!db) {
    console.error("[Bootstrap] Failed to connect to database");
    return;
  }

  try {
    // Verificar e criar tabela tenant_modules
    console.log("[Bootstrap] Checking table 'tenant_modules'...");
    
    // Tenta selecionar para ver se existe (maneira mais compatível entre drivers)
    // Ou executa CREATE TABLE IF NOT EXISTS diretamente
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tenant_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        module_id VARCHAR(50) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_tenant_module (tenant_id, module_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log("[Bootstrap] Table 'tenant_modules' verified/created.");

    // Adicionar outras tabelas críticas aqui se necessário no futuro

  } catch (error) {
    console.error("[Bootstrap] Database bootstrap failed:", error);
  }
}
