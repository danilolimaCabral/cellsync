import { z } from 'zod';
import { protectedProcedure } from './_core/trpc';
import { createCheckoutSession, createCustomerPortalSession } from './stripe-integration';
import { getDb } from './db';
import { tenants } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Criar sessão de checkout do Stripe
 */
export const createStripeCheckout = protectedProcedure
  .input(
    z.object({
      planSlug: z.string(),
      billingPeriod: z.enum(['monthly', 'yearly']),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { planSlug, billingPeriod } = input;
    const user = ctx.user;

    // Criar sessão de checkout
    const session = await createCheckoutSession({
      planSlug,
      billingPeriod,
      customerEmail: user.email,
      customerName: user.name,
      userId: user.id,
      successUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/planos/sucesso`,
      cancelUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/planos`,
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  });

/**
 * Obter informações da assinatura atual
 */
export const getCurrentSubscription = protectedProcedure.query(async ({ ctx }) => {
  const user = ctx.user;
  const db = await getDb();

  if (!db) {
    throw new Error('Erro ao conectar ao banco de dados');
  }

  // Buscar tenant do usuário
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, user.tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error('Tenant não encontrado');
  }

  // Buscar plano
  const { getPlanById } = await import('./db-plans');
  const plan = await getPlanById(tenant.planId);

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt,
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
    },
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          maxUsers: plan.maxUsers,
          maxProducts: plan.maxProducts,
          features: plan.features as string[],
        }
      : null,
  };
});

/**
 * Criar portal de gerenciamento de assinatura
 */
export const createBillingPortal = protectedProcedure.mutation(async ({ ctx }) => {
  const user = ctx.user;
  const db = await getDb();

  if (!db) {
    throw new Error('Erro ao conectar ao banco de dados');
  }

  // Buscar tenant do usuário
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, user.tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error('Tenant não encontrado');
  }

  if (!tenant.stripeCustomerId) {
    throw new Error('Nenhuma assinatura ativa encontrada');
  }

  // Criar sessão do portal
  const session = await createCustomerPortalSession({
    stripeCustomerId: tenant.stripeCustomerId,
    returnUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/assinatura`,
  });

  return {
    portalUrl: session.url,
  };
});
