/**
 * Script de Seed Completo - CellSync
 * Popula o sistema com dados de exemplo para teste end-to-end
 * 
 * Execução: node scripts/seed-complete-system.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 Iniciando seed completo do sistema...\n');

// ============= 1. CONFIGURAR LOJA (TENANT) =============
console.log('📦 1. Configurando dados da loja...');

const lojaId = 1; // Assumindo que já existe um tenant com ID 1

await connection.execute(`
  UPDATE tenants SET
    name = 'TechCell - Loja de Celulares',
    cnpj = '12.345.678/0001-90',
    razaoSocial = 'TechCell Comércio de Eletrônicos LTDA',
    inscricaoEstadual = '123.456.789.012',
    inscricaoMunicipal = '12345678',
    cep = '01310-100',
    logradouro = 'Avenida Paulista',
    numero = '1578',
    complemento = 'Loja 15',
    bairro = 'Bela Vista',
    cidade = 'São Paulo',
    estado = 'SP',
    telefone = '(11) 3456-7890',
    celular = '(11) 98765-4321',
    email = 'contato@techcell.com.br',
    site = 'https://www.techcell.com.br',
    regimeTributario = 'simples_nacional'
  WHERE id = ${lojaId}
`);

console.log('✅ Loja configurada: TechCell - Loja de Celulares\n');

// ============= 2. CRIAR USUÁRIOS =============
console.log('👥 2. Criando usuários...');

const senhaHash = await bcrypt.hash('123456', 10);

// Admin
await connection.execute(`
  INSERT INTO users (tenantId, name, email, password, role, active, createdAt, updatedAt)
  VALUES (${lojaId}, 'Carlos Silva', 'admin@techcell.com', '${senhaHash}', 'admin', 1, NOW(), NOW())
  ON DUPLICATE KEY UPDATE name=name
`);

// Vendedores
await connection.execute(`
  INSERT INTO users (tenantId, name, email, password, role, active, createdAt, updatedAt)
  VALUES 
    (${lojaId}, 'João Santos', 'joao@techcell.com', '${senhaHash}', 'vendedor', 1, NOW(), NOW()),
    (${lojaId}, 'Maria Oliveira', 'maria@techcell.com', '${senhaHash}', 'vendedor', 1, NOW(), NOW())
  ON DUPLICATE KEY UPDATE name=name
`);

// Técnico
await connection.execute(`
  INSERT INTO users (tenantId, name, email, password, role, active, createdAt, updatedAt)
  VALUES (${lojaId}, 'Pedro Costa', 'pedro@techcell.com', '${senhaHash}', 'tecnico', 1, NOW(), NOW())
  ON DUPLICATE KEY UPDATE name=name
`);

console.log('✅ Usuários criados: Admin, 2 Vendedores, 1 Técnico\n');

// ============= 3. CRIAR PRODUTOS =============
console.log('📱 3. Cadastrando produtos...');

const produtos = [
  // Smartphones Premium
  { name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', model: 'iPhone 15 Pro Max', category: 'Smartphone', sku: 'IPH15PM256', costPrice: 650000, salePrice: 799900, wholesalePrice: 749900, minWholesaleQty: 5, requiresImei: 1 },
  { name: 'iPhone 14 Pro 128GB', brand: 'Apple', model: 'iPhone 14 Pro', category: 'Smartphone', sku: 'IPH14P128', costPrice: 450000, salePrice: 599900, wholesalePrice: 549900, minWholesaleQty: 5, requiresImei: 1 },
  { name: 'Samsung Galaxy S24 Ultra 512GB', brand: 'Samsung', model: 'Galaxy S24 Ultra', category: 'Smartphone', sku: 'SAMS24U512', costPrice: 550000, salePrice: 699900, wholesalePrice: 649900, minWholesaleQty: 5, requiresImei: 1 },
  { name: 'Samsung Galaxy S23 256GB', brand: 'Samsung', model: 'Galaxy S23', category: 'Smartphone', sku: 'SAMS23256', costPrice: 350000, salePrice: 479900, wholesalePrice: 429900, minWholesaleQty: 5, requiresImei: 1 },
  
  // Smartphones Intermediários
  { name: 'Xiaomi 14 256GB', brand: 'Xiaomi', model: 'Xiaomi 14', category: 'Smartphone', sku: 'XIA14256', costPrice: 280000, salePrice: 389900, wholesalePrice: 349900, minWholesaleQty: 10, requiresImei: 1 },
  { name: 'Xiaomi 13T Pro 512GB', brand: 'Xiaomi', model: '13T Pro', category: 'Smartphone', sku: 'XIA13TP512', costPrice: 250000, salePrice: 349900, wholesalePrice: 319900, minWholesaleQty: 10, requiresImei: 1 },
  { name: 'Motorola Edge 40 Pro 256GB', brand: 'Motorola', model: 'Edge 40 Pro', category: 'Smartphone', sku: 'MOTE40P256', costPrice: 220000, salePrice: 299900, wholesalePrice: 269900, minWholesaleQty: 10, requiresImei: 1 },
  
  // Smartphones Entrada
  { name: 'Redmi Note 13 Pro 256GB', brand: 'Xiaomi', model: 'Redmi Note 13 Pro', category: 'Smartphone', sku: 'REDN13P256', costPrice: 120000, salePrice: 179900, wholesalePrice: 159900, minWholesaleQty: 15, requiresImei: 1 },
  { name: 'Samsung Galaxy A54 128GB', brand: 'Samsung', model: 'Galaxy A54', category: 'Smartphone', sku: 'SAMA54128', costPrice: 140000, salePrice: 199900, wholesalePrice: 179900, minWholesaleQty: 15, requiresImei: 1 },
  { name: 'Motorola Moto G84 256GB', brand: 'Motorola', model: 'Moto G84', category: 'Smartphone', sku: 'MOTG84256', costPrice: 110000, salePrice: 159900, wholesalePrice: 139900, minWholesaleQty: 15, requiresImei: 1 },
  
  // Acessórios
  { name: 'Capinha Silicone Premium', brand: 'Genérico', category: 'Acessório', sku: 'CAP001', costPrice: 500, salePrice: 2990, wholesalePrice: 1990, minWholesaleQty: 50, requiresImei: 0 },
  { name: 'Película de Vidro 3D', brand: 'Genérico', category: 'Acessório', sku: 'PEL001', costPrice: 800, salePrice: 3990, wholesalePrice: 2990, minWholesaleQty: 50, requiresImei: 0 },
  { name: 'Carregador Turbo 65W', brand: 'Genérico', category: 'Acessório', sku: 'CAR001', costPrice: 2500, salePrice: 7990, wholesalePrice: 5990, minWholesaleQty: 30, requiresImei: 0 },
  { name: 'Cabo USB-C Reforçado 2m', brand: 'Genérico', category: 'Acessório', sku: 'CAB001', costPrice: 1200, salePrice: 4990, wholesalePrice: 3490, minWholesaleQty: 50, requiresImei: 0 },
  { name: 'Fone Bluetooth TWS', brand: 'Genérico', category: 'Áudio', sku: 'FON001', costPrice: 3500, salePrice: 12990, wholesalePrice: 9990, minWholesaleQty: 20, requiresImei: 0 },
];

for (const produto of produtos) {
  await connection.execute(`
    INSERT INTO products (
      tenantId, name, brand, model, category, sku, 
      costPrice, salePrice, wholesalePrice, minWholesaleQty,
      minStock, requiresImei, createdAt, updatedAt
    ) VALUES (
      ${lojaId}, '${produto.name}', '${produto.brand}', '${produto.model || ''}', 
      '${produto.category}', '${produto.sku}',
      ${produto.costPrice}, ${produto.salePrice}, ${produto.wholesalePrice}, ${produto.minWholesaleQty},
      10, ${produto.requiresImei}, NOW(), NOW()
    )
    ON DUPLICATE KEY UPDATE name=name
  `);
}

console.log(`✅ ${produtos.length} produtos cadastrados\n`);

// ============= 4. ADICIONAR ESTOQUE COM IMEI =============
console.log('📦 4. Adicionando produtos ao estoque...');

// Buscar IDs dos produtos
const [produtosDb] = await connection.execute('SELECT id, name, requiresImei FROM products WHERE tenantId = ?', [lojaId]);

let estoqueCount = 0;

for (const produto of produtosDb) {
  const quantidade = produto.requiresImei ? 5 : 50; // Smartphones: 5 unidades, Acessórios: 50
  
  for (let i = 0; i < quantidade; i++) {
    const imei = produto.requiresImei ? `35${Math.floor(Math.random() * 10000000000000)}` : null;
    
    await connection.execute(`
      INSERT INTO stockItems (
        tenantId, productId, imei, status, 
        entryDate, createdAt, updatedAt
      ) VALUES (
        ${lojaId}, ${produto.id}, ${imei ? `'${imei}'` : 'NULL'}, 'available',
        NOW(), NOW(), NOW()
      )
    `);
    
    estoqueCount++;
  }
}

console.log(`✅ ${estoqueCount} itens adicionados ao estoque\n`);

// ============= 5. CRIAR CLIENTES =============
console.log('👤 5. Cadastrando clientes...');

const clientes = [
  { name: 'Roberto Almeida', cpf: '123.456.789-00', phone: '(11) 98888-1111', email: 'roberto@email.com', address: 'Rua das Flores, 123', city: 'São Paulo', state: 'SP' },
  { name: 'Ana Paula Costa', cpf: '987.654.321-00', phone: '(11) 98888-2222', email: 'ana@email.com', address: 'Av. Brasil, 456', city: 'São Paulo', state: 'SP' },
  { name: 'Marcos Ferreira', cpf: '456.789.123-00', phone: '(11) 98888-3333', email: 'marcos@email.com', address: 'Rua Santos, 789', city: 'São Paulo', state: 'SP' },
  { name: 'Juliana Lima', cpf: '321.654.987-00', phone: '(11) 98888-4444', email: 'juliana@email.com', address: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP' },
  { name: 'TechStore Distribuidora LTDA', cnpj: '98.765.432/0001-10', phone: '(11) 3333-4444', email: 'contato@techstore.com', address: 'Rua Comercial, 500', city: 'São Paulo', state: 'SP' },
];

for (const cliente of clientes) {
  const cpfField = cliente.cpf ? `'${cliente.cpf}'` : 'NULL';
  const cnpjField = cliente.cnpj ? `'${cliente.cnpj}'` : 'NULL';
  
  await connection.execute(`
    INSERT INTO customers (
      tenantId, name, cpf, cnpj, phone, email, 
      address, city, state, createdAt, updatedAt
    ) VALUES (
      ${lojaId}, '${cliente.name}', ${cpfField}, ${cnpjField}, 
      '${cliente.phone}', '${cliente.email}',
      '${cliente.address}', '${cliente.city}', '${cliente.state}',
      NOW(), NOW()
    )
    ON DUPLICATE KEY UPDATE name=name
  `);
}

console.log(`✅ ${clientes.length} clientes cadastrados\n`);

// ============= 6. CRIAR VENDAS DE EXEMPLO =============
console.log('💰 6. Criando vendas de exemplo...');

// Buscar IDs necessários
const [vendedores] = await connection.execute('SELECT id FROM users WHERE tenantId = ? AND role = "vendedor" LIMIT 2', [lojaId]);
const [clientesDb] = await connection.execute('SELECT id FROM customers WHERE tenantId = ? LIMIT 3', [lojaId]);
const [produtosVenda] = await connection.execute('SELECT id, salePrice, wholesalePrice, requiresImei FROM products WHERE tenantId = ? LIMIT 5', [lojaId]);

// Venda 1: Varejo - iPhone 15 Pro Max
const venda1Total = produtosVenda[0].salePrice;
await connection.execute(`
  INSERT INTO sales (
    tenantId, sellerId, customerId, totalAmount, discountAmount, 
    finalAmount, paymentMethod, saleType, createdAt, updatedAt
  ) VALUES (
    ${lojaId}, ${vendedores[0].id}, ${clientesDb[0].id}, 
    ${venda1Total}, 0, ${venda1Total}, 'pix', 'retail', NOW(), NOW()
  )
`);

const [venda1Result] = await connection.execute('SELECT LAST_INSERT_ID() as id');
const venda1Id = venda1Result[0].id;

// Buscar IMEI disponível
const [imeiDisponivel] = await connection.execute(
  'SELECT id, imei FROM stockItems WHERE productId = ? AND status = "available" LIMIT 1',
  [produtosVenda[0].id]
);

await connection.execute(`
  INSERT INTO saleItems (
    saleId, productId, quantity, unitPrice, totalPrice, imei, createdAt, updatedAt
  ) VALUES (
    ${venda1Id}, ${produtosVenda[0].id}, 1, ${produtosVenda[0].salePrice}, 
    ${produtosVenda[0].salePrice}, '${imeiDisponivel[0].imei}', NOW(), NOW()
  )
`);

// Atualizar estoque
await connection.execute(
  'UPDATE stockItems SET status = "sold" WHERE id = ?',
  [imeiDisponivel[0].id]
);

// Venda 2: Atacado - 10 Capinhas
const venda2Qtd = 10;
const venda2UnitPrice = produtosVenda[3].wholesalePrice; // Preço atacado
const venda2Total = venda2UnitPrice * venda2Qtd;

await connection.execute(`
  INSERT INTO sales (
    tenantId, sellerId, customerId, totalAmount, discountAmount, 
    finalAmount, paymentMethod, saleType, appliedDiscount, createdAt, updatedAt
  ) VALUES (
    ${lojaId}, ${vendedores[1].id}, ${clientesDb[2].id}, 
    ${venda2Total}, 0, ${venda2Total}, 'cartao_credito', 'wholesale', 
    ${(produtosVenda[3].salePrice - venda2UnitPrice) * venda2Qtd}, NOW(), NOW()
  )
`);

const [venda2Result] = await connection.execute('SELECT LAST_INSERT_ID() as id');
const venda2Id = venda2Result[0].id;

await connection.execute(`
  INSERT INTO saleItems (
    saleId, productId, quantity, unitPrice, totalPrice, createdAt, updatedAt
  ) VALUES (
    ${venda2Id}, ${produtosVenda[3].id}, ${venda2Qtd}, ${venda2UnitPrice}, 
    ${venda2Total}, NOW(), NOW()
  )
`);

console.log('✅ 2 vendas de exemplo criadas\n');

// ============= 7. CRIAR ORDEM DE SERVIÇO =============
console.log('🔧 7. Criando ordem de serviço...');

const [tecnico] = await connection.execute('SELECT id FROM users WHERE tenantId = ? AND role = "tecnico" LIMIT 1', [lojaId]);

await connection.execute(`
  INSERT INTO serviceOrders (
    tenantId, customerId, technicianId, deviceBrand, deviceModel,
    defectReported, diagnosis, status, estimatedCost, estimatedDays,
    createdAt, updatedAt
  ) VALUES (
    ${lojaId}, ${clientesDb[1].id}, ${tecnico[0].id}, 
    'Apple', 'iPhone 14 Pro',
    'Tela quebrada após queda', 
    'Substituição de display necessária. Verificar também possível dano no touch.',
    'em_andamento', 89900, 3, NOW(), NOW()
  )
`);

const [osResult] = await connection.execute('SELECT LAST_INSERT_ID() as id');
const osId = osResult[0].id;

// Adicionar peça utilizada
await connection.execute(`
  INSERT INTO serviceOrderParts (
    serviceOrderId, productId, quantity, unitPrice, totalPrice, createdAt, updatedAt
  ) VALUES (
    ${osId}, ${produtosVenda[4].id}, 1, 45000, 45000, NOW(), NOW()
  )
`);

console.log('✅ 1 ordem de serviço criada\n');

// ============= 8. CRIAR TRANSAÇÕES FINANCEIRAS =============
console.log('💵 8. Criando transações financeiras...');

// Contas a Receber
await connection.execute(`
  INSERT INTO accountsReceivable (
    tenantId, description, amount, dueDate, status, category, createdAt, updatedAt
  ) VALUES 
    (${lojaId}, 'Venda #${venda1Id} - PIX', ${venda1Total}, NOW(), 'paid', 'Vendas', NOW(), NOW()),
    (${lojaId}, 'Venda #${venda2Id} - Cartão', ${venda2Total}, NOW(), 'paid', 'Vendas', NOW(), NOW())
`);

// Contas a Pagar
await connection.execute(`
  INSERT INTO accountsPayable (
    tenantId, description, amount, dueDate, status, category, createdAt, updatedAt
  ) VALUES 
    (${lojaId}, 'Aluguel da Loja - Janeiro', 500000, DATE_ADD(NOW(), INTERVAL 5 DAY), 'pending', 'Custo Fixo', NOW(), NOW()),
    (${lojaId}, 'Fornecedor - Compra de Estoque', 1500000, DATE_ADD(NOW(), INTERVAL 10 DAY), 'pending', 'Custo Variável', NOW(), NOW()),
    (${lojaId}, 'Energia Elétrica', 35000, DATE_ADD(NOW(), INTERVAL 3 DAY), 'pending', 'OPEX', NOW(), NOW())
`);

console.log('✅ Transações financeiras criadas\n');

// ============= FINALIZAÇÃO =============
await connection.end();

console.log('🎉 SEED COMPLETO FINALIZADO COM SUCESSO!\n');
console.log('📊 Resumo:');
console.log(`   ✅ Loja configurada: TechCell`);
console.log(`   ✅ ${produtos.length} produtos cadastrados`);
console.log(`   ✅ ${estoqueCount} itens em estoque`);
console.log(`   ✅ ${clientes.length} clientes cadastrados`);
console.log(`   ✅ 2 vendas realizadas`);
console.log(`   ✅ 1 ordem de serviço criada`);
console.log(`   ✅ Transações financeiras criadas`);
console.log('\n🚀 Sistema pronto para teste!\n');
console.log('📝 Credenciais de acesso:');
console.log('   Admin: admin@techcell.com / 123456');
console.log('   Vendedor 1: joao@techcell.com / 123456');
console.log('   Vendedor 2: maria@techcell.com / 123456');
console.log('   Técnico: pedro@techcell.com / 123456\n');
