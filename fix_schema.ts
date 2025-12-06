import { createPool } from "mysql2/promise";
import { ENV } from "./server/_core/env";

async function main() {
  console.log("Connecting to database...");
  const connection = await createPool({
    uri: ENV.databaseUrl,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  });

  console.log("Creating tenant_modules table...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tenant_modules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      module_id VARCHAR(50) NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_tenant_module (tenant_id, module_id)
    );
  `);

  console.log("Table created successfully!");
  await connection.end();
}

main().catch(console.error);
