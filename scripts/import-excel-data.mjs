import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🚀 Iniciando importação de dados...\n');

// ============= IMPORTAR CLIENTES =============
console.log('📋 Importando clientes...');
const clientesWorkbook = XLSX.readFile('/home/ubuntu/upload/ClientesTrue.xlsx');
const clientesSheet = clientesWorkbook.Sheets[clientesWorkbook.SheetNames[0]];
const clientesData = XLSX.utils.sheet_to_json(clientesSheet, { header: 1 });

let clientesImportados = 0;
let clientesErros = 0;

for (let i = 2; i < clientesData.length; i++) {
  const row = clientesData[i];
  if (!row || !row[0] || row[0] === 'CLIENTE PADRÃO') continue;

  try {
    const cliente = {
      name: row[0] || '',
      fantasyName: row[1] || null,
      cpf: row[2] || null,
      cnpj: row[3] || null,
      rg: row[4] || null,
      birthDate: row[5] ? new Date(row[5]) : null,
      phone: row[6] || null,
      phone2: row[7] || null,
      email: row[8] || null,
      email2: row[9] || null,
      stateRegistration: row[10] || null,
    };

    await db.insert(schema.customers).values(cliente);
    clientesImportados++;
    
    if (clientesImportados % 100 === 0) {
      console.log(`  ✓ ${clientesImportados} clientes importados...`);
    }
  } catch (error) {
    clientesErros++;
    if (clientesErros <= 5) {
      console.log(`  ✗ Erro ao importar cliente linha ${i}: ${error.message}`);
    }
  }
}

console.log(`✅ Clientes: ${clientesImportados} importados, ${clientesErros} erros\n`);

// ============= IMPORTAR PRODUTOS =============
console.log('📦 Importando produtos...');
const produtosWorkbook = XLSX.readFile('/home/ubuntu/upload/Produtos.xlsx');
const produtosSheet = produtosWorkbook.Sheets[produtosWorkbook.SheetNames[0]];
const produtosData = XLSX.utils.sheet_to_json(produtosSheet, { header: 1 });

let produtosImportados = 0;
let produtosErros = 0;
const produtosMap = new Map(); // Para mapear nome -> productId

for (let i = 2; i < produtosData.length; i++) {
  const row = produtosData[i];
  if (!row || !row[2]) continue; // Pula se não tem nome do produto

  try {
    const nomeProduto = row[2];
    const grade = row[7] || null;
    const custo = Math.round((parseFloat(row[4]) || 0) * 100);
    const varejo = Math.round((parseFloat(row[5]) || 0) * 100);
    const atacado = Math.round((parseFloat(row[6]) || 0) * 100);

    // Verifica se produto já existe
    if (!produtosMap.has(nomeProduto + grade)) {
      const produto = {
        name: nomeProduto,
        grade: grade,
        costPrice: custo,
        salePrice: varejo,
        wholesalePrice: atacado || null,
        currentStock: parseInt(row[3]) || 0,
        supplier: row[9] || null,
        warehouse: row[8] || null,
        entryDate: row[0] ? new Date(row[0]) : null,
        category: 'Celular',
        requiresImei: true,
        sku: `PROD-${Date.now()}-${i}`,
      };

      const result = await db.insert(schema.products).values(produto);
      const productId = result[0].insertId;
      produtosMap.set(nomeProduto + grade, productId);
      produtosImportados++;

      // Criar item de estoque com IMEI
      const imei = row[1] || null;
      if (imei) {
        const stockItem = {
          productId: productId,
          imei: imei,
          batteryHealth: parseInt(row[10]) || null,
          hasDefect: row[11] === 'Sim' || row[11] === 'SIM',
          readyForSale: row[12] === 'Sim' || row[12] === 'SIM',
          status: (row[12] === 'Sim' || row[12] === 'SIM') ? 'disponivel' : 'defeito',
        };

        await db.insert(schema.stockItems).values(stockItem);
      }

      if (produtosImportados % 50 === 0) {
        console.log(`  ✓ ${produtosImportados} produtos importados...`);
      }
    }
  } catch (error) {
    produtosErros++;
    if (produtosErros <= 5) {
      console.log(`  ✗ Erro ao importar produto linha ${i}: ${error.message}`);
    }
  }
}

console.log(`✅ Produtos: ${produtosImportados} importados, ${produtosErros} erros\n`);

// ============= IMPORTAR ESTOQUE =============
console.log('📊 Importando itens de estoque...');
const estoqueWorkbook = XLSX.readFile('/home/ubuntu/upload/RelatóriodoEstoque.xlsx');
const estoqueSheet = estoqueWorkbook.Sheets[estoqueWorkbook.SheetNames[0]];
const estoqueData = XLSX.utils.sheet_to_json(estoqueSheet, { header: 1 });

let estoqueImportados = 0;
let estoqueErros = 0;

for (let i = 2; i < estoqueData.length; i++) {
  const row = estoqueData[i];
  if (!row || !row[0]) continue;

  try {
    const nomeProduto = row[0];
    const grade = row[1] || null;
    const custo = Math.round((parseFloat(row[2]) || 0) * 100);
    const varejo = Math.round((parseFloat(row[3]) || 0) * 100);
    const atacado = Math.round((parseFloat(row[4]) || 0) * 100);
    const imei = row[5] || null;

    // Busca ou cria produto
    let productId = produtosMap.get(nomeProduto + grade);
    
    if (!productId) {
      const produto = {
        name: nomeProduto,
        grade: grade,
        costPrice: custo,
        salePrice: varejo,
        wholesalePrice: atacado || null,
        currentStock: parseInt(row[9]) || 0,
        supplier: row[10] || null,
        entryDate: row[11] ? new Date(row[11]) : null,
        category: 'Celular',
        requiresImei: true,
        sku: `EST-${Date.now()}-${i}`,
      };

      const result = await db.insert(schema.products).values(produto);
      productId = result[0].insertId;
      produtosMap.set(nomeProduto + grade, productId);
    }

    // Criar item de estoque
    if (imei) {
      const stockItem = {
        productId: productId,
        imei: imei,
        serialNumber: row[6] || null,
        stockType: row[7] || null,
        readyForSale: row[8] === 'Sim' || row[8] === 'SIM',
        status: (row[8] === 'Sim' || row[8] === 'SIM') ? 'disponivel' : 'defeito',
      };

      await db.insert(schema.stockItems).values(stockItem);
      estoqueImportados++;

      if (estoqueImportados % 20 === 0) {
        console.log(`  ✓ ${estoqueImportados} itens de estoque importados...`);
      }
    }
  } catch (error) {
    estoqueErros++;
    if (estoqueErros <= 5) {
      console.log(`  ✗ Erro ao importar estoque linha ${i}: ${error.message}`);
    }
  }
}

console.log(`✅ Estoque: ${estoqueImportados} itens importados, ${estoqueErros} erros\n`);

// ============= RESUMO FINAL =============
console.log('🎉 Importação concluída!');
console.log(`\n📊 Resumo:`);
console.log(`  • Clientes: ${clientesImportados} importados`);
console.log(`  • Produtos: ${produtosImportados} importados`);
console.log(`  • Estoque: ${estoqueImportados} itens importados`);
console.log(`  • Total de erros: ${clientesErros + produtosErros + estoqueErros}`);

await connection.end();
process.exit(0);
