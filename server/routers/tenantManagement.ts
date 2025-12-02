import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tenants, users } from "../../drizzle/schema";
import { eq, like, or, desc, asc, count } from "drizzle-orm";

/**
 * Helper para criar procedimentos protegidos
 */
const protectedProcedure = publicProcedure.use(({ ctx, next }: { ctx: any; next: any }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Helper para procedimentos apenas master_admin
 */
const masterAdminProcedure = protectedProcedure.use(({ ctx, next }: { ctx: any; next: any }) => {
  if (ctx.user.role !== "master_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas master_admin pode acessar" });
  }
  return next({ ctx });
});

export const tenantManagementRouter = router({
  /**
   * Listar todos os tenants com filtros e paginação
   */
  list: masterAdminProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(["active", "trial", "suspended", "cancelled"]).optional(),
      planId: z.number().int().positive().optional(),
      sortBy: z.enum(["createdAt", "name", "status"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const offset = (input.page - 1) * input.limit;

      // Construir query com filtros
      let query = db.select().from(tenants);

      // Filtro de busca (nome ou subdomain)
      if (input.search) {
        query = query.where(
          or(
            like(tenants.name, `%${input.search}%`),
            like(tenants.subdomain, `%${input.search}%`)
          )
        ) as any;
      }

      // Filtro de status
      if (input.status) {
        query = query.where(eq(tenants.status, input.status)) as any;
      }

      // Filtro de plano
      if (input.planId) {
        query = query.where(eq(tenants.planId, input.planId)) as any;
      }

      // Ordenação
      if (input.sortBy === "name") {
        query = input.sortOrder === "asc" 
          ? query.orderBy(asc(tenants.name)) as any
          : query.orderBy(desc(tenants.name)) as any;
      } else if (input.sortBy === "status") {
        query = input.sortOrder === "asc"
          ? query.orderBy(asc(tenants.status)) as any
          : query.orderBy(desc(tenants.status)) as any;
      } else {
        query = input.sortOrder === "asc"
          ? query.orderBy(asc(tenants.createdAt)) as any
          : query.orderBy(desc(tenants.createdAt)) as any;
      }

      // Paginação
      const results = await query.limit(input.limit).offset(offset);

      // Contar total
      const totalResult = await db.select({ count: count() }).from(tenants);
      const total = totalResult[0]?.count || 0;

      return {
        tenants: results,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  /**
   * Obter estatísticas gerais de tenants
   */
  stats: masterAdminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Total de tenants
      const totalResult = await db.select({ count: count() }).from(tenants);
      const total = totalResult[0]?.count || 0;

      // Por status
      const activeResult = await db.select({ count: count() }).from(tenants).where(eq(tenants.status, "active"));
      const trialResult = await db.select({ count: count() }).from(tenants).where(eq(tenants.status, "trial"));
      const suspendedResult = await db.select({ count: count() }).from(tenants).where(eq(tenants.status, "suspended"));
      const cancelledResult = await db.select({ count: count() }).from(tenants).where(eq(tenants.status, "cancelled"));

      return {
        total,
        active: activeResult[0]?.count || 0,
        trial: trialResult[0]?.count || 0,
        suspended: suspendedResult[0]?.count || 0,
        cancelled: cancelledResult[0]?.count || 0,
      };
    }),

  /**
   * Obter detalhes de um tenant específico
   */
  getById: masterAdminProcedure
    .input(z.object({
      tenantId: z.number().int().positive(),
    }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.tenantId))
        .limit(1);

      if (!tenant || tenant.length === 0) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Tenant não encontrado" 
        });
      }

      return {
        tenant: tenant[0],
      };
    }),
});
