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
  // Remover partes entre parênteses e extras
  const cleanName = productName.split('(')[0].trim();
  
  // Tentar identificar marca
  const brands = ['APPLE', 'SAMSUNG', 'XIAOMI', 'MOTOROLA', 'LG', 'NOKIA', 'SONY', 'ASUS', 'LENOVO', 'DELL', 'HP', 'ACER', 'JBL', 'ANKER'];
  let brand = null;
  
  for (const b of brands) {
    if (cleanName.toUpperCase().includes(b)) {
      brand = b.charAt(0) + b.slice(1).toLowerCase();
      break;
    }
  }
  
  return { brand, model: cleanName };
}

function categorizeProduct(productName) {
  const lower = productName.toLowerCase();
  
  if (lower.includes('cabo') || lower.includes('carregador') || lower.includes('fonte') || lower.includes('adaptador')) {
    return 'Acessório';
  } else if (lower.includes('capinha') || lower.includes('capa') || lower.includes('película') || lower.includes('protetor')) {
    return 'Proteção';
  } else if (lower.includes('fone') || lower.includes('headphone') || lower.includes('earphone') || lower.includes('airpods')) {
    return 'Áudio';
  } else if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('xiaomi') || 
             lower.includes('motorola') || lower.includes('galaxy') || lower.includes('redmi')) {
    return 'Smartphone';
  } else if (lower.includes('tablet') || lower.includes('ipad')) {
    return 'Tablet';
  } else if (lower.includes('watch') || lower.includes('smartwatch')) {
    return 'Smartwatch';
  } else if (lower.includes('notebook') || lower.includes('laptop')) {
    return 'Notebook';
  }
  return 'Outros';
}

async function main() {
  console.log('🚀 Iniciando importação de Produtos(2).csv...\n');
  
  // Ler CSV
  const csvPath = '/home/ubuntu/upload/Produtos(2).csv';
  console.log(`📂 Lendo arquivo: ${csvPath}`);
  
  const csvContent = readFileSync(csvPath, 'latin1');
  const lines = csvContent.split('\n').slice(2); // Pular 2 primeiras linhas (cabeçalho)
  
  const products = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(';');
    if (parts.length < 7) continue;
    
    const productName = parts[2]?.trim();
    if (!productName || productName === 'Produto') continue;
    
    const quantity = parseInt(parts[3]?.trim() || '0');
    const custo = parts[4];
    const valorVarejo = parts[5];
    
    // Verificar se já existe (evitar duplicados)
    if (!products.some(p => p.name === productName)) {
      products.push({ 
        name: productName, 
        quantity,
        custo, 
        valorVarejo 
      });
    }
  }
  
  console.log(`✅ ${products.length} produtos únicos identificados\n`);
  
  // Conectar ao banco
  console.log('💾 Conectando ao banco de dados...\n');
  
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
  
  console.log(`✅ Conectado ao banco: ${database}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  
  for (const product of products) {
    const { brand, model } = extractBrandAndModel(product.name);
    const category = categorizeProduct(product.name);
    const costPrice = parsePrice(product.custo);
    const salePrice = parsePrice(product.valorVarejo);
    const sku = product.name.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 20);
    const requiresImei = /iphone|samsung|xiaomi|motorola|galaxy/i.test(product.name);
    
    try {
      await connection.execute(
        `INSERT INTO products 
        (name, brand, model, category, sku, costPrice, salePrice, minStock, requiresImei, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          product.name.slice(0, 255),
          brand?.slice(0, 100) || null,
          model?.slice(0, 100) || null,
          category,
          sku,
          costPrice,
          salePrice,
          5,
          requiresImei
        ]
      );
      successCount++;
      console.log(`✓ ${product.name.slice(0, 60)}`);
    } catch (error) {
      if (error.message.includes('Duplicate entry')) {
        duplicateCount++;
      } else {
        errorCount++;
        console.error(`✗ Erro ao inserir '${product.name.slice(0, 50)}...': ${error.message}`);
      }
    }
  }
  
  await connection.end();
  
  console.log(`\n✅ Importação concluída!`);
  console.log(`   ✓ ${successCount} produtos importados`);
  console.log(`   ⊘ ${duplicateCount} duplicados ignorados`);
  console.log(`   ✗ ${errorCount} erros`);
}

main().catch(console.error);
