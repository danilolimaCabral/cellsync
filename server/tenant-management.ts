/**
 * Procedures de gerenciamento de tenants (Admin Master)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { tenants, users, plans } from "../drizzle/schema";
import { eq, like, or, sql, desc, asc } from "drizzle-orm";

/**
 * Helper para criar procedimentos master admin
 */
const masterAdminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  if (ctx.user.role !== "master_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado - apenas master admin" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Router de gerenciamento de tenants
 */
export const tenantManagementRouter = router({
  /**
   * Lista todos os tenants com filtros e paginação
   */
  list: masterAdminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(["active", "trial", "suspended", "cancelled"]).optional(),
      planId: z.number().optional(),
      sortBy: z.enum(["createdAt", "name", "status"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const offset = (input.page - 1) * input.limit;

      // Construir condições de filtro
      const conditions = [];
      
      if (input.search) {
        conditions.push(
          or(
            like(tenants.name, `%${input.search}%`),
            like(tenants.subdomain, `%${input.search}%`)
          )
        );
      }

      if (input.status) {
        conditions.push(eq(tenants.status, input.status));
      }

      if (input.planId) {
        conditions.push(eq(tenants.planId, input.planId));
      }

      // Query com join de plans
      const tenantsQuery = db
        .select({
          id: tenants.id,
          name: tenants.name,
          subdomain: tenants.subdomain,
          customDomain: tenants.customDomain,
          logo: tenants.logo,
          planId: tenants.planId,
          planName: plans.name,
          planSlug: plans.slug,
          status: tenants.status,
          trialEndsAt: tenants.trialEndsAt,
          stripeCustomerId: tenants.stripeCustomerId,
          stripeSubscriptionId: tenants.stripeSubscriptionId,
          createdAt: tenants.createdAt,
          updatedAt: tenants.updatedAt,
        })
        .from(tenants)
        .leftJoin(plans, eq(tenants.planId, plans.id));

      // Aplicar filtros
      if (conditions.length > 0) {
        conditions.forEach(condition => {
          if (condition) tenantsQuery.where(condition);
        });
      }

      // Aplicar ordenação
      if (input.sortBy === "createdAt") {
        tenantsQuery.orderBy(input.sortOrder === "asc" ? asc(tenants.createdAt) : desc(tenants.createdAt));
      } else if (input.sortBy === "name") {
        tenantsQuery.orderBy(input.sortOrder === "asc" ? asc(tenants.name) : desc(tenants.name));
      } else if (input.sortBy === "status") {
        tenantsQuery.orderBy(input.sortOrder === "asc" ? asc(tenants.status) : desc(tenants.status));
      }

      // Aplicar paginação
      const results = await tenantsQuery.limit(input.limit).offset(offset);

      // Contar total
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tenants);

      // Buscar contagem de usuários por tenant
      const tenantIds = results.map(t => t.id);
      const userCounts = await db
        .select({
          tenantId: users.tenantId,
          count: sql<number>`count(*)`,
        })
        .from(users)
        .where(sql`${users.tenantId} IN (${sql.join(tenantIds, sql`, `)})`)
        .groupBy(users.tenantId);

      const userCountMap = new Map(userCounts.map(uc => [uc.tenantId, Number(uc.count)]));

      // Adicionar informações extras
      const tenantsWithInfo = results.map(tenant => {
        const now = new Date();
        const trialEndsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
        const daysUntilTrialEnd = trialEndsAt
          ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          ...tenant,
          userCount: userCountMap.get(tenant.id) || 0,
          daysUntilTrialEnd,
          isTrialExpired: tenant.status === "trial" && trialEndsAt && trialEndsAt < now,
        };
      });

      return {
        tenants: tenantsWithInfo,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: Number(count),
          totalPages: Math.ceil(Number(count) / input.limit),
        },
      };
    }),

  /**
   * Obtém estatísticas gerais dos tenants
   */
  stats: masterAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Total de tenants
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(tenants);

    // Por status
    const byStatus = await db
      .select({
        status: tenants.status,
        count: sql<number>`count(*)`,
      })
      .from(tenants)
      .groupBy(tenants.status);

    // Por plano
    const byPlan = await db
      .select({
        planId: tenants.planId,
        planName: plans.name,
        count: sql<number>`count(*)`,
      })
      .from(tenants)
      .leftJoin(plans, eq(tenants.planId, plans.id))
      .groupBy(tenants.planId, plans.name);

    // Trials expirando em 7 dias
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const [{ expiringTrials }] = await db
      .select({ expiringTrials: sql<number>`count(*)` })
      .from(tenants)
      .where(
        sql`${tenants.status} = 'trial' AND ${tenants.trialEndsAt} BETWEEN ${now} AND ${sevenDaysFromNow}`
      );

    return {
      total: Number(total),
      byStatus: byStatus.map(s => ({ status: s.status, count: Number(s.count) })),
      byPlan: byPlan.map(p => ({ planId: p.planId, planName: p.planName, count: Number(p.count) })),
      expiringTrials: Number(expiringTrials),
    };
  }),

  /**
   * Obtém detalhes de um tenant específico
   */
  getById: masterAdminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [tenant] = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          subdomain: tenants.subdomain,
          customDomain: tenants.customDomain,
          logo: tenants.logo,
          planId: tenants.planId,
          planName: plans.name,
          planSlug: plans.slug,
          status: tenants.status,
          trialEndsAt: tenants.trialEndsAt,
          stripeCustomerId: tenants.stripeCustomerId,
          stripeSubscriptionId: tenants.stripeSubscriptionId,
          createdAt: tenants.createdAt,
          updatedAt: tenants.updatedAt,
        })
        .from(tenants)
        .leftJoin(plans, eq(tenants.planId, plans.id))
        .where(eq(tenants.id, input.id))
        .limit(1);

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado" });
      }

      // Buscar usuários do tenant
      const tenantUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          active: users.active,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(eq(users.tenantId, input.id));

      return {
        ...tenant,
        users: tenantUsers,
      };
    }),

  /**
   * Atualiza status de um tenant
   */
  updateStatus: masterAdminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "trial", "suspended", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(tenants)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(tenants.id, input.id));

      return { success: true, message: "Status atualizado com sucesso" };
    }),

  /**
   * Suspende um tenant
   */
  suspend: masterAdminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(tenants)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(tenants.id, input.id));

      return { success: true, message: "Tenant suspenso com sucesso" };
    }),

  /**
   * Reativa um tenant
   */
  reactivate: masterAdminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(tenants)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(tenants.id, input.id));

      return { success: true, message: "Tenant reativado com sucesso" };
    }),
});
