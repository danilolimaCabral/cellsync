import Stripe from 'stripe';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './db/schema.js';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function updatePlanoEmpresarial() {
  console.log('🚀 Atualizando Plano Empresarial para R$ 599,00...\n');

  // 1. Criar novo produto no Stripe
  console.log('📦 Criando novo produto no Stripe...');
  const product = await stripe.products.create({
    name: 'CellSync - Plano Empresarial',
    description: 'Solução completa para redes e importadoras',
  });
  console.log(`✅ Produto criado: ${product.id}`);

  // 2. Criar preço mensal (R$ 599,00 = 59900 centavos)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 59900, // R$ 599,00 em centavos
    currency: 'brl',
    recurring: {
      interval: 'month',
    },
  });
  console.log(`✅ Preço criado: ${price.id}`);
  console.log(`   💰 Valor: R$ 599.00/mês\n`);

  // 3. Atualizar banco de dados
  console.log('💾 Atualizando banco de dados...');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  await db
    .update(schema.plans)
    .set({
      price_monthly: 59900, // R$ 599,00 em centavos
      stripe_price_id_monthly: price.id,
    })
    .where(eq(schema.plans.slug, 'empresarial'));

  console.log('✅ Plano Empresarial atualizado no banco de dados!');
  console.log(`   📊 Novo preço: R$ 599,00/mês`);
  console.log(`   🔑 Price ID: ${price.id}\n`);

  await connection.end();

  console.log('🎉 Atualização concluída com sucesso!');
  console.log('\n📋 Resumo:');
  console.log('- Plano Empresarial: R$ 397,00 → R$ 599,00');
  console.log(`- Novo Price ID: ${price.id}`);
}

updatePlanoEmpresarial().catch(console.error);
