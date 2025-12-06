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

    // Tabela chart_of_accounts
    console.log("[Bootstrap] Checking table 'chart_of_accounts'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        account_code VARCHAR(50) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
        parent_account_id INT,
        is_analytical BOOLEAN NOT NULL DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela accounting_postings
    console.log("[Bootstrap] Checking table 'accounting_postings'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accounting_postings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        posting_date DATE NOT NULL,
        posting_number VARCHAR(50) NOT NULL,
        reference_type ENUM('sale', 'purchase', 'payment', 'receipt', 'adjustment') NOT NULL,
        reference_id INT,
        reference_document VARCHAR(100),
        description TEXT,
        status ENUM('draft', 'posted', 'cancelled') NOT NULL DEFAULT 'draft',
        posted_by INT,
        posted_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela accounting_posting_lines
    console.log("[Bootstrap] Checking table 'accounting_posting_lines'...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accounting_posting_lines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        posting_id INT NOT NULL,
        account_id INT NOT NULL,
        debit_amount INT NOT NULL DEFAULT 0,
        credit_amount INT NOT NULL DEFAULT 0,
        description VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

  } catch (error) {
    console.error("[Bootstrap] Database bootstrap failed:", error);
  }
}
