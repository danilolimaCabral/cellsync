/**
 * Script para popular módulos padrão do sistema
 * Executar: node server/seed-modules.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Seeding modules...\n');

// Módulos disponíveis no sistema
const modulesData = [
  {
    code: 'pdv',
    name: 'PDV (Vendas)',
    description: 'Ponto de venda com controle de estoque, clientes e formas de pagamento',
    icon: 'ShoppingCart',
    routePath: '/vendas',
    sortOrder: 1,
  },
  {
    code: 'estoque',
    name: 'Gestão de Estoque',
    description: 'Controle completo de estoque com movimentações, IMEI e rastreabilidade',
    icon: 'Package',
    routePath: '/estoque',
    sortOrder: 2,
  },
  {
    code: 'os',
    name: 'Ordem de Serviço',
    description: 'Gerenciamento de assistências técnicas e reparos',
    icon: 'Wrench',
    routePath: '/ordem-servico',
    sortOrder: 3,
  },
  {
    code: 'financeiro',
    name: 'Financeiro',
    description: 'Contas a pagar, receber, fluxo de caixa e relatórios financeiros',
    icon: 'DollarSign',
    routePath: '/financeiro',
    sortOrder: 4,
  },
  {
    code: 'comissoes',
    name: 'Controle de Comissões',
    description: 'Gestão de comissões de vendedores com aprovação e pagamento',
    icon: 'Wallet',
    routePath: '/controle-comissoes',
    sortOrder: 5,
  },
  {
    code: 'clientes',
    name: 'CRM (Clientes)',
    description: 'Cadastro e gestão de clientes',
    icon: 'Users',
    routePath: '/clientes',
    sortOrder: 6,
  },
  {
    code: 'relatorios',
    name: 'Relatórios e BI',
    description: 'Dashboards, KPIs e relatórios avançados',
    icon: 'TrendingUp',
    routePath: '/dashboard-bi',
    sortOrder: 7,
  },
  {
    code: 'nfe',
    name: 'Nota Fiscal Eletrônica',
    description: 'Emissão e gerenciamento de NF-e',
    icon: 'FileText',
    routePath: '/notas-fiscais',
    sortOrder: 8,
  },
];

// Inserir módulos
for (const moduleData of modulesData) {
  try {
    const [existing] = await db
      .select()
      .from(schema.modules)
      .where(schema.modules.code.eq(moduleData.code))
      .limit(1);

    if (existing) {
      console.log(`⏭️  Módulo "${moduleData.name}" já existe`);
    } else {
      await db.insert(schema.modules).values(moduleData);
      console.log(`✅ Módulo "${moduleData.name}" criado`);
    }
  } catch (error) {
    console.error(`❌ Erro ao criar módulo "${moduleData.name}":`, error.message);
  }
}

console.log('\n🌱 Seeding subscription plans...\n');

// Planos de assinatura
const plansData = [
  {
    code: 'basico',
    name: 'Plano Básico',
    description: 'Ideal para pequenas lojas que estão começando',
    monthlyPrice: 9900, // R$ 99,00
    maxUsers: 3,
    maxStorage: 5000, // 5GB
    features: JSON.stringify([
      'PDV completo',
      'Gestão de estoque básica',
      'Cadastro de clientes',
      'Até 3 usuários',
      '5GB de armazenamento',
    ]),
    sortOrder: 1,
  },
  {
    code: 'profissional',
    name: 'Plano Profissional',
    description: 'Para lojas em crescimento que precisam de mais recursos',
    monthlyPrice: 19900, // R$ 199,00
    maxUsers: 10,
    maxStorage: 20000, // 20GB
    features: JSON.stringify([
      'Todos os recursos do Básico',
      'Ordem de Serviço',
      'Financeiro completo',
      'Controle de comissões',
      'Relatórios avançados',
      'Até 10 usuários',
      '20GB de armazenamento',
    ]),
    sortOrder: 2,
  },
  {
    code: 'enterprise',
    name: 'Plano Enterprise',
    description: 'Solução completa para redes e grandes operações',
    monthlyPrice: 39900, // R$ 399,00
    maxUsers: null, // Ilimitado
    maxStorage: null, // Ilimitado
    features: JSON.stringify([
      'Todos os recursos do Profissional',
      'NF-e integrada',
      'Multi-loja',
      'API completa',
      'Suporte prioritário',
      'Usuários ilimitados',
      'Armazenamento ilimitado',
      'Backups automáticos',
    ]),
    sortOrder: 3,
  },
];

// Inserir planos
const planIds = {};
for (const planData of plansData) {
  try {
    const [existing] = await db
      .select()
      .from(schema.subscriptionPlans)
      .where(schema.subscriptionPlans.code.eq(planData.code))
      .limit(1);

    if (existing) {
      console.log(`⏭️  Plano "${planData.name}" já existe`);
      planIds[planData.code] = existing.id;
    } else {
      const [result] = await db.insert(schema.subscriptionPlans).values(planData);
      planIds[planData.code] = result.insertId;
      console.log(`✅ Plano "${planData.name}" criado`);
    }
  } catch (error) {
    console.error(`❌ Erro ao criar plano "${planData.name}":`, error.message);
  }
}

console.log('\n🌱 Linking modules to plans...\n');

// Buscar IDs dos módulos
const allModules = await db.select().from(schema.modules);
const moduleIds = {};
allModules.forEach(m => {
  moduleIds[m.code] = m.id;
});

// Módulos por plano
const planModulesData = {
  basico: ['pdv', 'estoque', 'clientes'],
  profissional: ['pdv', 'estoque', 'clientes', 'os', 'financeiro', 'comissoes', 'relatorios'],
  enterprise: ['pdv', 'estoque', 'clientes', 'os', 'financeiro', 'comissoes', 'relatorios', 'nfe'],
};

for (const [planCode, moduleCodes] of Object.entries(planModulesData)) {
  const planId = planIds[planCode];
  if (!planId) continue;

  for (const moduleCode of moduleCodes) {
    const moduleId = moduleIds[moduleCode];
    if (!moduleId) continue;

    try {
      const [existing] = await db
        .select()
        .from(schema.planModules)
        .where(schema.planModules.planId.eq(planId))
        .where(schema.planModules.moduleId.eq(moduleId))
        .limit(1);

      if (!existing) {
        await db.insert(schema.planModules).values({
          planId,
          moduleId,
          included: true,
        });
        console.log(`✅ Módulo "${moduleCode}" vinculado ao plano "${planCode}"`);
      }
    } catch (error) {
      console.error(`❌ Erro ao vincular módulo:`, error.message);
    }
  }
}

console.log('\n✅ Seed completed!\n');

await connection.end();
process.exit(0);
