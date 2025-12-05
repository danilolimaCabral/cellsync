import mysql from 'mysql2/promise';

const databaseUrl = 'mysql://root:kPmsrdOqERKFlhvaWXaWrSEApsAkczkC@switchback.proxy.rlwy.net:32656/railway';

function getDatabaseConfig() {
  const urlMatch = databaseUrl.match(
    /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
  );
  return {
    user: urlMatch[1],
    password: urlMatch[2],
    host: urlMatch[3],
    port: parseInt(urlMatch[4]),
    database: urlMatch[5]
  };
}

async function checkSchema() {
  let connection;
  try {
    const config = getDatabaseConfig();
    connection = await mysql.createConnection(config);
    
    console.log('📋 SCHEMA DAS TABELAS:\n');
    
    const tables = ['products', 'customers', 'sales', 'invoices', 'import_sessions'];
    
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = ? AND TABLE_SCHEMA = 'railway'
          ORDER BY ORDINAL_POSITION
        `, [table]);
        
        console.log(`\n📊 Tabela: ${table}`);
        console.log('─'.repeat(50));
        columns.forEach(col => {
          console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
        });
      } catch (error) {
        console.log(`\n❌ Tabela ${table} não existe`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSchema();
