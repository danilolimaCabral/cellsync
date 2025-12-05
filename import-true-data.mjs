#!/usr/bin/env node

/**
 * Script para importar dados da True Importados para o CellSync
 * 
 * Importa:
 * - Clientes (ClientesTrue.xlsx)
 * - Produtos (Produtos.csv)
 * - Estoque (RelatóriodoEstoque.csv)
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "switchback.proxy.rlwy.net",
  port: process.env.DB_PORT || 32656,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "kPmsrdOqERKFlhvaWXaWrSEApsAkczkC",
  database: process.env.DB_NAME || "railway",
};

let connection;

async function connectDB() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("✓ Conectado ao banco de dados");
    return connection;
  } catch (error) {
    console.error("✗ Erro ao conectar:", error.message);
    process.exit(1);
  }
}

async function getTenantId(tenantName) {
  try {
    const [rows] = await connection.execute(
      "SELECT id FROM tenants WHERE name LIKE ? LIMIT 1",
      [`%${tenantName}%`]
    );
    
    if (rows.length === 0) {
      throw new Error(`Tenant "${tenantName}" não encontrado`);
    }
    
    return rows[0].id;
  } catch (error) {
    console.error("✗ Erro ao obter tenant:", error.message);
    throw error;
  }
}

async function importClientes(tenantId) {
  console.log("\n📥 Importando Clientes...");
  
  try {
    const filePath = path.join("/home/ubuntu/upload", "ClientesTrue.xlsx");
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    let imported = 0;
    let skipped = 0;
    
    for (const row of data) {
      try {
        // Pular linhas vazias ou padrão
        if (!row.NOME_COMPLETO || row.NOME_COMPLETO === "CLIENTE PADRÃO") {
          skipped++;
          continue;
        }
        
        // Extrair CPF/CNPJ
        const cpf = row.CPF || null;
        const cnpj = row.CNPJ || null;
        
        // Preparar dados
        const name = row.NOME_COMPLETO || "";
        const fantasyName = row.NOME_FANTASIA || null;
        const phone = row.TELEFONE_1 || null;
        const email = row.EMAIL_1 || null;
        
        // Inserir cliente
        await connection.execute(
          `INSERT INTO customers 
           (tenantId, name, fantasyName, cpf, cnpj, phone, email) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [tenantId, name, fantasyName, cpf, cnpj, phone, email]
        );
        
        imported++;
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(`  ✗ Erro ao importar cliente: ${error.message}`);
        }
        skipped++;
      }
    }
    
    console.log(`  ✓ ${imported} clientes importados (${skipped} pulados)`);
    return imported;
  } catch (error) {
    console.error("✗ Erro ao importar clientes:", error.message);
    throw error;
  }
}

async function importProdutos(tenantId) {
  console.log("\n📥 Importando Produtos...");
  
  try {
    const filePath = path.join("/home/ubuntu/upload", "Produtos.csv");
    const fileContent = fs.readFileSync(filePath, "latin1");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    let imported = 0;
    let skipped = 0;
    
    for (const row of records) {
      try {
        // Pular linhas de cabeçalho
        if (row["Unnamed: 2"] === "Produto" || !row["Unnamed: 2"]) {
          skipped++;
          continue;
        }
        
        const name = row["Unnamed: 2"]?.trim() || "";
        const quantity = parseInt(row["Unnamed: 3"]) || 0;
        // Converter preços de string para número
        const costPrice = parseFloat(String(row.PREÇO || 0).replace(/[^0-9.-]/g, '')) || 0;
        const salePrice = parseFloat(String(row["Unnamed: 5"] || 0).replace(/[^0-9.-]/g, '')) || 0;
        const wholesalePrice = parseFloat(String(row["Unnamed: 6"] || 0).replace(/[^0-9.-]/g, '')) || 0;
        const supplier = row["PRODUTOS.1"]?.trim() || null;
        
        if (!name) {
          skipped++;
          continue;
        }
        
        // Inserir produto (preços em centavos)
        await connection.execute(
          `INSERT INTO products 
           (tenantId, name, costPrice, salePrice, wholesalePrice, currentStock, supplier) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [tenantId, name, Math.round(costPrice * 100), Math.round(salePrice * 100), Math.round(wholesalePrice * 100), quantity, supplier]
        );
        
        imported++;
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(`  ✗ Erro ao importar produto: ${error.message}`);
        }
        skipped++;
      }
    }
    
    console.log(`  ✓ ${imported} produtos importados (${skipped} pulados)`);
    return imported;
  } catch (error) {
    console.error("✗ Erro ao importar produtos:", error.message);
    throw error;
  }
}

async function importEstoque(tenantId) {
  console.log("\n📥 Importando Estoque...");
  
  try {
    const filePath = path.join("/home/ubuntu/upload", "RelatóriodoEstoque.csv");
    const fileContent = fs.readFileSync(filePath, "latin1");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    let imported = 0;
    let skipped = 0;
    
    for (const row of records) {
      try {
        // Pular linhas de cabeçalho
        if (row["Unnamed: 0"] === "Produto" || !row["Unnamed: 0"]) {
          skipped++;
          continue;
        }
        
        const productName = row["Unnamed: 0"]?.trim() || "";
        const quantity = parseInt(row["Informações Gerais.1"]) || 0;
        const costPrice = parseFloat(row.Valores) || 0;
        const salePrice = parseFloat(row["Unnamed: 3"]) || 0;
        const supplier = row["Unnamed: 10"]?.trim() || null;
        
        if (!productName) {
          skipped++;
          continue;
        }
        
        // Buscar produto existente
        const [products] = await connection.execute(
          "SELECT id FROM products WHERE tenantId = ? AND name = ? LIMIT 1",
          [tenantId, productName]
        );
        
        if (products.length > 0) {
          // Atualizar estoque do produto existente (preços em centavos)
          await connection.execute(
            "UPDATE products SET currentStock = ?, costPrice = ?, salePrice = ? WHERE id = ?",
            [quantity, Math.round(costPrice * 100), Math.round(salePrice * 100), products[0].id]
          );
          imported++;
        } else {
          // Criar novo produto (preços em centavos)
          await connection.execute(
            `INSERT INTO products 
             (tenantId, name, costPrice, salePrice, currentStock, supplier) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tenantId, productName, Math.round(costPrice * 100), Math.round(salePrice * 100), quantity, supplier]
          );
          imported++;
        }
      } catch (error) {
        console.error(`  ✗ Erro ao importar estoque: ${error.message}`);
        skipped++;
      }
    }
    
    console.log(`  ✓ ${imported} registros de estoque importados (${skipped} pulados)`);
    return imported;
  } catch (error) {
    console.error("✗ Erro ao importar estoque:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Iniciando importação de dados da True Importados...\n");
  
  try {
    // Conectar ao banco
    await connectDB();
    
    // Obter tenant ID
    const tenantId = await getTenantId("True");
    console.log(`✓ Tenant encontrado: ID ${tenantId}`);
    
    // Importar dados
    const clientesCount = await importClientes(tenantId);
    const produtosCount = await importProdutos(tenantId);
    const estoqueCount = await importEstoque(tenantId);
    
    // Resumo
    console.log("\n" + "=".repeat(60));
    console.log("✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("=".repeat(60));
    console.log(`📊 Resumo:`);
    console.log(`  • Clientes: ${clientesCount}`);
    console.log(`  • Produtos: ${produtosCount}`);
    console.log(`  • Registros de Estoque: ${estoqueCount}`);
    console.log(`  • Total: ${clientesCount + produtosCount + estoqueCount} registros`);
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Erro durante importação:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n✓ Conexão fechada");
    }
  }
}

main();
