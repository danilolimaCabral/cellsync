
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function auditModules() {
  console.log('=== INICIANDO AUDITORIA DE MÓDULOS ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    // Usar Tenant ID 1 criado anteriormente
    const tenantId = 1;
    const userId = 1;

    // --- MÓDULO DE CLIENTES ---
    console.log('\n[CLIENTES] Testando persistência...');
    const uniqueSuffix = Date.now();
    const [customerResult] = await connection.execute(
      'INSERT INTO customers (tenantId, name, email, phone, cpf) VALUES (?, ?, ?, ?, ?)',
      [tenantId, `Cliente Teste Audit ${uniqueSuffix}`, `cliente${uniqueSuffix}@audit.com`, '11999999999', `123${uniqueSuffix.toString().slice(-8)}`]
    );
    const customerId = customerResult.insertId;
    
    const [checkCustomer] = await connection.execute(
      'SELECT * FROM customers WHERE id = ? AND tenantId = ?',
      [customerId, tenantId]
    );
    
    if (checkCustomer.length > 0) {
      console.log('✅ Cliente criado e recuperado com sucesso.');
    } else {
      console.error('❌ FALHA: Cliente não encontrado ou tenantId incorreto.');
    }

    // --- MÓDULO DE ESTOQUE ---
    console.log('\n[ESTOQUE] Testando persistência...');
    // Criar Produto
    const sku = `SKU-${Date.now()}`;
    const [productResult] = await connection.execute(
      'INSERT INTO products (tenantId, name, description, salePrice, costPrice, currentStock, minStock, sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, 'iPhone 15 Pro', 'Smartphone Apple', 800000, 600000, 10, 2, sku]
    );
    const productId = productResult.insertId;

    // Criar Item de Estoque (IMEI)
    const imei = `35${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const [stockItemResult] = await connection.execute(
      'INSERT INTO stockItems (tenantId, productId, imei, status) VALUES (?, ?, ?, ?)',
      [tenantId, productId, imei, 'disponivel']
    );
    
    const [checkStock] = await connection.execute(
      'SELECT * FROM stockItems WHERE productId = ? AND tenantId = ?',
      [productId, tenantId]
    );

    if (checkStock.length > 0) {
      console.log('✅ Item de estoque (IMEI) criado e recuperado com sucesso.');
    } else {
      console.error('❌ FALHA: Item de estoque não encontrado.');
    }

    // --- MÓDULO DE VENDAS ---
    console.log('\n[VENDAS] Testando persistência...');
    // Criar Venda
    const [saleResult] = await connection.execute(
      'INSERT INTO sales (tenantId, customerId, sellerId, totalAmount, finalAmount, paymentMethod, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tenantId, customerId, userId, 800000, 800000, 'pix', 'concluida']
    );
    const saleId = saleResult.insertId;

    // Criar Item da Venda
    await connection.execute(
      'INSERT INTO saleItems (saleId, productId, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?)',
      [saleId, productId, 1, 800000, 800000]
    );

    const [checkSale] = await connection.execute(
      'SELECT * FROM sales WHERE id = ? AND tenantId = ?',
      [saleId, tenantId]
    );

    if (checkSale.length > 0) {
      console.log('✅ Venda criada e recuperada com sucesso.');
    } else {
      console.error('❌ FALHA: Venda não encontrada.');
    }

    // --- MÓDULO FINANCEIRO (Contas a Receber gerada pela venda) ---
    console.log('\n[FINANCEIRO] Testando persistência...');
    const [receivableResult] = await connection.execute(
      'INSERT INTO accountsReceivable (tenantId, customerId, description, amount, dueDate, status, referenceType, referenceId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, customerId, 'Venda #'+saleId, 800000, new Date(), 'recebido', 'sale', saleId, userId]
    );
    
    const [checkFin] = await connection.execute(
      'SELECT * FROM accountsReceivable WHERE referenceId = ? AND tenantId = ?',
      [saleId, tenantId]
    );

    if (checkFin.length > 0) {
      console.log('✅ Conta a receber vinculada à venda criada com sucesso.');
    } else {
      console.error('❌ FALHA: Conta a receber não encontrada.');
    }

    console.log('\n=== AUDITORIA CONCLUÍDA ===');

  } catch (error) {
    console.error('Erro fatal na auditoria:', error);
  } finally {
    if (connection) await connection.end();
  }
}

auditModules();
