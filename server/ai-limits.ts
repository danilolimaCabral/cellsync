import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { tenants, plans } from "../drizzle/schema";

/**
 * Gerenciamento de Limites do Assistente de IA
 */

export interface AILimitStatus {
  canImport: boolean;
  isInTrial: boolean;
  importsUsed: number;
  importsLimit: number; // -1 = ilimitado
  importsRemaining: number;
  trialDaysRemaining: number;
  message?: string;
  suggestUpgrade?: boolean;
}

/**
 * Verifica se o tenant pode usar o assistente de IA
 */
export async function checkAIImportLimit(tenantId: number): Promise<AILimitStatus> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Buscar tenant e plano
  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenantResult.length === 0) {
    throw new Error("Tenant not found");
  }

  const tenant = tenantResult[0];

  const planResult = await db
    .select()
    .from(plans)
    .where(eq(plans.id, tenant.planId))
    .limit(1);

  if (planResult.length === 0) {
    throw new Error("Plan not found");
  }

  const plan = planResult[0];

  // Verificar se precisa resetar contador (passou 1 mês)
  const now = new Date();
  const resetAt = new Date(tenant.aiImportsResetAt);
  const daysSinceReset = Math.floor((now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceReset >= 30) {
    // Resetar contador
    await db
      .update(tenants)
      .set({
        aiImportsUsed: 0,
        aiImportsResetAt: now,
      })
      .where(eq(tenants.id, tenantId));

    tenant.aiImportsUsed = 0;
  }

  // Verificar se está em trial
  const isInTrial = !!(tenant.status === "trial" && tenant.trialEndsAt && tenant.trialEndsAt > now);
  const trialDaysRemaining = isInTrial && tenant.trialEndsAt
    ? Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Verificar limite
  const importsLimit = plan.aiImportsLimit;
  const importsUsed = tenant.aiImportsUsed;
  const isUnlimited = importsLimit === -1 || importsLimit === null; // Ensure null is also treated as unlimited if applicable
  const importsRemaining = isUnlimited ? 999999 : Math.max(0, importsLimit - importsUsed);

  // Determinar se pode importar
  let canImport = true;
  let message: string | undefined;
  let suggestUpgrade = false;

  // Se o tenant estiver suspenso (manutenção), ainda permitimos a importação se for ilimitado ou se não tiver atingido o limite numérico.
  // O bloqueio por status "suspended" deve ser tratado no login ou middleware geral, mas para esta função específica de limite,
  // focamos apenas na contagem.

  if (!isInTrial && !isUnlimited && importsUsed >= importsLimit) {
    canImport = false;
    message = `Você atingiu o limite de ${importsLimit} importações do mês. Faça upgrade para continuar!`;
    suggestUpgrade = true;
  } else if (!isInTrial && !isUnlimited && importsRemaining <= 5) {
    message = `Restam apenas ${importsRemaining} importações este mês. Considere fazer upgrade!`;
    suggestUpgrade = true;
  } else if (isInTrial) {
    message = `Você está no período trial (${trialDaysRemaining} dias restantes). Importações ilimitadas!`;
  } else if (isUnlimited) {
    message = `Você possui importações ilimitadas no plano ${plan.name}. Aproveite!`;
  }

  return {
    canImport,
    isInTrial,
    importsUsed,
    importsLimit,
    importsRemaining,
    trialDaysRemaining,
    message,
    suggestUpgrade,
  };
}

/**
 * Incrementa o contador de importações
 */
export async function incrementAIImportUsage(tenantId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenantResult.length === 0) return;

  await db
    .update(tenants)
    .set({
      aiImportsUsed: tenantResult[0].aiImportsUsed + 1,
    })
    .where(eq(tenants.id, tenantId));
}

/**
 * Retorna informações do plano atual e opções de upgrade
 */
export async function getUpgradeOptions(tenantId: number) {
  const db = await getDb();
  if (!db) return null;

  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenantResult.length === 0) return null;

  const tenant = tenantResult[0];

  const currentPlanResult = await db
    .select()
    .from(plans)
    .where(eq(plans.id, tenant.planId))
    .limit(1);

  if (currentPlanResult.length === 0) return null;

  const currentPlan = currentPlanResult[0];

  // Buscar planos superiores
  const availablePlans = await db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true));

  const upgradePlans = availablePlans
    .filter((p) => p.priceMonthly > currentPlan.priceMonthly)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceMonthly: p.priceMonthly,
      aiImportsLimit: p.aiImportsLimit,
      features: p.features,
    }));

  return {
    currentPlan: {
      name: currentPlan.name,
      aiImportsLimit: currentPlan.aiImportsLimit,
    },
    upgradePlans,
  };
}
