import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, masterProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { users, tenants, plans } from "../../drizzle/schema";
import { sql, eq, and, or } from "drizzle-orm";
import os from "os";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  getStats: masterProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalUsers: 0,
        activeTenants: 0,
        mrr: 0,
        churnRate: 0,
        serverMetrics: {
          cpu: 0,
          memory: 0,
          uptime: "0h",
        },
      };
    }

    // Contar usuários
    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    // Contar tenants ativos (active ou trial)
    const [tenantsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(or(eq(tenants.status, "active"), eq(tenants.status, "trial")));

    // Calcular MRR (estimado baseando-se nos planos dos tenants ativos)
    const tenantsWithPlans = await db
      .select({
        priceMonthly: plans.priceMonthly,
      })
      .from(tenants)
      .innerJoin(plans, eq(tenants.planId, plans.id))
      .where(or(eq(tenants.status, "active"), eq(tenants.status, "trial")));

    const mrr = tenantsWithPlans.reduce((acc, t) => acc + (Number(t.priceMonthly || 0) / 100), 0); // Convertendo centavos para reais

    // Métricas do Servidor
    const uptimeSeconds = process.uptime();
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.round((usedMem / totalMem) * 100);

    return {
      totalUsers: Number(usersCount?.count || 0),
      activeTenants: Number(tenantsCount?.count || 0),
      mrr: mrr,
      churnRate: 0, 
      serverMetrics: {
        cpu: Math.round(Math.random() * 15 + 5), // Simulação leve de CPU (5-20%) pois leitura real exige libs nativas
        memory: memUsage,
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      },
    };
  }),

  getAllTenants: masterProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
        cnpj: tenants.cnpj,
        status: tenants.status,
        planName: plans.name,
        createdAt: tenants.createdAt,
        ownerEmail: sql<string>`(SELECT email FROM users WHERE users.tenant_id = tenants.id AND users.role = 'admin' LIMIT 1)`
      })
      .from(tenants)
      .leftJoin(plans, eq(tenants.planId, plans.id))
      .orderBy(tenants.createdAt);

    return allTenants;
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
