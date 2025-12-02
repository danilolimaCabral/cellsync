/**
 * Script para adicionar campo tenantId em todas as tabelas principais
 * Mantém dados atuais como tenant_id = 1 (Tenant Master)
 */

import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'drizzle', 'schema.ts');
let schema = fs.readFileSync(schemaPath, 'utf-8');

// Tabelas que NÃO precisam de tenantId (tabelas de sistema)
const skipTables = ['tenants', 'plans'];

// Tabelas que precisam de tenantId
const tablesToUpdate = [
  'users',
  'customers',
  'products',
  'stockItems',
  'stockMovements',
  'sales',
  'saleItems',
  'serviceOrders',
  'serviceOrderParts',
  'accountsPayable',
  'accountsReceivable',
  'cashTransactions',
  'marketingCampaigns',
  'notifications',
  'systemSettings',
  'auditLogs',
  'commissionRules',
  'commissions',
  'invoices',
  'invoiceItems'
];

console.log('🔧 Adicionando tenantId nas tabelas...\n');

tablesToUpdate.forEach(tableName => {
  // Procura pela definição da tabela
  const tableRegex = new RegExp(`export const ${tableName} = mysqlTable\\("${tableName}", \\{([\\s\\S]*?)\\}\\);`, 'g');
  
  schema = schema.replace(tableRegex, (match, fields) => {
    // Verifica se já tem tenantId
    if (fields.includes('tenantId')) {
      console.log(`⏭️  ${tableName}: já tem tenantId`);
      return match;
    }
    
    // Adiciona tenantId logo após o id (primeira linha)
    const lines = fields.split('\n');
    const idLineIndex = lines.findIndex(line => line.includes('id: int("id")'));
    
    if (idLineIndex !== -1) {
      // Insere tenantId após a linha do id
      lines.splice(idLineIndex + 1, 0, `  tenantId: int("tenant_id").notNull().default(1), // Multi-tenant: ID do tenant (1 = Master)`);
      
      const newFields = lines.join('\n');
      console.log(`✅ ${tableName}: tenantId adicionado`);
      
      return `export const ${tableName} = mysqlTable("${tableName}", {${newFields}});`;
    }
    
    console.log(`⚠️  ${tableName}: não encontrou linha do id`);
    return match;
  });
});

// Salva o arquivo atualizado
fs.writeFileSync(schemaPath, schema, 'utf-8');

console.log('\n✅ Schema atualizado com sucesso!');
console.log('📝 Próximo passo: executar pnpm db:push para aplicar as mudanças no banco');
