/**
 * Script de Seed - Popular banco de dados com dados de exemplo
 * 
 * Uso: node scripts/seed.mjs
 * 
 * ATENÇÃO: Este script irá LIMPAR todos os dados existentes e popular com dados de exemplo!
 */

import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";

// Importar schemas
import {
  users, customers, products, stockItems, sales, saleItems,
  serviceOrders, serviceOrderParts, accountsPayable, accountsReceivable,
  cashTransactions, commissionRules, commissions, invoices, invoiceItems
} from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("🌱 Iniciando seed do banco de dados...\n");

// ============= LIMPAR DADOS EXISTENTES =============
async function clearDatabase() {
  console.log("🗑️  Limpando dados existentes...");
  
  // Ordem correta para evitar erros de foreign key
  await db.delete(invoiceItems);
  await db.delete(invoices);
  await db.delete(commissions);
  await db.delete(commissionRules);
  await db.delete(cashTransactions);
  await db.delete(accountsReceivable);
  await db.delete(accountsPayable);
  await db.delete(serviceOrderParts);
  await db.delete(serviceOrders);
  await db.delete(saleItems);
  await db.delete(sales);
  await db.delete(stockItems);
  await db.delete(products);
  await db.delete(customers);
  await db.delete(users);
  
  console.log("✅ Dados limpos com sucesso!\n");
}

// ============= USUÁRIOS =============
async function seedUsers() {
  console.log("👤 Criando usuários...");
  
  const hashedPassword = await bcrypt.hash("senha123", 10);
  
  const usersData = [
    {
      email: "admin@okcells.com",
      password: hashedPassword,
      name: "Administrador Sistema",
      role: "admin",
      active: true,
    },
    {
      email: "joao.vendedor@okcells.com",
      password: hashedPassword,
      name: "João Silva",
      role: "vendedor",
      active: true,
    },
    {
      email: "maria.vendedora@okcells.com",
      password: hashedPassword,
      name: "Maria Santos",
      role: "vendedor",
      active: true,
    },
    {
      email: "carlos.tecnico@okcells.com",
      password: hashedPassword,
      name: "Carlos Oliveira",
      role: "tecnico",
      active: true,
    },
    {
      email: "ana.gerente@okcells.com",
      password: hashedPassword,
      name: "Ana Paula",
      role: "gerente",
      active: true,
    },
  ];
  
  await db.insert(users).values(usersData);
  console.log(`✅ ${usersData.length} usuários criados (senha padrão: senha123)\n`);
}

// ============= CLIENTES =============
async function seedCustomers() {
  console.log("👥 Criando clientes...");
  
  const customersData = [
    {
      name: "Pedro Henrique Costa",
      email: "pedro.costa@email.com",
      phone: "(11) 98765-4321",
      cpf: "123.456.789-00",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      loyaltyPoints: 150,
      segment: "premium",
    },
    {
      name: "Juliana Ferreira",
      email: "ju.ferreira@email.com",
      phone: "(11) 97654-3210",
      cpf: "234.567.890-11",
      address: "Av. Paulista, 1000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      loyaltyPoints: 85,
      segment: "regular",
    },
    {
      name: "TechCell Importadora LTDA",
      email: "contato@techcell.com.br",
      phone: "(11) 3456-7890",
      cnpj: "12.345.678/0001-90",
      address: "Rua do Comércio, 500",
      city: "São Paulo",
      state: "SP",
      zipCode: "03456-789",
      loyaltyPoints: 500,
      segment: "corporativo",
    },
    {
      name: "Roberto Almeida",
      email: "roberto.almeida@email.com",
      phone: "(11) 96543-2109",
      cpf: "345.678.901-22",
      address: "Rua Augusta, 250",
      city: "São Paulo",
      state: "SP",
      zipCode: "01305-000",
      loyaltyPoints: 45,
      segment: "regular",
    },
    {
      name: "Fernanda Lima",
      email: "fe.lima@email.com",
      phone: "(11) 95432-1098",
      cpf: "456.789.012-33",
      address: "Rua Oscar Freire, 789",
      city: "São Paulo",
      state: "SP",
      zipCode: "01426-001",
      loyaltyPoints: 220,
      segment: "premium",
    },
  ];
  
  await db.insert(customers).values(customersData);
  console.log(`✅ ${customersData.length} clientes criados\n`);
}

