import Stripe from 'stripe';
import { stripe } from './stripe-integration';
import { getDb } from './db';
import { tenants, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Handler de webhook do Stripe
 * Processa eventos de pagamento e atualiza assinaturas
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string
): Promise<{ received: boolean; error?: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado');
    return { received: false, error: 'Webhook secret não configurado' };
  }

  let event: Stripe.Event;

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Erro ao verificar webhook:', err.message);
    return { received: false, error: `Webhook Error: ${err.message}` };
  }

  console.log(`[Stripe Webhook] Evento recebido: ${event.type}`);

  try {
    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Evento não tratado: ${event.type}`);
    }

    return { received: true };
  } catch (error: any) {
    console.error(`[Stripe Webhook] Erro ao processar evento ${event.type}:`, error);
    return { received: false, error: error.message };
  }
}

/**
 * Checkout completado - Primeira assinatura criada
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe] Checkout completado:', session.id);

  const userId = session.metadata?.user_id;
  const planSlug = session.metadata?.plan_slug;

  if (!userId) {
    console.error('[Stripe] user_id não encontrado nos metadados');
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Buscar usuário
  const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);

  if (!user) {
    console.error('[Stripe] Usuário não encontrado:', userId);
    return;
  }

  // Buscar plano
  const { getPlanBySlug } = await import('./db-plans');
  const plan = await getPlanBySlug(planSlug || 'basico');

  if (!plan) {
    console.error('[Stripe] Plano não encontrado:', planSlug);
    return;
  }

  // Atualizar tenant para ativo
  await db
    .update(tenants)
    .set({
      status: 'active',
      planId: plan.id,
      stripeCustomerId: session.customer as string,
    })
    .where(eq(tenants.id, user.tenantId));

  console.log(`[Stripe] Tenant ${user.tenantId} ativado com plano ${plan.name}`);
}

/**
 * Assinatura atualizada
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[Stripe] Assinatura atualizada:', subscription.id);

  const db = await getDb();
  if (!db) return;

  // Buscar tenant pela subscription ID
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!tenant) {
    console.error('[Stripe] Tenant não encontrado para subscription:', subscription.id);
    return;
  }

  // Atualizar status baseado no status da assinatura
  let newStatus: 'active' | 'suspended' | 'cancelled' | 'trial' = 'active';

  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    newStatus = 'suspended';
  } else if (subscription.status === 'active') {
    newStatus = 'active';
  }

  await db
    .update(tenants)
    .set({ 
      status: newStatus,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
    })
    .where(eq(tenants.id, tenant.id));

  console.log(`[Stripe] Tenant ${tenant.id} atualizado para status: ${newStatus}`);
}

/**
 * Assinatura deletada/cancelada
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Stripe] Assinatura deletada:', subscription.id);

  const db = await getDb();
  if (!db) return;

  // Buscar tenant pela subscription ID
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!tenant) {
    console.error('[Stripe] Tenant não encontrado para subscription:', subscription.id);
    return;
  }

  // Cancelar tenant
  await db
    .update(tenants)
    .set({ status: 'cancelled' })
    .where(eq(tenants.id, tenant.id));

  console.log(`[Stripe] Tenant ${tenant.id} cancelado`);
}

/**
 * Pagamento de fatura bem-sucedido
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('[Stripe] Pagamento bem-sucedido:', invoice.id);

  // @ts-ignore - subscription pode ser string ou objeto
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;
  
  if (!subscriptionId) {
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Buscar tenant pela subscription ID
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!tenant) {
    console.error('[Stripe] Tenant não encontrado para subscription:', subscriptionId);
    return;
  }

  // Garantir que tenant está ativo
  await db
    .update(tenants)
    .set({ status: 'active' })
    .where(eq(tenants.id, tenant.id));

  console.log(`[Stripe] Pagamento confirmado para tenant ${tenant.id}`);
}

/**
 * Pagamento de fatura falhou
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Stripe] Pagamento falhou:', invoice.id);

  // @ts-ignore - subscription pode ser string ou objeto
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;
  
  if (!subscriptionId) {
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Buscar tenant pela subscription ID
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!tenant) {
    console.error('[Stripe] Tenant não encontrado para subscription:', subscriptionId);
    return;
  }

  // Marcar tenant como suspenso
  await db
    .update(tenants)
    .set({ status: 'suspended' })
    .where(eq(tenants.id, tenant.id));

  console.log(`[Stripe] Tenant ${tenant.id} suspenso por falha no pagamento`);

  // TODO: Enviar email notificando sobre falha no pagamento
}
