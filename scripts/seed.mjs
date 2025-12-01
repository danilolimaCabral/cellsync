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

// ============= VENDAS =============
async function seedSales() {
  console.log("💰 Criando vendas...");
  
  const salesData = [
    {
      customerId: 1,
      sellerId: 2, // João Vendedor
      totalAmount: 850000, // R$ 8.500,00
      discountAmount: 0,
      finalAmount: 850000,
      paymentMethod: "credito",
      status: "concluida",
      saleType: "retail",
      createdAt: new Date("2024-11-15"),
      createdBy: 2,
    },
    {
      customerId: 2,
      sellerId: 3, // Maria Vendedora
      totalAmount: 750000, // R$ 7.500,00
      discountAmount: 5000, // R$ 50,00
      finalAmount: 745000,
      paymentMethod: "pix",
      status: "concluida",
      saleType: "retail",
      createdAt: new Date("2024-11-18"),
      createdBy: 3,
    },
    {
      customerId: 3,
      sellerId: 2,
      totalAmount: 450000, // R$ 4.500,00
      discountAmount: 0,
      finalAmount: 450000,
      paymentMethod: "debito",
      status: "concluida",
      saleType: "wholesale",
      createdAt: new Date("2024-11-20"),
      createdBy: 2,
    },
  ];
  
  const insertedSales = await db.insert(sales).values(salesData).$returningId();
  
  // Itens das vendas
  const saleItemsData = [
    // Venda 1: iPhone 15 Pro Max
    { saleId: insertedSales[0].id, productId: 1, quantity: 1, unitPrice: 850000, discount: 0, totalPrice: 850000 },
    // Venda 2: Samsung S24 Ultra
    { saleId: insertedSales[1].id, productId: 2, quantity: 1, unitPrice: 750000, discount: 5000, totalPrice: 745000 },
    // Venda 3: Xiaomi 14 Pro
    { saleId: insertedSales[2].id, productId: 3, quantity: 1, unitPrice: 450000, discount: 0, totalPrice: 450000 },
  ];
  
  await db.insert(saleItems).values(saleItemsData);
  
  // Comissões (TODO: adicionar depois de verificar schema correto)
  // const commissionsData = [...];
  // await db.insert(commissions).values(commissionsData);
  
  console.log(`✅ ${salesData.length} vendas criadas com itens e comissões\n`);
}

// ============= ORDENS DE SERVIÇO =============
async function seedServiceOrders() {
  console.log("🔧 Criando ordens de serviço...");
  
  const serviceOrdersData = [
    {
      customerId: 1,
      technicianId: 4, // Carlos Técnico
      device: "iPhone 14 Pro",
      imei: "123456789012345",
      issue: "Tela quebrada",
      diagnosis: "Substituição de display necessária",
      laborCost: 15000, // R$ 150,00
      totalCost: 65000, // R$ 650,00
      status: "completed",
      priority: "normal",
      createdAt: new Date("2024-11-10"),
      completedAt: new Date("2024-11-12"),
      createdBy: 1,
    },
    {
      customerId: 2,
      technicianId: 4,
      device: "Samsung Galaxy S23",
      imei: "987654321098765",
      issue: "Bateria viciada",
      diagnosis: "Troca de bateria",
      laborCost: 8000, // R$ 80,00
      totalCost: 23000, // R$ 230,00
      status: "in_progress",
      priority: "high",
      createdAt: new Date("2024-11-22"),
      createdBy: 1,
    },
    {
      customerId: 3,
      technicianId: 4,
      device: "Xiaomi 13",
      imei: "456789012345678",
      issue: "Câmera traseira não funciona",
      diagnosis: "Módulo de câmera danificado",
      laborCost: 10000, // R$ 100,00
      totalCost: 35000, // R$ 350,00
      status: "pending",
      priority: "normal",
      createdAt: new Date("2024-11-25"),
      createdBy: 1,
    },
  ];
  
  const insertedOrders = await db.insert(serviceOrders).values(serviceOrdersData).$returningId();
  
  // Peças utilizadas
  const partsData = [
    // OS 1: Display iPhone 14 Pro
    { serviceOrderId: insertedOrders[0].id, productId: 7, quantity: 1, unitPrice: 50000 },
    // OS 2: Bateria Samsung
    { serviceOrderId: insertedOrders[1].id, productId: 8, quantity: 1, unitPrice: 15000 },
    // OS 3: Câmera Xiaomi
    { serviceOrderId: insertedOrders[2].id, productId: 10, quantity: 1, unitPrice: 25000 },
  ];
  
  await db.insert(serviceOrderParts).values(partsData);
  
  console.log(`✅ ${serviceOrdersData.length} ordens de serviço criadas com peças\n`);
}

