import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

// Ler DATABASE_URL do process.env
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

// Parse DATABASE_URL
const match = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/);
if (!match) {
  console.error('❌ Formato inválido de DATABASE_URL');
  process.exit(1);
}

const [, user, password, host, port, database, queryParams] = match;
const requireSSL = queryParams && queryParams.includes('ssl');

console.log(`🔑 Conectando: ${user}@${host}:${port}/${database} (SSL: ${requireSSL ? 'sim' : 'não'})\n`);

function parsePrice(priceStr) {
  if (!priceStr || priceStr === '-' || priceStr === '') return 0;
  
  // Remove R$, espaços e pontos de milhar
  priceStr = priceStr.replace(/R\$/g, '').replace(/\./g, '').replace(/ /g, '').trim();
  
  // Substitui vírgula por ponto
  priceStr = priceStr.replace(',', '.');
  
  try {
    return Math.round(parseFloat(priceStr) * 100);
  } catch {
    return 0;
  }
}

async function main() {
  console.log('🔄 Atualizando preços e estoque dos produtos...\n');
  
  // Ler CSV Produtos(2)
  const csvPath = '/home/ubuntu/upload/Produtos(2).csv';
  console.log(`📂 Lendo: ${csvPath}`);
  
  const csvContent = readFileSync(csvPath, 'latin1');
  const lines = csvContent.split('\n').slice(2); // Pular cabeçalho
  
  const productsData = new Map();
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(';');
    if (parts.length < 7) continue;
    
    const productName = parts[2]?.trim();
    if (!productName || productName === 'Produto') continue;
    
    const quantity = parseInt(parts[3]?.trim() || '0');
    const custo = parts[4];
    const valorVarejo = parts[5];
    const valorAtacado = parts[6];
    
    // Usar nome como chave (remover espaços extras para matching)
    const key = productName.replace(/\s+/g, ' ').trim();
    
    if (!productsData.has(key)) {
      productsData.set(key, {
        name: productName,
        quantity,
        costPrice: parsePrice(custo),
        salePrice: parsePrice(valorVarejo),
        wholesalePrice: parsePrice(valorAtacado),
      });
    }
  }
  
  console.log(`✅ ${productsData.size} produtos encontrados no CSV\n`);
  
  // Conectar ao banco
  console.log('💾 Conectando ao banco...\n');
  
  const connectionConfig = {
    host,
    port: parseInt(port),
    user,
    password,
    database
  };
  
  if (requireSSL) {
    connectionConfig.ssl = { rejectUnauthorized: true };
  }
  
  const connection = await mysql.createConnection(connectionConfig);
  
  console.log(`✅ Conectado!\n`);
  
  // Buscar todos os produtos do banco
  const [rows] = await connection.execute('SELECT id, name FROM products');
  
  console.log(`📦 ${rows.length} produtos no banco\n`);
  console.log('🔄 Atualizando...\n');
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const product of rows) {
    const key = product.name.replace(/\s+/g, ' ').trim();
    const data = productsData.get(key);
    
    if (data) {
      // Atualizar produto
      await connection.execute(
        `UPDATE products 
         SET costPrice = ?, 
             salePrice = ?, 
             wholesalePrice = ?, 
             currentStock = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [
          data.costPrice,
          data.salePrice,
          data.wholesalePrice,
          data.quantity,
          product.id
        ]
      );
      
      updatedCount++;
      console.log(`✓ ${product.name.slice(0, 60)} → Estoque: ${data.quantity}, Varejo: R$${(data.salePrice/100).toFixed(2)}, Atacado: R$${(data.wholesalePrice/100).toFixed(2)}`);
    } else {
      notFoundCount++;
    }
  }
  
  await connection.end();
  
  console.log(`\n✅ Atualização concluída!`);
  console.log(`   ✓ ${updatedCount} produtos atualizados`);
  console.log(`   ⊘ ${notFoundCount} produtos sem dados no CSV`);
}

main().catch(console.error);
