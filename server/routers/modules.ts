/**
 * Router tRPC para gestão de módulos e permissões
 */

import { router, masterAdminProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  seedModules,
  seedPlans,
  getTenantModules,
  activateTenantModule,
  deactivateTenantModule,
  applyPlanToTenant,
  tenantHasModule,
} from "../modules-manager";
import { getDb } from "../db";
import { modules, subscriptionPlans, planModules, tenantModules } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const modulesRouter = router({
  /**
   * Inicializar módulos padrão (apenas master_admin)
   */
  seedModules: masterAdminProcedure.mutation(async () => {
    const result = await seedModules();
    return {
      success: true,
      message: `${result.created.length} módulos criados de ${result.total} total`,
      created: result.created,
    };
  }),

  /**
   * Inicializar planos padrão (apenas master_admin)
   */
  seedPlans: masterAdminProcedure.mutation(async () => {
    const result = await seedPlans();
    return {
      success: true,
      message: `${result.created.length} planos criados de ${result.total} total`,
      created: result.created,
    };
  }),

  /**
   * Listar todos os módulos disponíveis
   */
  listAll: masterAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    return await db.select().from(modules).orderBy(modules.sortOrder);
  }),

  /**
   * Listar todos os planos
   */
  listPlans: masterAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true)).orderBy(subscriptionPlans.sortOrder);
    
    // Para cada plano, buscar módulos incluídos
    const plansWithModules = await Promise.all(
      plans.map(async (plan) => {
        const planModulesData = await db
          .select({
            id: modules.id,
            code: modules.code,
            name: modules.name,
          })
          .from(planModules)
          .innerJoin(modules, eq(modules.id, planModules.moduleId))
          .where(and(eq(planModules.planId, plan.id), eq(planModules.included, true)));
        
        return {
          ...plan,
          modules: planModulesData,
        };
      })
    );
    
    return plansWithModules;
  }),

  /**
   * Listar módulos de um tenant específico
   */
  getTenantModules: masterAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      return await getTenantModules(input.tenantId);
    }),

  /**
   * Listar módulos do tenant atual (usuário logado)
   */
  getMyModules: protectedProcedure.query(async ({ ctx }) => {
    return await getTenantModules(ctx.user.tenantId);
  }),

  /**
   * Verificar se o tenant atual tem acesso a um módulo
   */
  hasModule: protectedProcedure
    .input(z.object({ moduleCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await tenantHasModule(ctx.user.tenantId, input.moduleCode);
      return { hasAccess };
    }),

  /**
   * Ativar módulo para um tenant
   */
  activateModule: masterAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        moduleCode: z.string(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;
      await activateTenantModule(input.tenantId, input.moduleCode, ctx.user.id, expiresAt);
      return { success: true, message: "Módulo ativado com sucesso" };
    }),

  /**
   * Desativar módulo para um tenant
   */
  deactivateModule: masterAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        moduleCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await deactivateTenantModule(input.tenantId, input.moduleCode);
      return { success: true, message: "Módulo desativado com sucesso" };
    }),

  /**
   * Aplicar plano completo a um tenant
   */
  applyPlan: masterAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        planCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await applyPlanToTenant(input.tenantId, input.planCode, ctx.user.id);
      return {
        success: true,
        message: `Plano aplicado com sucesso. ${result.modulesActivated} módulos ativados.`,
        modulesActivated: result.modulesActivated,
      };
    }),

  /**
   * Listar todos os tenants com seus módulos ativos
   */
  listTenantsWithModules: masterAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    // Buscar todos os tenants
    const { tenants } = await import("../../drizzle/schema");
    const allTenants = await db.select().from(tenants);
    
    // Para cada tenant, buscar módulos ativos
    const tenantsWithModules = await Promise.all(
      allTenants.map(async (tenant) => {
        const modules = await getTenantModules(tenant.id);
        const activeModules = modules.filter(m => m.enabled);
        
        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          createdAt: tenant.createdAt,
          modulesCount: activeModules.length,
          modules: activeModules,
        };
      })
    );
    
    return tenantsWithModules;
  }),
});
