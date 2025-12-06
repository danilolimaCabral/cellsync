import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb } from "./db";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log("[Migration] Starting database migrations...");
  const db = await getDb();
  if (!db) {
    console.error("[Migration] Failed to connect to database");
    return;
  }

  try {
    // Caminho para a pasta drizzle onde estão os arquivos SQL
    // server/migrate.ts está em /home/ubuntu/cellsync/server
    // drizzle está em /home/ubuntu/cellsync/drizzle
    const migrationsFolder = path.join(__dirname, "../drizzle");
    
    console.log(`[Migration] Reading migrations from: ${migrationsFolder}`);
    
    // O migrate do drizzle-orm espera que a pasta contenha os arquivos .sql
    await migrate(db, { migrationsFolder });
    
    console.log("[Migration] Migrations completed successfully");
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
  }
}
