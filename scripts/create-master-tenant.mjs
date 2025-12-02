/**
 * Script para criar Tenant Master (ID = 1)
 * Este tenant representa o uso interno do sistema
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

console.log('🔧 Criando Tenant Master...\n');

try {
  // Verifica se já existe
  const [existing] = await connection.execute(
    'SELECT id FROM tenants WHERE id = 1'
  );

  if (existing.length > 0) {
    console.log('✅ Tenant Master já existe (ID = 1)');
  } else {
    // Busca o plano Empresarial (maior plano)
    const [plans] = await connection.execute(
      'SELECT id FROM plans WHERE slug = ? LIMIT 1',
      ['empresarial']
    );

    const planId = plans.length > 0 ? plans[0].id : 1;

    // Insere Tenant Master
    await connection.execute(`
      INSERT INTO tenants (id, name, subdomain, plan_id, status, createdAt, updatedAt)
      VALUES (1, 'CellSync Master', 'master', ?, 'active', NOW(), NOW())
    `, [planId]);

    console.log('✅ Tenant Master criado com sucesso!');
    console.log('   ID: 1');
    console.log('   Nome: CellSync Master');
    console.log('   Subdomínio: master');
    console.log('   Status: active');
  }

  // Promove usuário Bruno para master_admin
  const [bruno] = await connection.execute(
    'SELECT id, role FROM users WHERE email = ?',
    ['bruno@cellsync.com']
  );

  if (bruno.length > 0) {
    if (bruno[0].role === 'master_admin') {
      console.log('\n✅ Usuário Bruno já é master_admin');
    } else {
      await connection.execute(
        'UPDATE users SET role = ?, tenant_id = 1 WHERE email = ?',
        ['master_admin', 'bruno@cellsync.com']
      );
      console.log('\n✅ Usuário Bruno promovido para master_admin');
    }
  } else {
    console.log('\n⚠️  Usuário Bruno não encontrado');
  }

  console.log('\n🎉 Configuração concluída!');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  await connection.end();
}
