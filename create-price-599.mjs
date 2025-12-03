import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createPrice() {
  console.log('🚀 Criando novo Price no Stripe para R$ 599,00...\n');

  // Criar novo produto
  const product = await stripe.products.create({
    name: 'CellSync - Plano Empresarial',
    description: 'Solução completa para redes e importadoras',
  });
  console.log(`✅ Produto criado: ${product.id}`);

  // Criar preço mensal (R$ 599,00 = 59900 centavos)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 59900,
    currency: 'brl',
    recurring: {
      interval: 'month',
    },
  });
  
  console.log(`✅ Price criado: ${price.id}`);
  console.log(`   💰 Valor: R$ 599.00/mês\n`);
  console.log(`📋 Execute este comando para atualizar o banco:`);
  console.log(`\nmysql -h hopper.proxy.rlwy.net -P 37653 -uroot -pAwBxYmxtNKHVHMelMsFQXoSRqNrNOuXl railway -e "UPDATE plans SET stripe_price_id_monthly = '${price.id}' WHERE slug = 'empresarial';"\n`);
}

createPrice().catch(console.error);
