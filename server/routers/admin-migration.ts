/**
 * Admin Migration Router
 * 
 * Provides endpoints for system administrators to run migrations and fix data issues.
 * Requires master_admin role for security.
 */

import { router, masterProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { plans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const adminMigrationRouter = router({
  /**
   * Update plans pricing to correct values
   * 
   * Fixes:
   * - Básico: R$ 97,00/mês
   * - Profissional: R$ 197,00/mês
   * - Empresarial: R$ 599,00/mês
   */
  updatePlansPricing: masterProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    console.log(`🔄 [${new Date().toISOString()}] Starting plans pricing update...`);

    const updates = [
      {
        slug: "basico",
        name: "Básico",
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
        name: "Profissional",
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
        name: "Empresarial",
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

    const results = [];

    for (const update of updates) {
      try {
        const result = await db
          .update(plans)
          .set(update.data)
          .where(eq(plans.slug, update.slug));
        
        console.log(`✅ Updated ${update.name} plan`);
        results.push({
          plan: update.name,
          slug: update.slug,
          status: "success",
          data: update.data
        });
      } catch (error) {
        console.error(`❌ Failed to update ${update.name}:`, error);
        results.push({
          plan: update.name,
          slug: update.slug,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Verify updates
    try {
      const allPlans = await db.select().from(plans);
      console.log("\n📊 Current plans after update:");
      allPlans.forEach(plan => {
        const monthlyPrice = (plan.priceMonthly / 100).toFixed(2);
        const yearlyPrice = plan.priceYearly ? (plan.priceYearly / 100).toFixed(2) : "N/A";
        console.log(`  ${plan.name}: R$ ${monthlyPrice}/mês | R$ ${yearlyPrice}/ano`);
      });
    } catch (error) {
      console.error("Failed to verify updates:", error);
    }

    return {
      success: results.every(r => r.status === "success"),
      timestamp: new Date().toISOString(),
      results
    };
  }),

  /**
   * Get current plans pricing
   */
  getPlans: masterProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    const allPlans = await db.select().from(plans);
    return allPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      maxUsers: plan.maxUsers,
      maxProducts: plan.maxProducts,
      maxStorage: plan.maxStorage,
      aiImportsLimit: plan.aiImportsLimit,
      isActive: plan.isActive
    }));
  })
});
