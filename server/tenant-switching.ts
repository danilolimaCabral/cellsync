/**
 * Sistema de Impersonação de Tenant (Tenant Switching)
 * Permite que master_admin acesse e faça manutenção em qualquer tenant
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { tenants, users, auditLogs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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
 * Router de tenant switching
 */
export const tenantSwitchingRouter = router({
  /**
   * Troca o tenant ativo (impersonação)
   * Master admin pode acessar qualquer tenant para manutenção
   */
  switchTenant: masterAdminProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se o tenant existe
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.tenantId))
        .limit(1);

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado" });
      }

      // Registrar log de auditoria
      await db.insert(auditLogs).values({
        tenantId: ctx.user.tenantId, // Tenant original do master admin
        userId: ctx.user.id,
        action: "tenant_switch",
        entity: "tenant",
        entityId: input.tenantId,
        changes: JSON.stringify({
          from_tenant: ctx.user.tenantId,
          to_tenant: input.tenantId,
          tenant_name: tenant.name,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: ctx.req?.headers?.['x-forwarded-for'] as string || ctx.req?.socket?.remoteAddress || null,
        userAgent: ctx.req?.headers?.['user-agent'] as string || null,
        createdAt: new Date(),
      });

      // Atualizar o tenantId do usuário na sessão
      // IMPORTANTE: Isso é temporário e só afeta a sessão atual
      // O banco de dados não é alterado
      return {
        success: true,
        message: `Agora acessando: ${tenant.name}`,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          logo: tenant.logo,
        },
        // Retornar novo tenantId para atualizar no frontend
        newTenantId: input.tenantId,
      };
    }),

  /**
   * Retorna ao tenant original (sair da impersonação)
   */
  exitImpersonation: masterAdminProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar o tenant original do master admin (sempre tenantId = 1)
      const [masterTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, 1))
        .limit(1);

      if (!masterTenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant master não encontrado" });
      }

      // Registrar log de auditoria
      await db.insert(auditLogs).values({
        tenantId: 1,
        userId: ctx.user.id,
        action: "exit_impersonation",
        entity: "tenant",
        entityId: 1,
        changes: JSON.stringify({
          from_tenant: ctx.user.tenantId,
          to_tenant: 1,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: ctx.req?.headers?.['x-forwarded-for'] as string || ctx.req?.socket?.remoteAddress || null,
        userAgent: ctx.req?.headers?.['user-agent'] as string || null,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Voltou ao tenant master",
        newTenantId: 1,
      };
    }),

  /**
   * Obtém o tenant atualmente ativo
   */
  getCurrentTenant: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [tenant] = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          subdomain: tenants.subdomain,
          logo: tenants.logo,
          status: tenants.status,
        })
        .from(tenants)
        .where(eq(tenants.id, ctx.user.tenantId))
        .limit(1);

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado" });
      }

      // Verificar se está em modo de impersonação
      const isImpersonating = ctx.user.role === "master_admin" && ctx.user.tenantId !== 1;

      return {
        ...tenant,
        isImpersonating,
        originalTenantId: 1, // Sempre 1 para master admin
      };
    }),

  /**
   * Lista histórico de acessos entre tenants (auditoria)
   */
  getImpersonationHistory: masterAdminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const offset = (input.page - 1) * input.limit;

      // Buscar logs de tenant switching
      const logs = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          changes: auditLogs.changes,
          createdAt: auditLogs.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(eq(auditLogs.action, "tenant_switch"))
        .orderBy(auditLogs.createdAt)
        .limit(input.limit)
        .offset(offset);

      // Contar total
      const totalResult = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "tenant_switch"));
      
      const total = totalResult.length;

      return {
        logs: logs.map(log => ({
          ...log,
          details: log.changes ? JSON.parse(log.changes as string) : null,
        })),
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),
});
