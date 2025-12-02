/**
 * Admin Master - Endpoints para gerenciar todos os tenants (clientes) do sistema SaaS
 */

import { getDb } from "./db";
import { tenants, plans, users } from "../drizzle/schema";
import { eq, sql, desc, and } from "drizzle-orm";

/**
 * Obter todos os tenants com informações do plano
 */
export async function getAllTenants() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      subdomain: tenants.subdomain,
      customDomain: tenants.customDomain,
      logo: tenants.logo,
      status: tenants.status,
      trialEndsAt: tenants.trialEndsAt,
      createdAt: tenants.createdAt,
      planName: plans.name,
      planSlug: plans.slug,
      priceMonthly: plans.priceMonthly,
    })
    .from(tenants)
    .leftJoin(plans, eq(tenants.planId, plans.id))
    .orderBy(desc(tenants.createdAt));
  
  return result;
}

/**
 * Obter métricas do painel admin master
 */
export async function getAdminMetrics() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Total de clientes
  const totalClientsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenants);
  const totalClients = Number(totalClientsResult[0]?.count || 0);
  
  // Clientes ativos
  const activeClientsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenants)
    .where(eq(tenants.status, "active"));
  const activeClients = Number(activeClientsResult[0]?.count || 0);
  
  // Novos clientes este mês
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  
  const newThisMonthResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenants)
    .where(sql`${tenants.createdAt} >= ${firstDayOfMonth}`);
  const newThisMonth = Number(newThisMonthResult[0]?.count || 0);
  
  // Calcular MRR (Monthly Recurring Revenue)
  const mrrResult = await db
    .select({
      totalMrr: sql<number>`SUM(${plans.priceMonthly})`,
    })
    .from(tenants)
    .leftJoin(plans, eq(tenants.planId, plans.id))
    .where(eq(tenants.status, "active"));
  
  const mrr = Number(mrrResult[0]?.totalMrr || 0) / 100; // Converter centavos para reais
  
  // Calcular ARR (Annual Recurring Revenue)
  const arr = mrr * 12;
  
  // Taxa de churn (simplificado - cancelados no último mês / total do mês anterior)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setDate(1);
  lastMonth.setHours(0, 0, 0, 0);
  
  const churnedResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenants)
    .where(
      and(
        eq(tenants.status, "cancelled"),
        sql`${tenants.updatedAt} >= ${lastMonth}`
      )
    );
  const churned = Number(churnedResult[0]?.count || 0);
  
  const churnRate = totalClients > 0 ? (churned / totalClients) * 100 : 0;
  
  return {
    totalClients,
    activeClients,
    newThisMonth,
    mrr,
    arr,
    churnRate: Number(churnRate.toFixed(2)),
  };
}

/**
 * Ativar um tenant
 */
export async function activateTenant(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db
    .update(tenants)
    .set({ status: "active" })
    .where(eq(tenants.id, tenantId));
  
  return { success: true };
}

/**
 * Desativar um tenant
 */
export async function deactivateTenant(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db
    .update(tenants)
    .set({ status: "suspended" })
    .where(eq(tenants.id, tenantId));
  
  return { success: true };
}

/**
 * Cancelar um tenant
 */
export async function cancelTenant(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db
    .update(tenants)
    .set({ status: "cancelled" })
    .where(eq(tenants.id, tenantId));
  
  return { success: true };
}

/**
 * Obter crescimento de clientes por mês (últimos 6 meses)
 */
export async function getClientGrowth() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const result = await db
    .select({
      month: sql<string>`DATE_FORMAT(${tenants.createdAt}, '%Y-%m')`,
      count: sql<number>`COUNT(*)`,
    })
    .from(tenants)
    .where(sql`${tenants.createdAt} >= ${sixMonthsAgo}`)
    .groupBy(sql`DATE_FORMAT(${tenants.createdAt}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${tenants.createdAt}, '%Y-%m')`);
  
  return result.map((r) => ({
    month: r.month,
    count: Number(r.count),
  }));
}

/**
 * Obter receita mensal (últimos 6 meses)
 */
export async function getMonthlyRevenue() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const result = await db
    .select({
      month: sql<string>`DATE_FORMAT(${tenants.createdAt}, '%Y-%m')`,
      revenue: sql<number>`SUM(${plans.priceMonthly})`,
    })
    .from(tenants)
    .leftJoin(plans, eq(tenants.planId, plans.id))
    .where(
      and(
        sql`${tenants.createdAt} >= ${sixMonthsAgo}`,
        eq(tenants.status, "active")
      )
    )
    .groupBy(sql`DATE_FORMAT(${tenants.createdAt}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${tenants.createdAt}, '%Y-%m')`);
  
  return result.map((r) => ({
    month: r.month,
    revenue: Number(r.revenue || 0) / 100, // Converter centavos para reais
  }));
}
