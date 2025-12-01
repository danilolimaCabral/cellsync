import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.ts";
import bcrypt from "bcryptjs";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🔐 Criando usuário admin para Bruno...");

const hashedPassword = await bcrypt.hash("bruno@2025", 10);

await db.insert(schema.users).values({
  name: "Bruno",
  email: "bruno@cellsync.com",
  password: hashedPassword,
  role: "admin",
  active: true,
  createdAt: new Date(),
});

console.log("✅ Usuário Bruno criado com sucesso!");
console.log("\n📧 Email: bruno@cellsync.com");
console.log("🔑 Senha: bruno@2025");
console.log("\n⚠️  Recomendação: Altere a senha após o primeiro login!");

await connection.end();
