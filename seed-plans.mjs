import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Planos baseados em pesquisa de mercado para lojas de celular
const plans = [
  {
    name: 'Plano Básico',
    slug: 'basico',
    description: 'Ideal para lojas pequenas começando a digitalizar',
    priceMonthly: 9700, // R$ 97,00
    priceYearly: 970000, // R$ 970,00 (2 meses grátis)
    maxUsers: 1,
    maxProducts: 500,
    maxStorage: 1024, // 1GB
    features: JSON.stringify([
      'Gestão de Estoque',
      'PDV de Vendas',
      'Cadastro de Clientes',
      'Relatórios Básicos',
      'Suporte por Email'
    ]),
    isActive: true
  },
  {
    name: 'Plano Profissional',
    slug: 'profissional',
    description: 'Para lojas em crescimento que precisam de mais recursos',
    priceMonthly: 19700, // R$ 197,00
    priceYearly: 1970000, // R$ 1.970,00 (2 meses grátis)
    maxUsers: 5,
    maxProducts: 999999, // Ilimitado
    maxStorage: 5120, // 5GB
    features: JSON.stringify([
      'Tudo do Plano Básico',
      'Usuários Ilimitados (até 5)',
      'Produtos Ilimitados',
      'IA para Cadastro de Produtos',
      'IA para Diagnóstico de OS',
      'Ordens de Serviço',
      'Gestão Financeira',
      'Comissões de Vendedores',
      'Geração de Etiquetas',
      'Relatórios Avançados',
      'Notas Fiscais (NFe)',
      'Suporte Prioritário'
    ]),
    isActive: true
  },
  {
    name: 'Plano Empresarial',
    slug: 'empresarial',
    description: 'Solução completa para redes e importadoras',
    priceMonthly: 39700, // R$ 397,00
    priceYearly: 3970000, // R$ 3.970,00 (2 meses grátis)
    maxUsers: 999999, // Ilimitado
    maxProducts: 999999, // Ilimitado
    maxStorage: 20480, // 20GB
    features: JSON.stringify([
      'Tudo do Plano Profissional',
      'Usuários Ilimitados',
      'Multi-loja (até 5 lojas)',
      'White-label (sua marca)',
      'Domínio Personalizado',
      'API de Integração',
      'Backup Automático Diário',
      'Relatórios Personalizados',
      'Dashboard Executivo',
      'Suporte 24/7',
      'Gerente de Conta Dedicado',
      'Treinamento Personalizado'
    ]),
    isActive: true
  }
];

console.log('🌱 Populando planos de venda...\n');

for (const plan of plans) {
  try {
    await connection.execute(
      `INSERT INTO plans (name, slug, description, price_monthly, price_yearly, max_users, max_products, max_storage, features, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description),
       price_monthly = VALUES(price_monthly),
       price_yearly = VALUES(price_yearly),
       max_users = VALUES(max_users),
       max_products = VALUES(max_products),
       max_storage = VALUES(max_storage),
       features = VALUES(features),
       is_active = VALUES(is_active)`,
      [
        plan.name,
        plan.slug,
        plan.description,
        plan.priceMonthly,
        plan.priceYearly,
        plan.maxUsers,
        plan.maxProducts,
        plan.maxStorage,
        plan.features,
        plan.isActive
      ]
    );
    console.log(`✅ ${plan.name} - R$ ${(plan.priceMonthly / 100).toFixed(2)}/mês`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${plan.name}:`, error.message);
  }
}

console.log('\n✅ Planos populados com sucesso!');
await connection.end();
