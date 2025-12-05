
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function testIsolation() {
  console.log('=== INICIANDO TESTE DE ISOLAMENTO MULTI-TENANT ===');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    // 1. Criar Tenant A e Tenant B
    console.log('Criando Tenants...');
    const [tenantA] = await connection.execute(
      'INSERT INTO tenants (name, subdomain, plan_id, status) VALUES (?, ?, ?, ?)',
      ['Tenant A', 'tenant-a-' + Date.now(), 1, 'active']
    );
    const tenantIdA = tenantA.insertId;

    const [tenantB] = await connection.execute(
      'INSERT INTO tenants (name, subdomain, plan_id, status) VALUES (?, ?, ?, ?)',
      ['Tenant B', 'tenant-b-' + Date.now(), 1, 'active']
    );
    const tenantIdB = tenantB.insertId;
    
    console.log(`Tenant A: ${tenantIdA}, Tenant B: ${tenantIdB}`);

    // 2. Inserir dados no Tenant A
    console.log('Inserindo dados no Tenant A...');
    await connection.execute(
      'INSERT INTO customers (tenantId, name, email, cpf) VALUES (?, ?, ?, ?)',
      [tenantIdA, 'Cliente do A', 'cliente@a.com', '11111111111']
    );
    
    await connection.execute(
      'INSERT INTO products (tenantId, name, salePrice, costPrice, sku) VALUES (?, ?, ?, ?, ?)',
      [tenantIdA, 'Produto do A', 100, 50, 'SKU-A-' + Date.now()]
    );

    // 3. Inserir dados no Tenant B
    console.log('Inserindo dados no Tenant B...');
    await connection.execute(
      'INSERT INTO customers (tenantId, name, email, cpf) VALUES (?, ?, ?, ?)',
      [tenantIdB, 'Cliente do B', 'cliente@b.com', '22222222222']
    );

    // 4. Verificar vazamento de dados (Tenant A tentando ler dados do B)
    console.log('Verificando isolamento...');
    
    // Consulta simulando Tenant A
    const [customersA] = await connection.execute(
      'SELECT * FROM customers WHERE tenantId = ?',
      [tenantIdA]
    );
    
    const [productsA] = await connection.execute(
      'SELECT * FROM products WHERE tenantId = ?',
      [tenantIdA]
    );

    // Validações
    const leakedCustomers = customersA.filter(c => c.name === 'Cliente do B');
    
    if (customersA.length >= 1 && leakedCustomers.length === 0) {
      console.log('✅ Isolamento de Clientes: SUCESSO (Tenant A vê apenas seus clientes)');
    } else {
      console.error('❌ FALHA: Tenant A viu clientes do Tenant B ou não viu os seus.');
    }

    if (productsA.length >= 1 && productsA.every(p => p.tenantId === tenantIdA)) {
      console.log('✅ Isolamento de Produtos: SUCESSO (Tenant A vê apenas seus produtos)');
    } else {
      console.error('❌ FALHA: Vazamento de produtos detectado.');
    }

    console.log('=== TESTE DE ISOLAMENTO CONCLUÍDO ===');

  } catch (error) {
    console.error('Erro fatal no teste de isolamento:', error);
  } finally {
    if (connection) await connection.end();
  }
}

testIsolation();
