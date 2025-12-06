import Stripe from 'stripe';

// Stripe será configurado na Fase 3
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeKey, {
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
  customerEmail?: string;
  customerName?: string;
  userId?: number;
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
  const sessionData: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'], // Apenas cartão para garantir funcionamento imediato
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      plan_slug: planSlug,
      billing_period: billingPeriod,
    },
  };
  
  // Adicionar email se fornecido
  if (customerEmail) {
    sessionData.customer_email = customerEmail;
  }
  
  // Adicionar referência do usuário se fornecido
  if (userId) {
    sessionData.client_reference_id = userId.toString();
    if (sessionData.metadata) {
      sessionData.metadata.user_id = userId.toString();
    }
  }
  
  // Adicionar nome do cliente se fornecido
  if (customerName && sessionData.metadata) {
    sessionData.metadata.customer_name = customerName;
  }
  
    // Configurar dados da assinatura (Trial + Metadata)
    sessionData.subscription_data = {
      trial_period_days: 7, // 7 dias de teste grátis
      metadata: {
        plan_slug: planSlug,
      },
    };

    if (userId) {
      sessionData.subscription_data.metadata = {
        ...sessionData.subscription_data.metadata,
        user_id: userId.toString(),
      };
    }
  
  const session = await stripe.checkout.sessions.create(sessionData);

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
