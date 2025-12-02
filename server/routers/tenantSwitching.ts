import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tenants, auditLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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

export const tenantSwitchingRouter = router({
  /**
   * Troca para outro tenant (impersonação para manutenção)
   */
  switchTenant: masterAdminProcedure
    .input(z.object({
      tenantId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verificar se o tenant existe
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

      // Registrar auditoria
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "tenant_switch",
        entity: "tenant",
        entityId: input.tenantId,
        changes: JSON.stringify({
          masterAdminId: ctx.user.id,
          masterAdminEmail: ctx.user.email,
          targetTenantId: input.tenantId,
          targetTenantName: tenant[0].name,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: ctx.req.ip || "unknown",
        userAgent: ctx.req.headers["user-agent"] || "unknown",
      });

      // Salvar tenant ativo na sessão (usando cookie temporário)
      ctx.res.cookie("active_tenant_id", input.tenantId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
      });

      return {
        success: true,
        tenant: {
          id: tenant[0].id,
          name: tenant[0].name,
          subdomain: tenant[0].subdomain,
        },
      };
    }),

  /**
   * Sair da impersonação e voltar ao tenant próprio
   */
  exitImpersonation: masterAdminProcedure
    .mutation(async ({ ctx }: { ctx: any }) => {
      // Remover cookie de tenant ativo
      ctx.res.clearCookie("active_tenant_id");

      // Registrar auditoria
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "tenant_exit_impersonation",
        entity: "tenant",
        entityId: 1,
        changes: JSON.stringify({
          masterAdminId: ctx.user.id,
          masterAdminEmail: ctx.user.email,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: ctx.req.ip || "unknown",
        userAgent: ctx.req.headers["user-agent"] || "unknown",
      });

      return {
        success: true,
      };
    }),

  /**
   * Obter tenant ativo atual (se houver impersonação)
   */
  getCurrentTenant: masterAdminProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      const activeTenantId = ctx.req.cookies?.["active_tenant_id"];
      
      if (!activeTenantId) {
        return {
          isImpersonating: false,
          tenant: null,
        };
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, parseInt(activeTenantId)))
        .limit(1);

      if (!tenant || tenant.length === 0) {
        // Cookie inválido, limpar
        ctx.res.clearCookie("active_tenant_id");
        return {
          isImpersonating: false,
          tenant: null,
        };
      }

      return {
        isImpersonating: true,
        tenant: {
          id: tenant[0].id,
          name: tenant[0].name,
          subdomain: tenant[0].subdomain,
        },
      };
    }),
});
