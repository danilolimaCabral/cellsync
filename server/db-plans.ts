import * as dbModule from "./db";
const db = (dbModule as any).default || dbModule;
import { plans } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Buscar todos os planos ativos
 */
export async function getPlans() {
  return await db.select().from(plans).where(eq(plans.isActive, true));
}

/**
 * Buscar plano por slug
 */
export async function getPlanBySlug(slug: string) {
  const result = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
  return result[0] || null;
}
