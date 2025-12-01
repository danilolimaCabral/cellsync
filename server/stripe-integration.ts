import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

/**
 * Criar sessão de checkout do Stripe para assinatura
 */
export async function createCheckoutSession({
  planSlug,
  billingPeriod,
  customerEmail,
  customerName,
  userId,
  successUrl,
  cancelUrl,
}: {
  planSlug: string;
  billingPeriod: 'monthly' | 'yearly';
  customerEmail: string;
  customerName: string;
  userId: number;
  successUrl: string;
  cancelUrl: string;
}) {
  // Buscar o plano no banco de dados
  const { getPlanBySlug } = await import('./db-plans');
  const plan = await getPlanBySlug(planSlug);

  if (!plan) {
    throw new Error('Plano não encontrado');
  }

  const selectedPlan = plan;

  // Determinar o price_id do Stripe baseado no período
  const stripePriceId =
    billingPeriod === 'monthly'
      ? selectedPlan.stripePriceIdMonthly
      : selectedPlan.stripePriceIdYearly;

  if (!stripePriceId) {
    throw new Error('Price ID do Stripe não configurado para este plano');
  }

  // Criar sessão de checkout
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: customerEmail,
      customer_name: customerName,
      plan_slug: planSlug,
      billing_period: billingPeriod,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        user_id: userId.toString(),
        plan_slug: planSlug,
      },
    },
  });

  return session;
}

/**
 * Criar portal de gerenciamento de assinatura
 */
export async function createCustomerPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Cancelar assinatura
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Obter detalhes da assinatura
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}
