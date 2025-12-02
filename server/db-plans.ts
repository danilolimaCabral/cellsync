import { getDb } from "./db";
import { plans } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Buscar todos os planos ativos
 */
export async function getPlans() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(plans).where(eq(plans.isActive, true));
  
  // Parsear features de JSON string para array
  return result.map(plan => ({
    ...plan,
    features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
  }));
}

/**
 * Buscar plano por slug
 */
export async function getPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
  return result[0] || null;
}
