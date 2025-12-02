import { drizzle } from "drizzle-orm/mysql2";
import { tenants, users } from "./drizzle/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function seedTenants() {
  console.log("🌱 Seeding tenants...");

  try {
    // Criar 5 tenants de teste
    const tenantsData = [
      {
        name: "Loja Centro - São Paulo",
        subdomain: "loja-centro-sp",
        planId: 1, // Básico
        status: "active",
      },
      {
        name: "Loja Shopping Iguatemi",
        subdomain: "loja-iguatemi",
        planId: 2, // Profissional
        status: "active",
      },
      {
        name: "Assistência Técnica Premium",
        subdomain: "assistencia-premium",
        planId: 3, // Empresarial
        status: "active",
      },
      {
        name: "Importadora Cell Tech",
        subdomain: "importadora-celltech",
        planId: 2, // Profissional
        status: "trial",
      },
      {
        name: "Loja Zona Norte - RJ",
        subdomain: "loja-zona-norte-rj",
        planId: 1, // Básico
        status: "suspended",
      },
    ];

    for (const tenantData of tenantsData) {
      const existingTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, tenantData.subdomain))
        .limit(1);

      if (existingTenant.length === 0) {
        await db.insert(tenants).values(tenantData);
        console.log(`✅ Tenant criado: ${tenantData.name}`);
      } else {
        console.log(`⏭️  Tenant já existe: ${tenantData.name}`);
      }
    }

    // Criar um usuário master_admin se não existir
    const masterAdminEmail = "admin@master.com";
    const existingMasterAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, masterAdminEmail))
      .limit(1);

    if (existingMasterAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("master123", 10);
      await db.insert(users).values({
        email: masterAdminEmail,
        password: hashedPassword,
        name: "Master Admin",
        role: "master_admin",
        active: true,
      });
      console.log(`✅ Master admin criado: ${masterAdminEmail} / master123`);
    } else {
      console.log(`⏭️  Master admin já existe: ${masterAdminEmail}`);
    }

    console.log("\n✨ Seed de tenants concluído com sucesso!");
    console.log("\n📝 Credenciais de teste:");
    console.log("   Email: admin@master.com");
    console.log("   Senha: master123");
    console.log("   Role: master_admin");
    
  } catch (error) {
    console.error("❌ Erro ao fazer seed de tenants:", error);
    throw error;
  }
}

seedTenants()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
