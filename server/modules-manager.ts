/**
 * Gerenciador de módulos e permissões
 */

import { getDb } from "./db";
import { modules, subscriptionPlans, planModules, tenantModules, modulePermissions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Dados dos módulos padrão do sistema
 */
export const DEFAULT_MODULES = [
  {
    code: 'pdv',
    name: 'PDV (Vendas)',
    description: 'Ponto de venda com controle de estoque, clientes e formas de pagamento',
    icon: 'ShoppingCart',
    routePath: '/vendas',
    sortOrder: 1,
  },
  {
    code: 'estoque',
    name: 'Gestão de Estoque',
    description: 'Controle completo de estoque com movimentações, IMEI e rastreabilidade',
    icon: 'Package',
    routePath: '/estoque',
    sortOrder: 2,
  },
  {
    code: 'os',
    name: 'Ordem de Serviço',
    description: 'Gerenciamento de assistências técnicas e reparos',
    icon: 'Wrench',
    routePath: '/ordem-servico',
    sortOrder: 3,
  },
  {
    code: 'financeiro',
    name: 'Financeiro',
    description: 'Contas a pagar, receber, fluxo de caixa e relatórios financeiros',
    icon: 'DollarSign',
    routePath: '/financeiro',
    sortOrder: 4,
  },
  {
    code: 'comissoes',
    name: 'Controle de Comissões',
    description: 'Gestão de comissões de vendedores com aprovação e pagamento',
    icon: 'Wallet',
    routePath: '/controle-comissoes',
    sortOrder: 5,
  },
  {
    code: 'clientes',
    name: 'CRM (Clientes)',
    description: 'Cadastro e gestão de clientes',
    icon: 'Users',
    routePath: '/clientes',
    sortOrder: 6,
  },
  {
    code: 'relatorios',
    name: 'Relatórios e BI',
    description: 'Dashboards, KPIs e relatórios avançados',
    icon: 'TrendingUp',
    routePath: '/dashboard-bi',
    sortOrder: 7,
  },
  {
    code: 'nfe',
    name: 'Nota Fiscal Eletrônica',
    description: 'Emissão e gerenciamento de NF-e',
    icon: 'FileText',
    routePath: '/notas-fiscais',
    sortOrder: 8,
  },
];

/**
 * Dados dos planos padrão
 */
export const DEFAULT_PLANS = [
  {
    code: 'basico',
    name: 'Plano Básico',
    description: 'Ideal para pequenas lojas que estão começando',
    monthlyPrice: 9900, // R$ 99,00
    maxUsers: 3,
    maxStorage: 5000, // 5GB
    features: JSON.stringify([
      'PDV completo',
      'Gestão de estoque básica',
      'Cadastro de clientes',
      'Até 3 usuários',
      '5GB de armazenamento',
    ]),
    sortOrder: 1,
    modules: ['pdv', 'estoque', 'clientes'],
  },
  {
    code: 'profissional',
    name: 'Plano Profissional',
    description: 'Para lojas em crescimento que precisam de mais recursos',
    monthlyPrice: 19900, // R$ 199,00
    maxUsers: 10,
    maxStorage: 20000, // 20GB
    features: JSON.stringify([
      'Todos os recursos do Básico',
      'Ordem de Serviço',
      'Financeiro completo',
      'Controle de comissões',
      'Relatórios avançados',
      'Até 10 usuários',
      '20GB de armazenamento',
    ]),
    sortOrder: 2,
    modules: ['pdv', 'estoque', 'clientes', 'os', 'financeiro', 'comissoes', 'relatorios'],
  },
  {
    code: 'enterprise',
    name: 'Plano Enterprise',
    description: 'Solução completa para redes e grandes operações',
    monthlyPrice: 39900, // R$ 399,00
    maxUsers: null, // Ilimitado
    maxStorage: null, // Ilimitado
    features: JSON.stringify([
      'Todos os recursos do Profissional',
      'NF-e integrada',
      'Multi-loja',
      'API completa',
      'Suporte prioritário',
      'Usuários ilimitados',
      'Armazenamento ilimitado',
      'Backups automáticos',
    ]),
    sortOrder: 3,
    modules: ['pdv', 'estoque', 'clientes', 'os', 'financeiro', 'comissoes', 'relatorios', 'nfe'],
  },
];

/**
 * Inicializar módulos padrão no banco
 */
export async function seedModules() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const created = [];
  
  for (const moduleData of DEFAULT_MODULES) {
    const existing = await db.select().from(modules).where(eq(modules.code, moduleData.code)).limit(1);
    
    if (existing.length === 0) {
      await db.insert(modules).values(moduleData);
      created.push(moduleData.name);
    }
  }
  
  return { created, total: DEFAULT_MODULES.length };
}

/**
 * Inicializar planos padrão no banco
 */
