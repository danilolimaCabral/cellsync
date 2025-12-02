import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

async function setupStripeProducts() {
  console.log('🚀 Configurando produtos no Stripe...\n');

  try {
    // ========== PLANO BÁSICO ==========
    console.log('📦 Criando Plano Básico...');
    const basicProduct = await stripe.products.create({
      name: 'Plano Básico',
      description: 'Ideal para pequenas lojas iniciantes',
      metadata: {
        slug: 'basico',
        max_users: '3',
        max_products: '500',
        max_storage: '5368709120', // 5GB
      },
    });

    const basicPriceMonthly = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 9900, // R$ 99,00
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_slug: 'basico',
        billing_period: 'monthly',
      },
    });

    const basicPriceYearly = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 99000, // R$ 990,00 (economiza R$ 198)
      currency: 'brl',
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan_slug: 'basico',
        billing_period: 'yearly',
      },
    });

    console.log(`✅ Plano Básico criado!`);
    console.log(`   Product ID: ${basicProduct.id}`);
    console.log(`   Price ID Mensal: ${basicPriceMonthly.id}`);
    console.log(`   Price ID Anual: ${basicPriceYearly.id}\n`);

    // ========== PLANO PROFISSIONAL ==========
    console.log('📦 Criando Plano Profissional...');
    const proProduct = await stripe.products.create({
      name: 'Plano Profissional',
      description: 'Para lojas em crescimento',
      metadata: {
        slug: 'profissional',
        max_users: '10',
        max_products: '5000',
        max_storage: '21474836480', // 20GB
      },
    });

    const proPriceMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 19900, // R$ 199,00
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_slug: 'profissional',
        billing_period: 'monthly',
      },
    });

    const proPriceYearly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 199000, // R$ 1.990,00 (economiza R$ 398)
      currency: 'brl',
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan_slug: 'profissional',
        billing_period: 'yearly',
      },
    });

    console.log(`✅ Plano Profissional criado!`);
    console.log(`   Product ID: ${proProduct.id}`);
    console.log(`   Price ID Mensal: ${proPriceMonthly.id}`);
    console.log(`   Price ID Anual: ${proPriceYearly.id}\n`);

    // ========== PLANO ENTERPRISE ==========
    console.log('📦 Criando Plano Enterprise...');
    const enterpriseProduct = await stripe.products.create({
      name: 'Plano Enterprise',
      description: 'Solução completa para grandes operações',
      metadata: {
        slug: 'enterprise',
        max_users: '999999',
        max_products: '999999',
        max_storage: '107374182400', // 100GB
      },
    });

    const enterprisePriceMonthly = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 39900, // R$ 399,00
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_slug: 'enterprise',
        billing_period: 'monthly',
      },
    });

    const enterprisePriceYearly = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 399000, // R$ 3.990,00 (economiza R$ 798)
      currency: 'brl',
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan_slug: 'enterprise',
        billing_period: 'yearly',
      },
    });

    console.log(`✅ Plano Enterprise criado!`);
    console.log(`   Product ID: ${enterpriseProduct.id}`);
    console.log(`   Price ID Mensal: ${enterprisePriceMonthly.id}`);
    console.log(`   Price ID Anual: ${enterprisePriceYearly.id}\n`);

    // ========== RESUMO PARA ATUALIZAR O BANCO ==========
    console.log('\n📋 RESUMO - Cole estes comandos SQL no banco de dados:\n');
    console.log('-- Atualizar Plano Básico');
    console.log(`UPDATE plans SET stripe_price_id_monthly = '${basicPriceMonthly.id}', stripe_price_id_yearly = '${basicPriceYearly.id}' WHERE slug = 'basico';\n`);
    
    console.log('-- Atualizar Plano Profissional');
    console.log(`UPDATE plans SET stripe_price_id_monthly = '${proPriceMonthly.id}', stripe_price_id_yearly = '${proPriceYearly.id}' WHERE slug = 'profissional';\n`);
    
    console.log('-- Atualizar Plano Enterprise');
    console.log(`UPDATE plans SET stripe_price_id_monthly = '${enterprisePriceMonthly.id}', stripe_price_id_yearly = '${enterprisePriceYearly.id}' WHERE slug = 'enterprise';\n`);

    console.log('✅ Configuração concluída! Agora execute os comandos SQL acima.\n');

    // Retornar IDs para uso programático
    return {
      basico: {
        monthly: basicPriceMonthly.id,
        yearly: basicPriceYearly.id,
      },
      profissional: {
        monthly: proPriceMonthly.id,
        yearly: proPriceYearly.id,
      },
      enterprise: {
        monthly: enterprisePriceMonthly.id,
        yearly: enterprisePriceYearly.id,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao configurar produtos:', error.message);
    throw error;
  }
}

// Executar
setupStripeProducts()
  .then((priceIds) => {
    console.log('🎉 Sucesso! Price IDs criados:', JSON.stringify(priceIds, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha:', error);
    process.exit(1);
  });