// ============= PRODUTOS =============
async function seedProducts() {
  console.log("📱 Criando produtos...");
  
  const productsData = [
    // Celulares
    {
      name: "iPhone 15 Pro Max 256GB",
      description: "Smartphone Apple com chip A17 Pro, câmera de 48MP",
      category: "Smartphone",
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      sku: "IPH15PM256",
      barcode: "7891234567890",
      costPrice: 650000, // R$ 6.500,00
      salePrice: 850000, // R$ 8.500,00
      minStock: 5,
      currentStock: 12,
      requiresImei: true,
      active: true,
    },
    {
      name: "Samsung Galaxy S24 Ultra 512GB",
      description: "Smartphone Samsung com S Pen, tela AMOLED 6.8\"",
      category: "Smartphone",
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      sku: "SAMS24U512",
      barcode: "7891234567891",
      costPrice: 580000, // R$ 5.800,00
      salePrice: 750000, // R$ 7.500,00
      minStock: 5,
      currentStock: 8,
      requiresImei: true,
      active: true,
    },
    {
      name: "Xiaomi 14 Pro 256GB",
      description: "Smartphone Xiaomi com câmera Leica, carregamento rápido 120W",
      category: "Smartphone",
      brand: "Xiaomi",
      model: "14 Pro",
      sku: "XIA14P256",
      barcode: "7891234567892",
      costPrice: 320000, // R$ 3.200,00
      salePrice: 450000, // R$ 4.500,00
      minStock: 10,
      currentStock: 15,
      requiresImei: true,
      active: true,
    },
    // Acessórios
    {
      name: "Capinha Silicone iPhone 15 Pro",
      description: "Capinha de silicone original, várias cores",
      category: "Acessório",
      brand: "Apple",
      model: "Silicone Case",
      sku: "CAP-IPH15P",
      barcode: "7891234567893",
      costPrice: 8000, // R$ 80,00
      salePrice: 15000, // R$ 150,00
      minStock: 20,
      currentStock: 45,
      requiresImei: false,
      active: true,
    },
    {
      name: "Película de Vidro Temperado",
      description: "Película 9H, proteção total da tela",
      category: "Acessório",
      brand: "Genérica",
      model: "Universal",
      sku: "PEL-VIDRO",
      barcode: "7891234567894",
      costPrice: 500, // R$ 5,00
      salePrice: 2000, // R$ 20,00
      minStock: 50,
      currentStock: 120,
      requiresImei: false,
      active: true,
    },
    {
      name: "Carregador Turbo 65W USB-C",
      description: "Carregador rápido com cabo USB-C incluso",
      category: "Acessório",
      brand: "Genérica",
      model: "65W Fast Charge",
      sku: "CARR-65W",
      barcode: "7891234567895",
      costPrice: 3500, // R$ 35,00
      salePrice: 8000, // R$ 80,00
      minStock: 15,
      currentStock: 30,
      requiresImei: false,
      active: true,
    },
    // Peças para Reparo
    {
      name: "Tela LCD iPhone 13",
      description: "Display LCD original para iPhone 13",
      category: "Peça",
      brand: "Apple",
      model: "iPhone 13 LCD",
      sku: "LCD-IPH13",
      barcode: "7891234567896",
      costPrice: 45000, // R$ 450,00
      salePrice: 80000, // R$ 800,00
      minStock: 3,
      currentStock: 8,
      requiresImei: false,
      active: true,
    },
    {
      name: "Bateria Samsung Galaxy S21",
      description: "Bateria original 4000mAh",
      category: "Peça",
      brand: "Samsung",
      model: "Galaxy S21 Battery",
      sku: "BAT-S21",
      barcode: "7891234567897",
      costPrice: 8000, // R$ 80,00
      salePrice: 15000, // R$ 150,00
      minStock: 5,
      currentStock: 12,
      requiresImei: false,
      active: true,
    },
    {
      name: "Conector de Carga USB-C",
      description: "Conector de carga universal USB-C",
      category: "Peça",
      brand: "Genérica",
      model: "USB-C Port",
      sku: "CONN-USBC",
      barcode: "7891234567898",
      costPrice: 1500, // R$ 15,00
      salePrice: 4000, // R$ 40,00
      minStock: 10,
      currentStock: 25,
      requiresImei: false,
      active: true,
    },
    {
      name: "Câmera Traseira Xiaomi 13",
      description: "Módulo de câmera traseira 50MP",
      category: "Peça",
      brand: "Xiaomi",
      model: "13 Camera",
      sku: "CAM-XIA13",
      barcode: "7891234567899",
      costPrice: 12000, // R$ 120,00
      salePrice: 25000, // R$ 250,00
      minStock: 3,
      currentStock: 6,
      requiresImei: false,
      active: true,
    },
  ];
  
  await db.insert(products).values(productsData);
  console.log(`✅ ${productsData.length} produtos criados\n`);
}

console.log("\n✅ ========================================");
console.log("✅ SEED COMPLETO COM SUCESSO!");
console.log("✅ ========================================\n");

console.log("📊 Resumo dos dados criados:");
console.log("   - 5 usuários (senha: senha123)");
console.log("   - 5 clientes");
console.log("   - 10 produtos");

console.log("\n🔐 Credenciais de acesso:");
console.log("   Email: admin@okcells.com");
console.log("   Senha: senha123\n");

// ============= EXECUTAR SEED =============
async function runSeed() {
  try {
    await clearDatabase();
    await seedUsers();
    await seedCustomers();
    await seedProducts();
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao executar seed:", error);
    process.exit(1);
  }
}

// Executar
runSeed();
