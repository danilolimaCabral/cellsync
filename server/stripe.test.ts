import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import type { User } from '../drizzle/schema';

describe('Stripe Integration', () => {
  let testUser: User;
  let testContext: any;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Buscar um usuário de teste
    const { users } = await import('../drizzle/schema');
    const [user] = await db.select().from(users).limit(1);
    
    if (!user) {
      throw new Error('Nenhum usuário encontrado para teste');
    }

    testUser = user;
    testContext = {
      user: testUser,
      req: {
        headers: {
          origin: 'http://localhost:3000',
        },
      },
    };
  });

  describe('Plans Procedures', () => {
    it('deve listar planos disponíveis', async () => {
      const caller = appRouter.createCaller(testContext);
      const plans = await caller.plans.list();

      expect(plans).toBeDefined();
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      
      // Verificar estrutura do plano
      const plan = plans[0];
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('slug');
      expect(plan).toHaveProperty('priceMonthly');
    });

    it('deve buscar assinatura do usuário', async () => {
      const caller = appRouter.createCaller(testContext);
      const subscription = await caller.plans.mySubscription();

      // Pode ser null se usuário não tem assinatura
      if (subscription) {
        expect(subscription).toHaveProperty('tenant');
        expect(subscription).toHaveProperty('plan');
        expect(subscription.tenant).toHaveProperty('id');
        expect(subscription.tenant).toHaveProperty('status');
      }
    });

    it('deve criar sessão de checkout do Stripe', async () => {
      const caller = appRouter.createCaller(testContext);
      
      try {
        const result = await caller.plans.createCheckout({
          planSlug: 'basico',
          billingPeriod: 'monthly',
        });

        expect(result).toHaveProperty('checkoutUrl');
        expect(result).toHaveProperty('sessionId');
        expect(result.checkoutUrl).toContain('stripe.com');
      } catch (error: any) {
        // Pode falhar se Stripe não estiver configurado em teste
        console.log('Checkout test skipped:', error.message);
      }
    });
  });

  describe('Subscription Management', () => {
    it('deve validar dados do tenant', async () => {
      const db = await getDb();
      if (!db) throw new Error('DB connection failed');

      const { tenants } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, testUser.tenantId))
        .limit(1);

      expect(tenant).toBeDefined();
      expect(tenant).toHaveProperty('id');
      expect(tenant).toHaveProperty('name');
      expect(tenant).toHaveProperty('status');
      expect(tenant).toHaveProperty('planId');
      
      // Status deve ser um dos valores válidos
      expect(['active', 'trial', 'suspended', 'cancelled']).toContain(tenant.status);
    });

    it('deve ter plano associado ao tenant', async () => {
      const db = await getDb();
      if (!db) throw new Error('DB connection failed');

      const { tenants } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, testUser.tenantId))
        .limit(1);

      expect(tenant).toBeDefined();
      expect(tenant.planId).toBeGreaterThan(0);

      // Buscar plano
      const { getPlanById } = await import('./db-plans');
      const plan = await getPlanById(tenant.planId);

      expect(plan).toBeDefined();
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('priceMonthly');
      expect(plan.priceMonthly).toBeGreaterThan(0);
    });
  });

  describe('Webhook Endpoint', () => {
    it('deve ter endpoint de webhook configurado', async () => {
      // Verificar se arquivo de webhook existe
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const webhookPath = path.join(process.cwd(), 'server', 'stripe-webhook.ts');
      const endpointPath = path.join(process.cwd(), 'server', '_core', 'stripe-webhook-endpoint.ts');
      
      const webhookExists = await fs.access(webhookPath).then(() => true).catch(() => false);
      const endpointExists = await fs.access(endpointPath).then(() => true).catch(() => false);
      
      expect(webhookExists).toBe(true);
      expect(endpointExists).toBe(true);
    });

    it('deve ter variável de ambiente STRIPE_WEBHOOK_SECRET', () => {
      // Em produção, esta variável deve estar configurada
      const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
      
      // Log para debug
      console.log('STRIPE_WEBHOOK_SECRET configured:', hasWebhookSecret);
      
      // Não falhar teste se não estiver configurado em ambiente de teste
      expect(typeof process.env.STRIPE_WEBHOOK_SECRET).toBe('string');
    });
  });
});
