import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("./local.db");

// Verificar se o usuário Bruno existe
const bruno = db.prepare("SELECT * FROM users WHERE email = ?").get("bruno@cellsync.com");

if (bruno) {
  console.log("✅ Usuário Bruno encontrado:");
  console.log("   ID:", bruno.id);
  console.log("   Email:", bruno.email);
  console.log("   Nome:", bruno.name);
  console.log("   Role:", bruno.role);
  console.log("   Ativo:", bruno.active);
  
  // Testar senha
  const senhaCorreta = await bcrypt.compare("bruno@2025", bruno.password);
  console.log("   Senha válida:", senhaCorreta ? "✅ SIM" : "❌ NÃO");
} else {
  console.log("❌ Usuário Bruno não encontrado!");
  console.log("Criando usuário Bruno...");
  
  const hashedPassword = await bcrypt.hash("bruno@2025", 10);
  
  db.prepare(`
    INSERT INTO users (email, password, name, role, active)
    VALUES (?, ?, ?, ?, ?)
  `).run("bruno@cellsync.com", hashedPassword, "Bruno", "admin", 1);
  
  console.log("✅ Usuário Bruno criado com sucesso!");
  console.log("   Email: bruno@cellsync.com");
  console.log("   Senha: bruno@2025");
}

db.close();
