#!/usr/bin/env node

/**
 * Script otimizado para importar dados da True Importados para o CellSync
 * Usa batch insert para melhor performance
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

async function batchInsert(table, columns, values, batchSize = 500) {
  let inserted = 0;
  let skipped = 0;
  
  if (values.length === 0) {
    console.log(`  ✓ Nenhum registro para importar`);
    return 0;
  }
  
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    
    try {
      // Validar que cada linha tem o número correto de colunas
      for (const row of batch) {
        if (row.length !== columns.length) {
          throw new Error(`Mismatch: ${row.length} valores vs ${columns.length} colunas`);
        }
      }
      
      const placeholders = batch.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
      const flatValues = batch.flat();
      
      const query = `INSERT INTO ${table} (${columns.join(",")}) VALUES ${placeholders}`;
      await connection.execute(query, flatValues);
      
      inserted += batch.length;
      process.stdout.write(`\r  Inseridos: ${inserted}/${values.length}`);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        skipped += batch.length;
      } else {
        console.error(`\n  ✗ Erro no batch: ${error.message}`);
        skipped += batch.length;
      }
    }
  }
  
  console.log(`\n  ✓ ${inserted} registros importados (${skipped} duplicados/erros)`);
  return inserted;
}

async function importClientes(tenantId) {
  console.log("\n📥 Importando Clientes...");
  
  try {
    const filePath = path.join("/home/ubuntu/upload", "ClientesTrue.xlsx");
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const values = [];
    
    for (const row of data) {
      // Pular linhas vazias ou padrão
      if (!row.NOME_COMPLETO || row.NOME_COMPLETO === "CLIENTE PADRÃO") {
        continue;
      }
      
      const name = row.NOME_COMPLETO || "";
      const fantasyName = row.NOME_FANTASIA || null;
      const cpf = row.CPF || null;
      const cnpj = row.CNPJ || null;
      const phone = row.TELEFONE_1 || null;
      const phone2 = row.TELEFONE_2 || null;
      const email = row.EMAIL_1 || null;
      const email2 = row.EMAIL_2 || null;
      const stateRegistration = row.INSCRICAO_ESTADUAL || null;
      
      values.push([tenantId, name, fantasyName, email, email2, phone, phone2, cpf, cnpj, null, stateRegistration, null, null, null, null, null, 0, null, null]);
    }
    
    const columns = [
      "tenantId", "name", "fantasyName", "email", "email2", "phone", "phone2", 
      "cpf", "cnpj", "rg", "stateRegistration", "address", "city", "state", 
      "zipCode", "birthDate", "loyaltyPoints", "segment", "notes"
    ];
    
    return await batchInsert("customers", columns, values);
  } catch (error) {
    console.error("✗ Erro ao importar clientes:", error.message);
    throw error;
  }
}

async function importProdutos(tenantId) {
  console.log("\n📥 Importando Produtos...");
  
  try {
    const filePath = path.join("/home/ubuntu/upload", "Produtos(2).csv");
    const fileContent = fs.readFileSync(filePath, "latin1");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ";",
    });
    
    const values = [];
    
    let headerSkipped = false;
    for (const row of records) {
      // Pular primeira linha (cabeçalho)
      if (!headerSkipped) {
        headerSkipped = true;
        continue;
      }
      
      const name = row["Produto"]?.trim() || "";
      if (!name) continue;
      
      const quantity = parseInt(row["QTD. Estoque "]) || 0;
      const costStr = String(row["Custo Produto"] || "0").replace(/[R$\s.]/g, '').replace(',', '.');
      const saleStr = String(row["V. Varejo"] || "0").replace(/[R$\s.]/g, '').replace(',', '.');
      const wholesaleStr = String(row["V. Atacado"] || "0").replace(/[R$\s.]/g, '').replace(',', '.');
      const costPrice = Math.round(parseFloat(costStr) * 100) || 0;
      const salePrice = Math.round(parseFloat(saleStr) * 100) || 0;
      const wholesalePrice = Math.round(parseFloat(wholesaleStr) * 100) || 0;
      const supplier = row["Fornecedor"]?.trim() || null;
      
      values.push([
        tenantId, name, null, null, null, null, null, null, null,
        costPrice, salePrice, wholesalePrice, 5, 10, quantity, false, true, supplier, null, null
      ]);
    }
    
    const columns = [
      "tenantId", "name", "description", "category", "brand", "model", "grade", 
      "sku", "barcode", "costPrice", "salePrice", "wholesalePrice", "minWholesaleQty", 
      "minStock", "currentStock", "requiresImei", "active", "supplier", "warehouse", "entryDate"
    ];
    
    return await batchInsert("products", columns, values);
  } catch (error) {
    console.error("✗ Erro ao importar produtos:", error.message);
    throw error;
  }
}

async function importEstoque(tenantId) {
  console.log("\n📥 Importando Estoque (atualização)...");
  
  try {
    const filePath = path.join("/home/ubuntu/upload", "RelatóriodoEstoque.csv");
    const fileContent = fs.readFileSync(filePath, "latin1");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    let updated = 0;
    let created = 0;
    let headerSkipped = false;
    
    for (const row of records) {
      // Pular primeira linha (cabeçalho)
      if (!headerSkipped) {
        headerSkipped = true;
        continue;
      }
      
      const productName = row["Unnamed: 0"]?.trim() || "";
      if (!productName) continue;
      
      const quantity = parseInt(row["Informações Gerais.1"]) || 0;
      const costPrice = Math.round(parseFloat(String(row.Valores || 0).replace(/[^0-9.-]/g, '')) * 100) || 0;
      const salePrice = Math.round(parseFloat(String(row["Unnamed: 3"] || 0).replace(/[^0-9.-]/g, '')) * 100) || 0;
      const supplier = row["Unnamed: 10"]?.trim() || null;
      
      try {
        // Buscar produto existente
        const [products] = await connection.execute(
          "SELECT id FROM products WHERE tenantId = ? AND name = ? LIMIT 1",
          [tenantId, productName]
        );
        
        if (products.length > 0) {
          // Atualizar estoque
          await connection.execute(
            "UPDATE products SET currentStock = ?, costPrice = ?, salePrice = ? WHERE id = ?",
            [quantity, costPrice, salePrice, products[0].id]
          );
          updated++;
        } else {
          // Criar novo produto
          await connection.execute(
            `INSERT INTO products 
             (tenantId, name, costPrice, salePrice, currentStock, supplier, active) 
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [tenantId, productName, costPrice, salePrice, quantity, supplier]
          );
          created++;
        }
        
        process.stdout.write(`\r  Processados: ${updated + created}/${records.length}`);
      } catch (error) {
        console.error(`\n  ✗ Erro: ${error.message}`);
      }
    }
    
    console.log(`\n  ✓ ${updated} produtos atualizados, ${created} novos criados`);
    return updated + created;
  } catch (error) {
    console.error("✗ Erro ao importar estoque:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Iniciando importação otimizada de dados da True Importados...\n");
  
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
