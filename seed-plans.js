import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

async function seedPlans() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Verificando se já existem planos...');
    const [existing] = await connection.execute('SELECT count(*) as count FROM plans');
    
    if (existing[0].count > 0) {
      console.log('Planos já existem. Pulando seed.');
      return;
    }

    console.log('Criando planos padrão...');
    
    const plans = [
      {
        name: 'Básico',
        slug: 'basico',
        description: 'Para pequenas assistências',
        price_monthly: 4990, // R$ 49,90
        max_users: 2,
        max_products: 500,
        features: JSON.stringify(['os', 'vendas', 'estoque']),
        ai_imports_limit: 10
      },
      {
        name: 'Profissional',
        slug: 'profissional',
        description: 'Para lojas em crescimento',
        price_monthly: 9700, // R$ 97,00
        max_users: 5,
        max_products: 2000,
        features: JSON.stringify(['os', 'vendas', 'estoque', 'financeiro', 'whatsapp']),
        ai_imports_limit: 50
      },
      {
        name: 'Empresarial',
        slug: 'empresarial',
        description: 'Gestão completa sem limites',
        price_monthly: 19700, // R$ 197,00
        max_users: 20,
        max_products: 10000,
        features: JSON.stringify(['os', 'vendas', 'estoque', 'financeiro', 'whatsapp', 'api', 'multi_loja']),
        ai_imports_limit: -1
      }
    ];

    for (const plan of plans) {
      await connection.execute(
        `INSERT INTO plans (name, slug, description, price_monthly, max_users, max_products, features, ai_imports_limit, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)`,
        [plan.name, plan.slug, plan.description, plan.price_monthly, plan.max_users, plan.max_products, plan.features, plan.ai_imports_limit]
      );
      console.log(`Plano criado: ${plan.name}`);
    }

    console.log('Seed de planos concluído com sucesso!');

  } catch (error) {
    console.error('Erro ao criar planos:', error);
  } finally {
    await connection.end();
  }
}

seedPlans();
