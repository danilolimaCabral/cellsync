/**
 * Script para criar usuário administrador
 * Uso: node scripts/create-admin.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { users } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function createAdmin() {
  console.log("👤 Criando usuário administrador...\n");
  
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    // Criar usuário admin
    await db.insert(users).values({
      email: "admin@cellsync.com",
      password: hashedPassword,
      name: "Administrador",
      role: "admin",
      active: true,
    });
    
    console.log("✅ Usuário administrador criado com sucesso!\n");
    console.log("📧 Email: admin@cellsync.com");
    console.log("🔑 Senha: admin123\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
    console.log("\n💡 Dica: Se o usuário já existe, delete-o primeiro ou use outro email.\n");
    process.exit(1);
  }
}

createAdmin();
