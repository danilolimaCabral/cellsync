import { createConnection } from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function runMigration() {
  const sqlPath = path.join(process.cwd(), "drizzle", "0019_lazy_shocker.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");
  const statements = sqlContent.split("--> statement-breakpoint");

  console.log("Connecting to database...");
  // Usar a URL explícita do Railway
  const connection = await createConnection(process.env.DATABASE_URL || 'mysql://root:kPmsrdOqERKFlhvaWXaWrSEApsAkczkC@switchback.proxy.rlwy.net:32656/railway');

  console.log(`Found ${statements.length} statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    console.log(`Executing statement ${i + 1}...`);
    try {
      await connection.query(statement);
      console.log("Success!");
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log("Table already exists. Skipping creation.");
        // Se a tabela já existe, talvez precisemos alterar colunas.
        // Mas por enquanto vamos assumir que se existe, está ok ou vamos lidar depois.
      } else {
        console.error("Error executing statement:", error.message);
      }
    }
  }

  // Adicionar colunas na tabela tenants manualmente se não estiverem no SQL gerado
  // O SQL gerado acima só tem CREATE TABLE para as tabelas de contabilidade.
  // Ele NÃO tem o ALTER TABLE para tenants porque o drizzle-kit generate gera migrações baseadas no diff
  // entre o schema local e o snapshot anterior, não o banco real.
  
  // Vamos verificar se precisamos adicionar colunas em tenants
  try {
    console.log("Checking tenants table columns...");
    const [columns]: any = await connection.query("SHOW COLUMNS FROM tenants LIKE 'address'");
    if (columns.length === 0) {
      console.log("Adding address and phone columns to tenants...");
      await connection.query("ALTER TABLE tenants ADD COLUMN address TEXT, ADD COLUMN phone VARCHAR(20)");
      console.log("Columns added!");
    } else {
      console.log("Columns already exist in tenants.");
    }
  } catch (error: any) {
    console.error("Error checking/altering tenants table:", error.message);
  }

  // Verificar e criar emission_logs se não existir (o SQL gerado não tinha emission_logs???)
  // Ah, o SQL gerado acima NÃO tinha emission_logs. Por que?
  // Talvez porque eu adicionei emission_logs DEPOIS de gerar a migração? Não, eu adicionei antes.
  // Talvez o drizzle-kit generate achou que emission_logs já estava no snapshot?
  
  // Vamos garantir que emission_logs exista
  try {
    console.log("Checking emission_logs table...");
    await connection.query("SELECT 1 FROM emission_logs LIMIT 1");
    console.log("emission_logs table exists.");
  } catch (error: any) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log("Creating emission_logs table...");
      await connection.query(`
        CREATE TABLE IF NOT EXISTS emission_logs (
          id int AUTO_INCREMENT PRIMARY KEY,
          tenantId int NOT NULL DEFAULT 1,
          saleId int,
          type enum('cupom', 'nfe', 'nfce', 'recibo') NOT NULL,
          number int NOT NULL,
          series int NOT NULL DEFAULT 1,
          accessKey varchar(44),
          xmlUrl text,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("emission_logs table created!");
    } else {
      console.error("Error checking emission_logs:", error.message);
    }
  }

  // Atualizar fiscal_settings
  try {
    console.log("Checking fiscal_settings table...");
    
    // Verificar se a tabela existe
    try {
      await connection.query("SELECT 1 FROM fiscal_settings LIMIT 1");
    } catch (error: any) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log("Creating fiscal_settings table...");
        await connection.query(`
          CREATE TABLE IF NOT EXISTS fiscal_settings (
            id int AUTO_INCREMENT PRIMARY KEY,
            tenant_id int NOT NULL UNIQUE,
            environment enum('homologacao', 'producao') NOT NULL DEFAULT 'homologacao',
            csc_token varchar(255),
            csc_id varchar(10),
            next_nfe_number int NOT NULL DEFAULT 1,
            nfe_series int NOT NULL DEFAULT 1,
            next_nfce_number int NOT NULL DEFAULT 1,
            nfce_series int NOT NULL DEFAULT 1,
            simple_national boolean NOT NULL DEFAULT true,
            tax_regime varchar(1) DEFAULT '1',
            default_ncm varchar(8),
            default_cfop_state varchar(4) DEFAULT '5102',
            default_cfop_interstate varchar(4) DEFAULT '6102',
            certificate_id int,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log("fiscal_settings table created!");
        // Se criou agora, não precisa verificar colunas
        await connection.end();
        console.log("Migration completed.");
        return;
      } else {
        throw error;
      }
    }

    // Verificar se a coluna 'series' existe
    const [seriesColumns]: any = await connection.query("SHOW COLUMNS FROM fiscal_settings LIKE 'series'");
    const [nfeSeriesColumns]: any = await connection.query("SHOW COLUMNS FROM fiscal_settings LIKE 'nfe_series'");
    
    if (seriesColumns.length > 0 && nfeSeriesColumns.length === 0) {
      console.log("Renaming 'series' to 'nfe_series'...");
      await connection.query("ALTER TABLE fiscal_settings CHANGE COLUMN series nfe_series INT NOT NULL DEFAULT 1");
      console.log("Column renamed!");
    } else if (nfeSeriesColumns.length === 0) {
      console.log("Adding 'nfe_series' column...");
      await connection.query("ALTER TABLE fiscal_settings ADD COLUMN nfe_series INT NOT NULL DEFAULT 1");
      console.log("Column added!");
    }

    // Verificar next_nfce_number
    const [nfceNumberColumns]: any = await connection.query("SHOW COLUMNS FROM fiscal_settings LIKE 'next_nfce_number'");
    if (nfceNumberColumns.length === 0) {
      console.log("Adding 'next_nfce_number' column...");
      await connection.query("ALTER TABLE fiscal_settings ADD COLUMN next_nfce_number INT NOT NULL DEFAULT 1");
      console.log("Column added!");
    }

    // Verificar nfce_series
    const [nfceSeriesColumns]: any = await connection.query("SHOW COLUMNS FROM fiscal_settings LIKE 'nfce_series'");
    if (nfceSeriesColumns.length === 0) {
      console.log("Adding 'nfce_series' column...");
      await connection.query("ALTER TABLE fiscal_settings ADD COLUMN nfce_series INT NOT NULL DEFAULT 1");
      console.log("Column added!");
    }

  } catch (error: any) {
    console.error("Error updating fiscal_settings:", error.message);
  }

  // Adicionar receipt_footer em fiscal_settings se não existir
  try {
    await connection.execute(`
      ALTER TABLE fiscal_settings 
      ADD COLUMN receipt_footer TEXT;
    `);
    console.log("Added receipt_footer to fiscal_settings");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("receipt_footer already exists in fiscal_settings");
    } else if (e.code === 'ER_NO_SUCH_TABLE') {
      console.log("Table fiscal_settings does not exist, skipping alter");
    } else {
      console.error("Error altering fiscal_settings:", e.message);
    }
  }

  // Adicionar tenantId em invoices se não existir
  try {
    await connection.execute(`
      ALTER TABLE invoices 
      ADD COLUMN tenantId int NOT NULL DEFAULT 1;
    `);
    console.log("Added tenantId to invoices");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("tenantId already exists in invoices");
    } else if (e.code === 'ER_NO_SUCH_TABLE') {
      console.log("Table invoices does not exist, skipping alter");
    } else {
      console.error("Error altering invoices:", e.message);
    }
  }

  await connection.end();
  console.log("Migration completed.");
}

runMigration();
