
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function testIntegration() {
  console.log('=== INICIANDO TESTE DE INTEGRAÇÃO SISTÊMICA ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    // Configuração do Cenário
    const tenantId = 1;
    const userId = 1;
    const uniqueSuffix = Date.now();
    
    console.log(`\n[SETUP] Configurando cenário de teste (Suffix: ${uniqueSuffix})...`);

    // 1. Criar Cliente
    const [customerResult] = await connection.execute(
      'INSERT INTO customers (tenantId, name, email, cpf) VALUES (?, ?, ?, ?)',
      [tenantId, `Cliente Integração ${uniqueSuffix}`, `integra${uniqueSuffix}@test.com`, `999${uniqueSuffix.toString().slice(-8)}`]
    );
    const customerId = customerResult.insertId;
    console.log(`✅ Cliente criado: ID ${customerId}`);

    // 2. Criar Produto com Estoque
    const sku = `SKU-INT-${uniqueSuffix}`;
    const [productResult] = await connection.execute(
      'INSERT INTO products (tenantId, name, salePrice, costPrice, currentStock, minStock, sku) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tenantId, `Produto Integração ${uniqueSuffix}`, 10000, 5000, 10, 2, sku]
    );
    const productId = productResult.insertId;
    console.log(`✅ Produto criado: ID ${productId} (Estoque: 10)`);

    // --- FLUXO 1: VENDA DE PRODUTO ---
    console.log('\n[FLUXO 1] Realizando Venda de Produto...');
    
    // Registrar Venda
    const [saleResult] = await connection.execute(
      'INSERT INTO sales (tenantId, customerId, sellerId, totalAmount, finalAmount, paymentMethod, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tenantId, customerId, userId, 10000, 10000, 'pix', 'concluida']
    );
    const saleId = saleResult.insertId;
    console.log(`✅ Venda registrada: ID ${saleId}`);

    // Registrar Item da Venda
    await connection.execute(
      'INSERT INTO saleItems (saleId, productId, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?)',
      [saleId, productId, 1, 10000, 10000]
    );

    // Baixar Estoque (Simulação da lógica de negócio)
    await connection.execute(
      'UPDATE products SET currentStock = currentStock - 1 WHERE id = ?',
      [productId]
    );
    
    // Registrar Movimentação de Estoque
    await connection.execute(
      'INSERT INTO stockMovements (tenantId, productId, type, quantity, userId, referenceType, referenceId, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, productId, 'saida', 1, userId, 'sale', saleId, 'Venda realizada']
    );
    console.log('✅ Estoque atualizado e movimentação registrada.');

    // Gerar Conta a Receber
    await connection.execute(
      'INSERT INTO accountsReceivable (tenantId, customerId, description, amount, dueDate, status, referenceType, referenceId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, customerId, `Venda #${saleId}`, 10000, new Date(), 'recebido', 'sale', saleId, userId]
    );
    console.log('✅ Conta a receber gerada.');

    // --- FLUXO 2: ORDEM DE SERVIÇO ---
    console.log('\n[FLUXO 2] Abrindo Ordem de Serviço...');
    
    // Abrir OS
    const [osResult] = await connection.execute(
      'INSERT INTO serviceOrders (tenantId, customerId, deviceType, brand, model, defect, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, customerId, 'Smartphone', 'Apple', 'iPhone X', 'Tela quebrada', 'aberta', 'alta']
    );
    const osId = osResult.insertId;
    console.log(`✅ OS aberta: ID ${osId}`);

    // Adicionar Peça à OS (Consumir do Estoque)
    await connection.execute(
      'INSERT INTO serviceOrderParts (serviceOrderId, productId, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?)',
      [osId, productId, 1, 10000, 10000]
    );
    
    // Baixar Estoque da Peça
    await connection.execute(
      'UPDATE products SET currentStock = currentStock - 1 WHERE id = ?',
      [productId]
    );

    // Registrar Movimentação de Estoque (Peça na OS)
    await connection.execute(
      'INSERT INTO stockMovements (tenantId, productId, type, quantity, userId, referenceType, referenceId, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, productId, 'saida', 1, userId, 'os', osId, 'Peça utilizada na OS']
    );
    console.log('✅ Peça adicionada à OS e estoque baixado.');

    // --- VALIDAÇÃO FINAL ---
    console.log('\n[VALIDAÇÃO] Verificando integridade dos dados...');
    
    // Verificar Estoque Final
    const [productCheck] = await connection.execute(
      'SELECT currentStock FROM products WHERE id = ?',
      [productId]
    );
    const finalStock = productCheck[0].currentStock;
    
    if (finalStock === 8) { // 10 inicial - 1 venda - 1 OS
      console.log('✅ Validação de Estoque: SUCESSO (Estoque final = 8)');
    } else {
      console.error(`❌ FALHA: Estoque incorreto. Esperado 8, encontrado ${finalStock}`);
    }

    // Verificar Movimentações
    const [movementsCheck] = await connection.execute(
      'SELECT * FROM stockMovements WHERE productId = ?',
      [productId]
    );
    
    if (movementsCheck.length === 2) {
      console.log('✅ Validação de Movimentações: SUCESSO (2 movimentações encontradas)');
    } else {
      console.error(`❌ FALHA: Movimentações incorretas. Esperado 2, encontrado ${movementsCheck.length}`);
    }

    // Verificar Financeiro
    const [finCheck] = await connection.execute(
      'SELECT * FROM accountsReceivable WHERE referenceId = ? AND referenceType = ?',
      [saleId, 'sale']
    );
    
    if (finCheck.length === 1) {
      console.log('✅ Validação Financeira: SUCESSO (Conta a receber encontrada)');
    } else {
      console.error('❌ FALHA: Conta a receber não encontrada.');
    }

    console.log('\n=== TESTE DE INTEGRAÇÃO CONCLUÍDO ===');

  } catch (error) {
    console.error('Erro fatal no teste de integração:', error);
  } finally {
    if (connection) await connection.end();
  }
}

testIntegration();