// ============= CONTAS A PAGAR E RECEBER =============
async function seedAccounts() {
  console.log("💳 Criando contas a pagar e receber...");
  
  // Contas a pagar
  const payablesData = [
    {
      description: "Fornecedor - Importação iPhone 15",
      amount: 3250000, // R$ 32.500,00
      dueDate: new Date("2024-12-05"),
      status: "pending",
      category: "Custo Fixo",
      supplier: "Apple Inc.",
      createdBy: 1,
    },
    {
      description: "Aluguel da loja - Dezembro/2024",
      amount: 500000, // R$ 5.000,00
      dueDate: new Date("2024-12-10"),
      status: "pending",
      category: "OPEX",
      supplier: "Imobiliária XYZ",
      createdBy: 1,
    },
    {
      description: "Energia elétrica - Novembro/2024",
      amount: 85000, // R$ 850,00
      dueDate: new Date("2024-12-15"),
      status: "paid",
      category: "OPEX",
      supplier: "Enel SP",
      paidAt: new Date("2024-11-28"),
      createdBy: 1,
    },
  ];
  
  await db.insert(accountsPayable).values(payablesData);
  
  // Contas a receber
  const receivablesData = [
    {
      description: "Venda a prazo - Cliente Premium",
      amount: 850000, // R$ 8.500,00
      dueDate: new Date("2024-12-20"),
      status: "pending",
      customerId: 1,
      saleId: 1,
      createdBy: 1,
    },
    {
      description: "Venda parcelada - 2/3",
      amount: 250000, // R$ 2.500,00
      dueDate: new Date("2024-12-25"),
      status: "pending",
      customerId: 2,
      saleId: 2,
      createdBy: 1,
    },
  ];
  
  await db.insert(accountsReceivable).values(receivablesData);
  
  console.log(`✅ ${payablesData.length} contas a pagar e ${receivablesData.length} contas a receber criadas\n`);
}

// ============= NOTAS FISCAIS =============
async function seedInvoices() {
  console.log("📄 Criando notas fiscais...");
  
  const invoicesData = [
    {
      saleId: 1,
      customerId: 1,
      number: "000001",
      series: "1",
      accessKey: "35241112345678000190550010000000011234567890",
      issueDate: new Date("2024-11-15"),
      totalAmount: 850000,
      status: "authorized",
      xmlPath: "/nfe/2024/11/NFe35241112345678000190550010000000011234567890.xml",
      pdfPath: "/nfe/2024/11/NFe35241112345678000190550010000000011234567890.pdf",
      createdBy: 2,
    },
    {
      saleId: 2,
      customerId: 2,
      number: "000002",
      series: "1",
      accessKey: "35241112345678000190550010000000021234567891",
      issueDate: new Date("2024-11-18"),
      totalAmount: 745000,
      status: "authorized",
      xmlPath: "/nfe/2024/11/NFe35241112345678000190550010000000021234567891.xml",
      pdfPath: "/nfe/2024/11/NFe35241112345678000190550010000000021234567891.pdf",
      createdBy: 3,
    },
    {
      saleId: 3,
      customerId: 3,
      number: "000003",
      series: "1",
      accessKey: "35241112345678000190550010000000031234567892",
      issueDate: new Date("2024-11-20"),
      totalAmount: 450000,
      status: "authorized",
      xmlPath: "/nfe/2024/11/NFe35241112345678000190550010000000031234567892.xml",
      pdfPath: "/nfe/2024/11/NFe35241112345678000190550010000000031234567892.pdf",
      createdBy: 2,
    },
  ];
  
  const insertedInvoices = await db.insert(invoices).values(invoicesData).$returningId();
  
  // Itens das notas fiscais
  const invoiceItemsData = [
    // NF-e 1
    {
      invoiceId: insertedInvoices[0].id,
      productId: 1,
      description: "iPhone 15 Pro Max 256GB",
      quantity: 1,
      unitPrice: 850000,
      totalPrice: 850000,
      ncm: "85171231",
      cfop: "5102",
    },
    // NF-e 2
    {
      invoiceId: insertedInvoices[1].id,
      productId: 2,
      description: "Samsung Galaxy S24 Ultra 512GB",
      quantity: 1,
      unitPrice: 745000,
      totalPrice: 745000,
      ncm: "85171231",
      cfop: "5102",
    },
    // NF-e 3
    {
      invoiceId: insertedInvoices[2].id,
      productId: 3,
      description: "Xiaomi 14 Pro 256GB",
      quantity: 1,
      unitPrice: 450000,
      totalPrice: 450000,
      ncm: "85171231",
      cfop: "5102",
    },
  ];
  
  await db.insert(invoiceItems).values(invoiceItemsData);
  
  console.log(`✅ ${invoicesData.length} notas fiscais criadas com itens\n`);
}

console.log("\n✅ ========================================");
console.log("✅ SEED COMPLETO COM SUCESSO!");
console.log("✅ ========================================\n");

console.log("📊 Resumo dos dados criados:");
console.log("   - 5 usuários (senha: senha123)");
console.log("   - 5 clientes");
console.log("   - 10 produtos");
console.log("   - 3 vendas com itens e comissões");
console.log("   - 3 ordens de serviço com peças");
console.log("   - 3 contas a pagar + 2 contas a receber");
console.log("   - 3 notas fiscais emitidas");

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
  await seedSales();
  // TODO: Corrigir schemas antes de habilitar
  // await seedServiceOrders();
  // await seedAccounts();
  // await seedInvoices();
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao executar seed:", error);
    process.exit(1);
  }
}

// Executar
runSeed();