export async function seedPlans() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const created = [];
  
  // Buscar todos os módulos
  const allModules = await db.select().from(modules);
  const moduleMap = new Map(allModules.map(m => [m.code, m.id]));
  
  for (const planData of DEFAULT_PLANS) {
    const { modules: planModulesCodes, ...planInfo } = planData;
    
    const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.code, planData.code)).limit(1);
    
    let planId;
    if (existing.length === 0) {
      const result = await db.insert(subscriptionPlans).values(planInfo);
      planId = Number(result[0].insertId);
      created.push(planData.name);
    } else {
      planId = existing[0].id;
    }
    
    // Vincular módulos ao plano
    for (const moduleCode of planModulesCodes) {
      const moduleId = moduleMap.get(moduleCode);
      if (!moduleId) continue;
      
      const existingLink = await db
        .select()
        .from(planModules)
        .where(and(eq(planModules.planId, planId), eq(planModules.moduleId, moduleId)))
        .limit(1);
      
      if (existingLink.length === 0) {
        await db.insert(planModules).values({
          planId,
          moduleId,
          included: true,
        });
      }
    }
  }
  
  return { created, total: DEFAULT_PLANS.length };
}

/**
 * Verificar se um tenant tem acesso a um módulo
 */
export async function tenantHasModule(tenantId: number, moduleCode: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const result = await db
    .select({
      enabled: tenantModules.enabled,
      expiresAt: tenantModules.expiresAt,
    })
    .from(tenantModules)
    .innerJoin(modules, eq(modules.id, tenantModules.moduleId))
    .where(and(
      eq(tenantModules.tenantId, tenantId),
      eq(modules.code, moduleCode),
      eq(tenantModules.enabled, true)
    ))
    .limit(1);
  
  if (result.length === 0) return false;
  
  const { expiresAt } = result[0];
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return false; // Módulo expirado
  }
  
  return true;
}

/**
 * Ativar módulo para um tenant
 */
export async function activateTenantModule(
  tenantId: number,
  moduleCode: string,
  activatedBy: number,
  expiresAt?: Date
) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Buscar módulo
  const moduleResult = await db.select().from(modules).where(eq(modules.code, moduleCode)).limit(1);
  if (moduleResult.length === 0) {
    throw new Error(`Módulo ${moduleCode} não encontrado`);
  }
  
  const moduleId = moduleResult[0].id;
  
  // Verificar se já existe
  const existing = await db
    .select()
    .from(tenantModules)
    .where(and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.moduleId, moduleId)))
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar
    await db
      .update(tenantModules)
      .set({
        enabled: true,
        expiresAt: expiresAt || null,
        updatedAt: new Date(),
      })
      .where(eq(tenantModules.id, existing[0].id));
  } else {
    // Criar
    await db.insert(tenantModules).values({
      tenantId,
      moduleId,
      enabled: true,
      expiresAt: expiresAt || null,
      activatedBy,
      activatedAt: new Date(),
    });
  }
}

/**
 * Desativar módulo para um tenant
 */
export async function deactivateTenantModule(tenantId: number, moduleCode: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const moduleResult = await db.select().from(modules).where(eq(modules.code, moduleCode)).limit(1);
  if (moduleResult.length === 0) {
    throw new Error(`Módulo ${moduleCode} não encontrado`);
  }
  
  const moduleId = moduleResult[0].id;
  
  await db
    .update(tenantModules)
    .set({
      enabled: false,
      updatedAt: new Date(),
    })
    .where(and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.moduleId, moduleId)));
}

/**
 * Listar módulos de um tenant
 */
export async function getTenantModules(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  return await db
    .select({
      id: tenantModules.id,
      moduleId: modules.id,
      code: modules.code,
      name: modules.name,
      description: modules.description,
      icon: modules.icon,
      routePath: modules.routePath,
      enabled: tenantModules.enabled,
      expiresAt: tenantModules.expiresAt,
      activatedAt: tenantModules.activatedAt,
    })
    .from(tenantModules)
    .innerJoin(modules, eq(modules.id, tenantModules.moduleId))
    .where(eq(tenantModules.tenantId, tenantId))
    .orderBy(modules.sortOrder);
}

/**
 * Aplicar plano a um tenant
 */
export async function applyPlanToTenant(tenantId: number, planCode: string, activatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Buscar plano
  const planResult = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.code, planCode)).limit(1);
  if (planResult.length === 0) {
    throw new Error(`Plano ${planCode} não encontrado`);
  }
  
  const plan = planResult[0];
  
  // Buscar módulos do plano
  const planModulesResult = await db
    .select({
      moduleId: modules.id,
      code: modules.code,
    })
    .from(planModules)
    .innerJoin(modules, eq(modules.id, planModules.moduleId))
    .where(and(eq(planModules.planId, plan.id), eq(planModules.included, true)));
  
  // Ativar todos os módulos do plano
  for (const module of planModulesResult) {
    await activateTenantModule(tenantId, module.code, activatedBy);
  }
  
  return { modulesActivated: planModulesResult.length };
}
