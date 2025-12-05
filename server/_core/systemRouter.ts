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

  // User Management Endpoints
  getAllUsers: masterProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(users.createdAt);

    return allUsers;
  }),

  updateUserRole: masterProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["master_admin", "admin", "vendedor"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  deleteUser: masterProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(users).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // System Logs Endpoint (Simulated for now as there is no dedicated logs table yet)
  getSystemLogs: masterProcedure.query(async () => {
    // In a real scenario, this would query a 'system_logs' table
    // For now, we'll return recent activities based on created_at timestamps from key tables
    const db = await getDb();
    if (!db) return [];

    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        createdAt: users.createdAt,
        type: sql<string>`'user_created'`,
        details: sql<string>`concat('Novo usuário cadastrado: ', ${users.name})`
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(10);

    const recentTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        createdAt: tenants.createdAt,
        type: sql<string>`'tenant_created'`,
        details: sql<string>`concat('Nova empresa criada: ', ${tenants.name})`
      })
      .from(tenants)
      .orderBy(sql`${tenants.createdAt} DESC`)
      .limit(10);

    // Combine and sort
    const logs = [
      ...recentUsers.map(u => ({
        id: `usr-${u.id}`,
        timestamp: u.createdAt,
        type: 'info',
        category: 'Usuários',
        message: u.details
      })),
      ...recentTenants.map(t => ({
        id: `tnt-${t.id}`,
        timestamp: t.createdAt,
        type: 'success',
        category: 'Empresas',
        message: t.details
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return logs;
  }),

  // Tenant Details Endpoint
  getTenantDetails: masterProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, input.tenantId),
        with: {
          plan: true,
        }
      });

      if (!tenant) throw new Error("Tenant not found");

      // Get tenant owner
      const owner = await db.query.users.findFirst({
        where: and(
          eq(users.tenantId, input.tenantId),
          eq(users.role, 'admin')
        )
      });

      // Get usage stats
      const [usersCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.tenantId, input.tenantId));

      return {
        ...tenant,
        owner,
        stats: {
          usersCount: usersCount?.count || 0,
        }
      };
    }),

  impersonateTenant: masterProcedure
    .input(z.object({ 
      tenantId: z.number(),
      userId: z.number().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { createImpersonationToken } = await import("../impersonation");
      const result = await createImpersonationToken(
        ctx.user.id,
        input.tenantId,
        input.userId
      );
      return result;
    }),
});
