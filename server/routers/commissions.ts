import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { commissions, users, sales, accountsPayable } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, inArray } from "drizzle-orm";

/**
 * Router de gestão de comissões
 */
export const commissionsRouter = router({
  /**
   * Lista comissões com filtros
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["pendente", "aprovada", "paga", "cancelada"]).optional(),
      userId: z.number().optional(), // Filtrar por vendedor
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      tenantId: z.number().optional(), // master_admin pode filtrar por tenant
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input?.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      // Construir condições de filtro
      const conditions = [eq(commissions.tenantId, targetTenantId)];

      if (input?.status) {
        conditions.push(eq(commissions.status, input.status));
      }

      if (input?.userId) {
        conditions.push(eq(commissions.userId, input.userId));
      }

      if (input?.startDate) {
        conditions.push(gte(commissions.createdAt, new Date(input.startDate)));
      }

      if (input?.endDate) {
        conditions.push(lte(commissions.createdAt, new Date(input.endDate)));
      }

      // Buscar comissões com dados do vendedor
      const result = await db
        .select({
          id: commissions.id,
          userId: commissions.userId,
          userName: users.name,
          saleId: commissions.saleId,
          amount: commissions.amount,
          baseAmount: commissions.baseAmount,
          percentage: commissions.percentage,
          ruleId: commissions.ruleId,
          status: commissions.status,
          approvedBy: commissions.approvedBy,
          approvedAt: commissions.approvedAt,
          paidAt: commissions.paidAt,
          paymentId: commissions.paymentId,
          notes: commissions.notes,
          createdAt: commissions.createdAt,
        })
        .from(commissions)
        .innerJoin(users, eq(commissions.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(commissions.createdAt));

      return result;
    }),

  /**
   * Obtém estatísticas de comissões
   */
  stats: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      tenantId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input?.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      const conditions = [eq(commissions.tenantId, targetTenantId)];

      if (input?.userId) {
        conditions.push(eq(commissions.userId, input.userId));
      }

      if (input?.startDate) {
        conditions.push(gte(commissions.createdAt, new Date(input.startDate)));
      }

      if (input?.endDate) {
        conditions.push(lte(commissions.createdAt, new Date(input.endDate)));
      }

      // Estatísticas gerais
      const statsResult = await db
        .select({
          totalPendente: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.status} = 'pendente' THEN ${commissions.amount} ELSE 0 END), 0)`,
          totalAprovada: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.status} = 'aprovada' THEN ${commissions.amount} ELSE 0 END), 0)`,
          totalPaga: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.status} = 'paga' THEN ${commissions.amount} ELSE 0 END), 0)`,
          countPendente: sql<number>`COUNT(CASE WHEN ${commissions.status} = 'pendente' THEN 1 END)`,
          countAprovada: sql<number>`COUNT(CASE WHEN ${commissions.status} = 'aprovada' THEN 1 END)`,
          countPaga: sql<number>`COUNT(CASE WHEN ${commissions.status} = 'paga' THEN 1 END)`,
        })
        .from(commissions)
        .where(and(...conditions));

      const stats = statsResult[0];

      return {
        totalPendente: Number(stats.totalPendente),
        totalAprovada: Number(stats.totalAprovada),
        totalPaga: Number(stats.totalPaga),
        countPendente: Number(stats.countPendente),
        countAprovada: Number(stats.countAprovada),
        countPaga: Number(stats.countPaga),
      };
    }),

  /**
   * Obtém comissões por vendedor
   */
  byVendor: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      tenantId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input?.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      const conditions = [eq(commissions.tenantId, targetTenantId)];

      if (input?.startDate) {
        conditions.push(gte(commissions.createdAt, new Date(input.startDate)));
      }

      if (input?.endDate) {
        conditions.push(lte(commissions.createdAt, new Date(input.endDate)));
      }

      const result = await db
        .select({
          userId: commissions.userId,
          userName: users.name,
          totalComissoes: sql<number>`COALESCE(SUM(${commissions.amount}), 0)`,
          totalPendente: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.status} = 'pendente' THEN ${commissions.amount} ELSE 0 END), 0)`,
          totalAprovada: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.status} = 'aprovada' THEN ${commissions.amount} ELSE 0 END), 0)`,
          totalPaga: sql<number>`COALESCE(SUM(CASE WHEN ${commissions.status} = 'paga' THEN ${commissions.amount} ELSE 0 END), 0)`,
          countComissoes: sql<number>`COUNT(*)`,
        })
        .from(commissions)
        .innerJoin(users, eq(commissions.userId, users.id))
        .where(and(...conditions))
        .groupBy(commissions.userId, users.name)
        .orderBy(desc(sql`COALESCE(SUM(${commissions.amount}), 0)`));

      return result.map(r => ({
        userId: r.userId,
        userName: r.userName,
        totalComissoes: Number(r.totalComissoes),
        totalPendente: Number(r.totalPendente),
        totalAprovada: Number(r.totalAprovada),
        totalPaga: Number(r.totalPaga),
        countComissoes: Number(r.countComissoes),
      }));
    }),

  /**
   * Aprova comissões (apenas gerentes e admins)
   */
  approve: protectedProcedure
    .input(z.object({
      commissionIds: z.array(z.number()),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;

      // Verificar permissão
      if (user.role !== "gerente" && user.role !== "admin" && user.role !== "master_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gerentes e administradores podem aprovar comissões",
        });
      }

      // Buscar comissões
      const commissionsToApprove = await db
        .select()
        .from(commissions)
        .where(
          and(
            inArray(commissions.id, input.commissionIds),
            eq(commissions.tenantId, user.tenantId),
            eq(commissions.status, "pendente")
          )
        );

      if (commissionsToApprove.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhuma comissão pendente encontrada",
        });
      }

      // Atualizar status para aprovada
      await db
        .update(commissions)
        .set({
          status: "aprovada",
          approvedBy: user.id,
          approvedAt: new Date(),
          notes: input.notes || null,
          updatedAt: new Date(),
        })
        .where(inArray(commissions.id, input.commissionIds));

      return {
        success: true,
        approvedCount: commissionsToApprove.length,
      };
    }),

  /**
   * Registra pagamento de comissões
   */
  pay: protectedProcedure
    .input(z.object({
      commissionIds: z.array(z.number()),
      paymentMethod: z.string(),
      paymentDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;

      // Verificar permissão
      if (user.role !== "gerente" && user.role !== "admin" && user.role !== "master_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gerentes e administradores podem registrar pagamentos",
        });
      }

      // Buscar comissões aprovadas
      const commissionsToPay = await db
        .select()
        .from(commissions)
        .where(
          and(
            inArray(commissions.id, input.commissionIds),
            eq(commissions.tenantId, user.tenantId),
            eq(commissions.status, "aprovada")
          )
        );

      if (commissionsToPay.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhuma comissão aprovada encontrada",
        });
      }

      const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
      const totalAmount = commissionsToPay.reduce((sum, c) => sum + c.amount, 0);

      // Criar registro no contas a pagar
      const [paymentRecord] = await db
        .insert(accountsPayable)
        .values({
          tenantId: user.tenantId,
          description: `Pagamento de comissões - ${commissionsToPay.length} comissão(ões)`,
          category: "Comissões",
          amount: totalAmount,
          dueDate: paymentDate,
          paymentDate: paymentDate,
          status: "pago",
          paymentMethod: input.paymentMethod,
          referenceType: "commission",
          notes: input.notes || null,
          createdBy: user.id,
        })
        .$returningId();

      // Atualizar comissões para paga
      await db
        .update(commissions)
        .set({
          status: "paga",
          paidAt: paymentDate,
          paymentId: paymentRecord.id,
          notes: input.notes || null,
          updatedAt: new Date(),
        })
        .where(inArray(commissions.id, input.commissionIds));

      return {
        success: true,
        paidCount: commissionsToPay.length,
        totalAmount,
        paymentId: paymentRecord.id,
      };
    }),

  /**
   * Cancela comissões
   */
  cancel: protectedProcedure
    .input(z.object({
      commissionIds: z.array(z.number()),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;

      // Verificar permissão
      if (user.role !== "admin" && user.role !== "master_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem cancelar comissões",
        });
      }

      // Atualizar status para cancelada
      const result = await db
        .update(commissions)
        .set({
          status: "cancelada",
          notes: input.reason,
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(commissions.id, input.commissionIds),
            eq(commissions.tenantId, user.tenantId)
          )
        );

      return {
        success: true,
        canceledCount: input.commissionIds.length,
      };
    }),
});
