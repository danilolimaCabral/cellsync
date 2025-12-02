/**
 * Script de seed de dados para demonstração
 * Popula o banco com dados de exemplo para testes e demos
 * 
 * Uso: node scripts/seed-demo-data.mjs
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Criar conexão com banco
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🌱 Iniciando seed de dados de demonstração...\n');

// IDs que serão usados
const TENANT_ID = 1; // Tenant Master
const ADMIN_USER_ID = 1; // Bruno (já existe)

try {
  // ============= PRODUTOS =============
  console.log('📦 Criando produtos de exemplo...');
  
  const produtos = [
    // Smartphones
    { name: 'iPhone 15 Pro Max 256GB', sku: 'IPH15PROMAX256', barcode: '7891234567890', category: 'Smartphones', brand: 'Apple', model: 'iPhone 15 Pro Max', costPrice: 550000, salePrice: 799900, minStock: 3, currentStock: 8, requiresImei: true },
    { name: 'Samsung Galaxy S24 Ultra 512GB', sku: 'SAMS24ULTRA512', barcode: '7891234567891', category: 'Smartphones', brand: 'Samsung', model: 'Galaxy S24 Ultra', costPrice: 480000, salePrice: 699900, minStock: 3, currentStock: 5, requiresImei: true },
    { name: 'iPhone 14 128GB', sku: 'IPH14128', barcode: '7891234567892', category: 'Smartphones', brand: 'Apple', model: 'iPhone 14', costPrice: 320000, salePrice: 479900, minStock: 5, currentStock: 12, requiresImei: true },
    { name: 'Xiaomi Redmi Note 13 Pro', sku: 'XIAOMINOTE13PRO', barcode: '7891234567893', category: 'Smartphones', brand: 'Xiaomi', model: 'Redmi Note 13 Pro', costPrice: 120000, salePrice: 189900, minStock: 10, currentStock: 25, requiresImei: true },
    { name: 'Motorola Edge 40', sku: 'MOTOEDGE40', barcode: '7891234567894', category: 'Smartphones', brand: 'Motorola', model: 'Edge 40', costPrice: 150000, salePrice: 229900, minStock: 8, currentStock: 15, requiresImei: true },
    
    // Acessórios
    { name: 'Carregador USB-C 20W Original Apple', sku: 'CARREGADOR20W', barcode: '7891234567895', category: 'Acessórios', brand: 'Apple', model: '', costPrice: 8000, salePrice: 14900, minStock: 20, currentStock: 50, requiresImei: false },
    { name: 'Cabo USB-C para Lightning 1m', sku: 'CABOUSBC1M', barcode: '7891234567896', category: 'Acessórios', brand: 'Apple', model: '', costPrice: 5000, salePrice: 9900, minStock: 30, currentStock: 80, requiresImei: false },
    { name: 'Capinha Silicone iPhone 15', sku: 'CAPINHA15', barcode: '7891234567897', category: 'Acessórios', brand: 'Genérico', model: '', costPrice: 1500, salePrice: 4990, minStock: 50, currentStock: 150, requiresImei: false },
    { name: 'Película de Vidro Temperado', sku: 'PELICULA001', barcode: '7891234567898', category: 'Acessórios', brand: 'Genérico', model: '', costPrice: 800, salePrice: 2990, minStock: 100, currentStock: 300, requiresImei: false },
    { name: 'Fone de Ouvido Bluetooth TWS', sku: 'FONETWS001', barcode: '7891234567899', category: 'Acessórios', brand: 'Genérico', model: '', costPrice: 3500, salePrice: 7990, minStock: 20, currentStock: 45, requiresImei: false },
    { name: 'Power Bank 10000mAh', sku: 'POWERBANK10K', barcode: '7891234567900', category: 'Acessórios', brand: 'Anker', model: '', costPrice: 6000, salePrice: 12900, minStock: 15, currentStock: 30, requiresImei: false },
    { name: 'Suporte Veicular Magnético', sku: 'SUPORTEMAG001', barcode: '7891234567901', category: 'Acessórios', brand: 'Genérico', model: '', costPrice: 2000, salePrice: 4990, minStock: 25, currentStock: 60, requiresImei: false },
  ];

  for (const produto of produtos) {
    await connection.execute(
      `INSERT INTO products (tenant_id, name, sku, barcode, category, brand, model, cost_price, sale_price, min_stock, current_stock, requires_imei, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [TENANT_ID, produto.name, produto.sku, produto.barcode, produto.category, produto.brand, produto.model, produto.costPrice, produto.salePrice, produto.minStock, produto.currentStock, produto.requiresImei]
    );
  }
  
  console.log(`✅ ${produtos.length} produtos criados\n`);

  // ============= CLIENTES =============
  console.log('👥 Criando clientes de exemplo...');
  
  const clientes = [
    { name: 'João Silva', cpf: '123.456.789-00', email: 'joao.silva@email.com', phone: '11987654321', address: 'Rua das Flores, 123', city: 'São Paulo', state: 'SP', zipCode: '01234-567' },
    { name: 'Maria Souza', cpf: '987.654.321-00', email: 'maria.souza@email.com', phone: '11976543210', address: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', zipCode: '01310-100' },
    { name: 'Pedro Santos', cpf: '111.222.333-44', email: 'pedro.santos@email.com', phone: '21987654321', address: 'Rua das Palmeiras, 200', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20000-000' },
    { name: 'Ana Costa', cpf: '555.666.777-88', email: 'ana.costa@email.com', phone: '11965432109', address: 'Alameda Santos, 800', city: 'São Paulo', state: 'SP', zipCode: '01419-000' },
    { name: 'Carlos Oliveira', cpf: '999.888.777-66', email: 'carlos.oliveira@email.com', phone: '11955443322', address: 'Rua Augusta, 500', city: 'São Paulo', state: 'SP', zipCode: '01305-000' },
    { name: 'TechCell Importadora LTDA', cnpj: '12.345.678/0001-90', email: 'contato@techcell.com.br', phone: '1133334444', address: 'Rua do Comércio, 500', city: 'São Paulo', state: 'SP', zipCode: '01234-000' },
    { name: 'MegaCell Distribuidora', cnpj: '98.765.432/0001-10', email: 'vendas@megacell.com.br', phone: '1144445555', address: 'Av. Industrial, 1500', city: 'São Paulo', state: 'SP', zipCode: '03456-000' },
  ];

  for (const cliente of clientes) {
    await connection.execute(
      `INSERT INTO customers (tenant_id, name, cpf, cnpj, email, phone, address, city, state, zip_code, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [TENANT_ID, cliente.name, cliente.cpf || null, cliente.cnpj || null, cliente.email, cliente.phone, cliente.address, cliente.city, cliente.state, cliente.zipCode]
    );
  }
  
  console.log(`✅ ${clientes.length} clientes criados\n`);

  // ============= VENDAS =============
  console.log('💰 Criando vendas de exemplo...');
  
  // Obter IDs de produtos e clientes
  const [productRows] = await connection.execute('SELECT id, name, sale_price FROM products WHERE tenant_id = ? LIMIT 5', [TENANT_ID]);
  const [customerRows] = await connection.execute('SELECT id, name FROM customers WHERE tenant_id = ? LIMIT 3', [TENANT_ID]);

  const vendas = [
    { customerId: customerRows[0].id, productId: productRows[0].id, quantity: 1, unitPrice: productRows[0].sale_price, paymentMethod: 'credit_card', status: 'completed' },
    { customerId: customerRows[1].id, productId: productRows[1].id, quantity: 1, unitPrice: productRows[1].sale_price, paymentMethod: 'pix', status: 'completed' },
    { customerId: customerRows[2].id, productId: productRows[2].id, quantity: 2, unitPrice: productRows[2].sale_price, paymentMethod: 'debit_card', status: 'completed' },
    { customerId: customerRows[0].id, productId: productRows[3].id, quantity: 1, unitPrice: productRows[3].sale_price, paymentMethod: 'cash', status: 'completed' },
    { customerId: customerRows[1].id, productId: productRows[4].id, quantity: 3, unitPrice: productRows[4].sale_price, paymentMethod: 'credit_card', status: 'completed' },
  ];

  for (const venda of vendas) {
    const totalAmount = venda.quantity * venda.unitPrice;
    
    // Criar venda
    const [saleResult] = await connection.execute(
      `INSERT INTO sales (tenant_id, customer_id, user_id, total_amount, payment_method, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [TENANT_ID, venda.customerId, ADMIN_USER_ID, totalAmount, venda.paymentMethod, venda.status]
    );
    
    const saleId = saleResult.insertId;
    
    // Criar item da venda
    await connection.execute(
      `INSERT INTO sale_items (tenant_id, sale_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [TENANT_ID, saleId, venda.productId, venda.quantity, venda.unitPrice, totalAmount]
    );
  }
  
  console.log(`✅ ${vendas.length} vendas criadas\n`);

  // ============= ORDENS DE SERVIÇO =============
  console.log('🔧 Criando ordens de serviço de exemplo...');
  
  const ordens = [
    { customerId: customerRows[0].id, deviceType: 'Smartphone', brand: 'Apple', model: 'iPhone 13', issue: 'Tela quebrada', status: 'in_progress', estimatedCost: 80000 },
    { customerId: customerRows[1].id, deviceType: 'Smartphone', brand: 'Samsung', model: 'Galaxy S22', issue: 'Bateria não carrega', status: 'pending', estimatedCost: 35000 },
    { customerId: customerRows[2].id, deviceType: 'Smartphone', brand: 'Motorola', model: 'Moto G82', issue: 'Não liga', status: 'completed', estimatedCost: 25000 },
  ];

  for (const ordem of ordens) {
    await connection.execute(
      `INSERT INTO service_orders (tenant_id, customer_id, user_id, device_type, brand, model, issue, status, estimated_cost, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [TENANT_ID, ordem.customerId, ADMIN_USER_ID, ordem.deviceType, ordem.brand, ordem.model, ordem.issue, ordem.status, ordem.estimatedCost]
    );
  }
  
  console.log(`✅ ${ordens.length} ordens de serviço criadas\n`);

  // ============= MOVIMENTAÇÕES DE ESTOQUE =============
  console.log('📊 Criando movimentações de estoque...');
  
  const movimentacoes = [
    { productId: productRows[0].id, type: 'entry', quantity: 10, reason: 'Compra de fornecedor' },
    { productId: productRows[1].id, type: 'entry', quantity: 5, reason: 'Compra de fornecedor' },
    { productId: productRows[2].id, type: 'exit', quantity: 2, reason: 'Venda' },
    { productId: productRows[3].id, type: 'adjustment', quantity: -1, reason: 'Ajuste de inventário' },
  ];

  for (const mov of movimentacoes) {
    await connection.execute(
      `INSERT INTO stock_movements (tenant_id, product_id, user_id, type, quantity, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [TENANT_ID, mov.productId, ADMIN_USER_ID, mov.type, mov.quantity, mov.reason]
    );
  }
  
  console.log(`✅ ${movimentacoes.length} movimentações criadas\n`);

  console.log('🎉 Seed de dados concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`   - ${produtos.length} produtos`);
  console.log(`   - ${clientes.length} clientes`);
  console.log(`   - ${vendas.length} vendas`);
  console.log(`   - ${ordens.length} ordens de serviço`);
  console.log(`   - ${movimentacoes.length} movimentações de estoque`);
  console.log('\n✅ Banco de dados populado e pronto para demonstração!');

} catch (error) {
  console.error('❌ Erro ao executar seed:', error);
  process.exit(1);
} finally {
  await connection.end();
}
