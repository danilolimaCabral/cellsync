/**
 * Testes para o sistema de permissões e módulos
 */

import { describe, it, expect, beforeAll } from "vitest";
import { seedModules, seedPlans, tenantHasModule, activateTenantModule, getTenantModules } from "./modules-manager";
import { getDb } from "./db";
import { tenantModules, modules } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sistema de Permissões e Módulos", () => {
  let testTenantId = 1; // Tenant de teste
  let testUserId = 1; // Usuário de teste

  beforeAll(async () => {
    // Inicializar módulos e planos
    await seedModules();
    await seedPlans();
  });

  it("deve criar módulos padrão no banco", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const allModules = await db.select().from(modules);
    
    expect(allModules.length).toBeGreaterThan(0);
    expect(allModules.some(m => m.code === "pdv")).toBe(true);
    expect(allModules.some(m => m.code === "estoque")).toBe(true);
    expect(allModules.some(m => m.code === "financeiro")).toBe(true);
  });

  it("deve ativar módulo para um tenant", async () => {
    await activateTenantModule(testTenantId, "pdv", testUserId);
    
    const hasAccess = await tenantHasModule(testTenantId, "pdv");
    expect(hasAccess).toBe(true);
  });

  it("deve retornar false para módulo não ativado", async () => {
    const hasAccess = await tenantHasModule(testTenantId, "nfe");
    expect(hasAccess).toBe(false);
  });

  it("deve listar módulos de um tenant", async () => {
    const tenantMods = await getTenantModules(testTenantId);
    
    expect(Array.isArray(tenantMods)).toBe(true);
    
    // Deve ter pelo menos o módulo PDV que ativamos
    const pdvModule = tenantMods.find(m => m.code === "pdv");
    expect(pdvModule).toBeDefined();
    expect(pdvModule?.enabled).toBe(true);
  });

  it("deve verificar estrutura de dados dos módulos", async () => {
    const tenantMods = await getTenantModules(testTenantId);
    
    if (tenantMods.length > 0) {
      const module = tenantMods[0];
      expect(module).toHaveProperty("code");
      expect(module).toHaveProperty("name");
      expect(module).toHaveProperty("description");
      expect(module).toHaveProperty("enabled");
    }
  });
});
