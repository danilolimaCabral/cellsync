/**
 * Migration: Update Plans Pricing
 * 
 * This migration updates the pricing for all plans to the correct values:
 * - Básico: R$ 97,00/mês
 * - Profissional: R$ 197,00/mês
 * - Empresarial: R$ 599,00/mês
 */

import { getDb } from "../db";
import { plans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function migrateUpdatePlansPricing() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  console.log("🔄 Starting plans pricing migration...");

  const updates = [
    {
      slug: "basico",
      data: {
        priceMonthly: 9700, // R$ 97,00
        priceYearly: 97000, // R$ 970,00
        maxUsers: 3,
        maxProducts: 1000,
        maxStorage: 2048,
        aiImportsLimit: 20,
      }
    },
    {
      slug: "profissional",
      data: {
        priceMonthly: 19700, // R$ 197,00
        priceYearly: 197000, // R$ 1.970,00
        maxUsers: 10,
        maxProducts: 5000,
        maxStorage: 10240,
        aiImportsLimit: 100,
      }
    },
    {
      slug: "empresarial",
      data: {
        priceMonthly: 59900, // R$ 599,00
        priceYearly: 599000, // R$ 5.990,00
        maxUsers: 50,
        maxProducts: 50000,
        maxStorage: 102400,
        aiImportsLimit: -1, // Unlimited
      }
    }
  ];

  for (const update of updates) {
    try {
      await db
        .update(plans)
        .set(update.data)
        .where(eq(plans.slug, update.slug));
      
      console.log(`✅ Updated ${update.slug} plan`);
    } catch (error) {
      console.error(`❌ Failed to update ${update.slug}:`, error);
      throw error;
    }
  }

  // Verify updates
  const allPlans = await db.select().from(plans);
  console.log("\n📊 Current plans:");
  allPlans.forEach(plan => {
    const monthlyPrice = (plan.priceMonthly / 100).toFixed(2);
    const yearlyPrice = plan.priceYearly ? (plan.priceYearly / 100).toFixed(2) : "N/A";
    console.log(`  ${plan.name}: R$ ${monthlyPrice}/mês | R$ ${yearlyPrice}/ano`);
  });

  console.log("\n✅ Migration completed successfully!");
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUpdatePlansPricing()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
