
import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:polcSCGTZnLzMpTHFXQpgscTsMaGhwzN@nozomi.proxy.rlwy.net:56188/railway';

async function testPersistence() {
  console.log('Iniciando teste de persistência...');
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    
    // 1. Criar um Tenant de teste
    console.log('1. Criando Tenant de teste...');
    const [tenantResult] = await connection.execute(
      'INSERT INTO tenants (name, subdomain, plan_id, status) VALUES (?, ?, ?, ?)',
      ['Test Tenant', 'test-' + Date.now(), 1, 'active']
    );
    const tenantId = tenantResult.insertId;
    console.log(`Tenant criado com ID: ${tenantId}`);

    // 2. Criar um Usuário vinculado ao Tenant
    console.log('2. Criando Usuário de teste...');
    const [userResult] = await connection.execute(
      'INSERT INTO users (tenant_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [tenantId, `test-${Date.now()}@example.com`, 'hash123', 'Test User', 'admin']
    );
    const userId = userResult.insertId;
    console.log(`Usuário criado com ID: ${userId}`);

    // 3. Simular conversa do Chatbot
    console.log('3. Simulando conversa do Chatbot...');
    const sessionId = `session-${Date.now()}`;
    
    // Criar conversa
    const [convResult] = await connection.execute(
      'INSERT INTO chatbot_conversations (tenantId, session_id, user_id, message_count) VALUES (?, ?, ?, ?)',
      [tenantId, sessionId, userId, 2]
    );
    const conversationId = convResult.insertId;
    console.log(`Conversa criada com ID: ${conversationId}`);

    // Inserir mensagens
    await connection.execute(
      'INSERT INTO chatbot_messages (tenantId, conversation_id, role, content) VALUES (?, ?, ?, ?)',
      [tenantId, conversationId, 'user', 'Olá, como cadastro um produto?']
    );
    
    await connection.execute(
      'INSERT INTO chatbot_messages (tenantId, conversation_id, role, content) VALUES (?, ?, ?, ?)',
      [tenantId, conversationId, 'assistant', 'Para cadastrar um produto, vá em Estoque > Novo Produto.']
    );
    console.log('Mensagens inseridas com sucesso.');

    // 4. Verificar se os dados foram salvos corretamente
    console.log('4. Verificando dados salvos...');
    
    const [messages] = await connection.execute(
      'SELECT * FROM chatbot_messages WHERE conversation_id = ?',
      [conversationId]
    );

    if (messages.length === 2) {
      console.log('SUCESSO: 2 mensagens encontradas no banco.');
      console.log('Mensagem 1:', messages[0].content);
      console.log('Mensagem 2:', messages[1].content);
      console.log('TenantId verificado:', messages[0].tenantId === tenantId ? 'OK' : 'FALHA');
    } else {
      console.error(`FALHA: Esperado 2 mensagens, encontrado ${messages.length}`);
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    if (connection) await connection.end();
  }
}

testPersistence();
