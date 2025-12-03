import express, { Express } from 'express';
import { handleStripeWebhook } from '../stripe-webhook';

/**
 * Configurar endpoint de webhook do Stripe
 * IMPORTANTE: Este endpoint precisa receber o body RAW (não parseado)
 */
export function setupStripeWebhook(app: Express) {
  // Endpoint de webhook do Stripe
  // Usa express.raw() para receber body não parseado (necessário para verificar assinatura)
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        console.error('[Stripe Webhook] Assinatura não encontrada');
        return res.status(400).send('Assinatura do webhook não encontrada');
      }

      try {
        const rawBody = req.body.toString('utf8');
        const result = await handleStripeWebhook(rawBody, signature as string);

        if (result.received) {
          res.json({ received: true });
        } else {
          res.status(400).send(result.error || 'Erro ao processar webhook');
        }
      } catch (error: any) {
        console.error('[Stripe Webhook] Erro:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    }
  );

  console.log('[Stripe] Webhook endpoint configurado em /api/stripe/webhook');
}
