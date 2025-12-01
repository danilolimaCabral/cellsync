import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

// Ler DATABASE_URL do process.env (carregado pelo dotenv)
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

console.log(`🔑 Conectando como: ${user}@${host}:${port}/${database} (SSL: ${requireSSL ? 'sim' : 'não'})`);

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

function extractBrandAndModel(productName) {
  const match = productName.match(/\(([^)]+)\)/);
  const brand = match ? match[1] : '';
  const model = productName.split('(')[0].trim();
  return { brand, model };
}

function categorizeProduct(productName) {
  const lower = productName.toLowerCase();
  
  if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('xiaomi') || 
      lower.includes('poco') || lower.includes('realme') || lower.includes('motorola')) {
    return 'Smartphone';
  } else if (lower.includes('cabo') || lower.includes('carregador') || lower.includes('fonte')) {
    return 'Acessório';
  } else if (lower.includes('fone') || lower.includes('headphone') || lower.includes('boombox') || lower.includes('jbl')) {
    return 'Áudio';
  } else if (lower.includes('capa') || lower.includes('película') || lower.includes('protetor')) {
    return 'Proteção';
  } else if (lower.includes('tablet') || lower.includes('ipad')) {
    return 'Tablet';
  } else if (lower.includes('watch') || lower.includes('smartwatch')) {
    return 'Smartwatch';
  }
  return 'Outros';
}

async function main() {
  console.log('🚀 Iniciando importação de produtos...');
  
  // Ler CSV
  const csvPath = '/home/ubuntu/upload/RelatóriodoEstoque(1).csv';
  console.log(`📂 Lendo arquivo: ${csvPath}`);
  
  const csvContent = readFileSync(csvPath, 'latin1');
  const lines = csvContent.split('\n').slice(2); // Pular 2 primeiras linhas
  
  const products = new Map();
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(';');
    if (parts.length < 5) continue;
    
    const productName = parts[0]?.trim();
    if (!productName) continue;
    
    const custo = parts[2];
    const valorVarejo = parts[3];
    
    if (!products.has(productName)) {
      products.set(productName, { custo, valorVarejo });
    }
  }
  
  console.log(`✅ ${products.size} produtos únicos identificados`);
  
  // Conectar ao banco
  console.log('\n💾 Conectando ao banco de dados...');
  
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
  
  console.log(`✅ Conectado ao banco: ${database}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [productName, data] of products) {
    const { brand, model } = extractBrandAndModel(productName);
    const category = categorizeProduct(productName);
    const costPrice = parsePrice(data.custo);
    const salePrice = parsePrice(data.valorVarejo);
    const sku = productName.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 20);
    const requiresImei = /iphone|samsung|xiaomi/i.test(productName);
    
    try {
      await connection.execute(
        `INSERT INTO products 
        (name, brand, model, category, sku, costPrice, salePrice, minStock, requiresImei, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          productName.slice(0, 255),
          brand.slice(0, 100) || null,
          model.slice(0, 100) || null,
          category,
          sku,
          costPrice,
          salePrice,
          5,
          requiresImei
        ]
      );
      successCount++;
    } catch (error) {
      errorCount++;
      if (!error.message.includes('Duplicate entry')) {
        console.error(`⚠️  Erro ao inserir '${productName.slice(0, 50)}...': ${error.message}`);
      }
    }
  }
  
  await connection.end();
  
  console.log(`\n✅ Importação concluída!`);
  console.log(`   ✓ ${successCount} produtos importados`);
  console.log(`   ✗ ${errorCount} erros/duplicados`);
}

main().catch(console.error);
