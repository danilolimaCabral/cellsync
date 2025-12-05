import { getDb } from "./db";
import { plans } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seedPlans() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  const defaultPlans = [
    {
      name: "Básico",
      slug: "basico",
      description: "Ideal para pequenas assistências e autônomos",
      priceMonthly: 4990, // R$ 49,90
      priceYearly: 49900, // R$ 499,00
      maxUsers: 2,
      maxProducts: 500,
      maxStorage: 1024, // 1GB
      features: ["pdv", "estoque", "os_basica", "relatorios_basicos"],
      aiImportsLimit: 10,
      isActive: true
    },
    {
      name: "Profissional",
      slug: "profissional",
      description: "Para lojas em crescimento com equipe",
      priceMonthly: 9700, // R$ 97,00
      priceYearly: 97000, // R$ 970,00
      maxUsers: 5,
      maxProducts: 2000,
      maxStorage: 5120, // 5GB
      features: ["pdv", "estoque", "os_completa", "financeiro", "whatsapp", "relatorios_avancados", "ia_assistente"],
      aiImportsLimit: 50,
      isActive: true
    },
    {
      name: "Empresarial",
      slug: "empresarial",
      description: "Gestão completa para grandes assistências",
      priceMonthly: 19700, // R$ 197,00
      priceYearly: 197000, // R$ 1.970,00
      maxUsers: 15,
      maxProducts: 10000,
      maxStorage: 20480, // 20GB
      features: ["pdv", "estoque", "os_completa", "financeiro", "whatsapp", "relatorios_bi", "ia_ilimitada", "api_acesso", "multi_loja"],
      aiImportsLimit: -1, // Ilimitado
      isActive: true
    }
  ];

  console.log("Seeding plans...");

  for (const plan of defaultPlans) {
    const existing = await db.select().from(plans).where(eq(plans.slug, plan.slug));
    
    if (existing.length === 0) {
      console.log(`Creating plan: ${plan.name}`);
      await db.insert(plans).values(plan);
    } else {
      console.log(`Updating plan: ${plan.name}`);
      await db.update(plans).set(plan).where(eq(plans.slug, plan.slug));
    }
  }

  console.log("Plans seeded successfully!");
}

seedPlans().catch(console.error);
