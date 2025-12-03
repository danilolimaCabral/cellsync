import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeLive() {
  console.log('🚀 Criando produtos no Stripe LIVE...\n');

  const plans = [
    {
      name: 'CellSync - Plano Básico',
      description: 'Ideal para lojas pequenas começando a digitalizar',
      price: 9700, // R$ 97,00
      slug: 'basico'
    },
    {
      name: 'CellSync - Plano Profissional',
      description: 'Para lojas em crescimento que precisam de mais recursos',
      price: 19700, // R$ 197,00
      slug: 'profissional'
    },
    {
      name: 'CellSync - Plano Empresarial',
      description: 'Solução completa para redes e importadoras',
      price: 59900, // R$ 599,00
      slug: 'empresarial'
    }
  ];

  const results = [];

  for (const plan of plans) {
    console.log(`📦 Criando produto: ${plan.name}...`);
    
    // Criar produto
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
    });
    console.log(`✅ Produto criado: ${product.id}`);

    // Criar preço mensal
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
    });
    console.log(`✅ Preço criado: ${price.id}`);
    console.log(`   💰 Valor: R$ ${(plan.price / 100).toFixed(2)}/mês\n`);

    results.push({
      slug: plan.slug,
      name: plan.name,
      price: plan.price,
      product_id: product.id,
      price_id: price.id
    });
  }

  console.log('🎉 Todos os produtos foram criados com sucesso!\n');
  console.log('📋 Resumo dos Price IDs:\n');
  
  results.forEach(r => {
    console.log(`${r.name}:`);
    console.log(`  Slug: ${r.slug}`);
    console.log(`  Price ID: ${r.price_id}`);
    console.log(`  Valor: R$ ${(r.price / 100).toFixed(2)}/mês\n`);
  });

  console.log('\n💾 Comandos SQL para atualizar o banco:\n');
  results.forEach(r => {
    console.log(`UPDATE plans SET stripe_price_id_monthly = '${r.price_id}' WHERE slug = '${r.slug}';`);
  });
}

setupStripeLive().catch(console.error);
