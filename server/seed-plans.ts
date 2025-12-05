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
      priceMonthly: 9700, // R$ 97,00
      priceYearly: 97000, // R$ 970,00
      stripePriceIdMonthly: "price_1QaXXXXXXXXXXXXX", // Substituir com ID real do Stripe
      stripePriceIdYearly: "price_1QaYYYYYYYYYYYYY", // Substituir com ID real do Stripe
      maxUsers: 3,
      maxProducts: 1000,
      maxStorage: 2048, // 2GB
      features: ["pdv", "estoque", "os_basica", "relatorios_basicos"],
      aiImportsLimit: 20,
      isActive: true
    },
    {
      name: "Profissional",
      slug: "profissional",
      description: "Para lojas em crescimento com equipe",
      priceMonthly: 19700, // R$ 197,00
      priceYearly: 197000, // R$ 1.970,00
      stripePriceIdMonthly: "price_1QaZZZZZZZZZZZZZ", // Substituir com ID real do Stripe
      stripePriceIdYearly: "price_1QbAAAAAAAAAAAAA", // Substituir com ID real do Stripe
      maxUsers: 10,
      maxProducts: 5000,
      maxStorage: 10240, // 10GB
      features: ["pdv", "estoque", "os_completa", "financeiro", "whatsapp", "relatorios_avancados", "ia_assistente"],
      aiImportsLimit: 100,
      isActive: true
    },
    {
      name: "Empresarial",
      slug: "empresarial",
      description: "Gestão completo para grandes assistências",
      priceMonthly: 59900, // R$ 599,00
      priceYearly: 599000, // R$ 5.990,00
      stripePriceIdMonthly: "price_1QbBBBBBBBBBBBBB", // Substituir com ID real do Stripe
      stripePriceIdYearly: "price_1QbCCCCCCCCCCCCC", // Substituir com ID real do Stripe
      maxUsers: 50,
      maxProducts: 50000,
      maxStorage: 102400, // 100GB
      features: ["pdv", "estoque", "os_completa", "financeiro", "whatsapp", "relatorios_bi", "ia_ilimitada", "api_acesso", "multi_loja", "prioridade_suporte"],
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
