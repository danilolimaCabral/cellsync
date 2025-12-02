/**
 * Middleware de isolamento multi-tenant
 * Garante que cada tenant só acesse seus próprios dados
 */

import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

export interface TenantContext extends TrpcContext {
  tenantId: number;
  tenant: {
    id: number;
    name: string;
    subdomain: string;
    planId: number;
    status: string;
  } | null;
}

/**
 * Extrai tenantId do contexto
 * Prioridade:
 * 1. master_admin sempre acessa tenant_id = 1 (Tenant Master)
 * 2. Outros usuários: usa o tenant_id do próprio usuário
 */
export function getTenantId(ctx: TrpcContext): number {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Usuário não autenticado",
    });
  }

  // Master admin sempre acessa Tenant Master (ID = 1)
  if (ctx.user.role === "master_admin") {
    return 1;
  }

  // Verifica se usuário tem tenantId
  const tenantId = (ctx.user as any).tenantId;
  
  if (!tenantId) {
    // Fallback: usa tenant_id = 1 para usuários antigos
    return 1;
  }

  return tenantId;
}

/**
 * Middleware que adiciona tenantId ao contexto
 */
export async function withTenant(ctx: TrpcContext): Promise<TenantContext> {
  const tenantId = getTenantId(ctx);

  // TODO: Buscar dados do tenant do banco (opcional)
  // Por enquanto, retorna apenas o ID
  return {
    ...ctx,
    tenantId,
    tenant: null,
  };
}

/**
 * Helper para filtrar queries por tenant
 * Uso: where(and(eq(table.tenantId, ctx.tenantId), ...outras condições))
 */
export function tenantFilter(tenantId: number) {
  return { tenantId };
}
