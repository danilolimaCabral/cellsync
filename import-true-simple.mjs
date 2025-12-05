#!/usr/bin/env node

/**
 * Script simples para importar dados da True Importados
 * Lê o CSV manualmente para evitar problemas de parsing
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ";" && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

async function importProdutos(tenantId) {
  console.log("\n📥 Importando Produtos...");

  try {
    const filePath = "/home/ubuntu/upload/Produtos(2).csv";
    const fileContent = fs.readFileSync(filePath, "latin1");
    const lines = fileContent.split("\n");

    // Pular primeira linha (cabeçalho)
    let headerLine = parseCSVLine(lines[0]);
    let dataLine = parseCSVLine(lines[1]);

    console.log("Cabeçalho:", headerLine);
    console.log("Primeira linha de dados:", dataLine);

    // Encontrar índices das colunas
    const dataHeaderLine = parseCSVLine(lines[1]);
    const produtoIdx = dataHeaderLine.findIndex((col) =>
      col.includes("Produto")
    );
    const qtdIdx = dataHeaderLine.findIndex((col) =>
      col.includes("QTD")
    );
    const custoIdx = dataHeaderLine.findIndex((col) =>
      col.includes("Custo")
    );
    const varejoIdx = dataHeaderLine.findIndex((col) =>
      col.includes("Varejo")
    );
    const atacadoIdx = dataHeaderLine.findIndex((col) =>
      col.includes("Atacado")
    );
    const fornecedorIdx = dataHeaderLine.findIndex((col) =>
      col.includes("Fornecedor")
    );

    console.log(`Índices encontrados: Produto=${produtoIdx}, QTD=${qtdIdx}, Custo=${custoIdx}, Varejo=${varejoIdx}, Atacado=${atacadoIdx}, Fornecedor=${fornecedorIdx}`);

    let imported = 0;
    let skipped = 0;

    // Processar linhas de dados (começar da linha 2)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const cols = parseCSVLine(line);

        const name = cols[produtoIdx]?.trim() || "";
        if (!name) {
          skipped++;
          continue;
        }

        const quantity = parseInt(cols[qtdIdx]) || 0;
        const costStr = String(cols[custoIdx] || "0")
          .replace(/[R$\s.]/g, "")
          .replace(",", ".");
        const saleStr = String(cols[varejoIdx] || "0")
          .replace(/[R$\s.]/g, "")
          .replace(",", ".");
        const wholesaleStr = String(cols[atacadoIdx] || "0")
          .replace(/[R$\s.]/g, "")
          .replace(",", ".");
        const supplier = cols[fornecedorIdx]?.trim() || null;

        const costPrice = Math.round(parseFloat(costStr) * 100) || 0;
        const salePrice = Math.round(parseFloat(saleStr) * 100) || 0;
        const wholesalePrice = Math.round(parseFloat(wholesaleStr) * 100) || 0;

        await connection.execute(
          `INSERT INTO products 
           (tenantId, name, costPrice, salePrice, wholesalePrice, currentStock, supplier, active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            tenantId,
            name,
            costPrice,
            salePrice,
            wholesalePrice,
            quantity,
            supplier,
          ]
        );

        imported++;
        if (imported % 50 === 0) {
          process.stdout.write(`\r  Importados: ${imported}`);
        }
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(`\n  ✗ Erro na linha ${i}: ${error.message}`);
        }
        skipped++;
      }
    }

    console.log(`\n  ✓ ${imported} produtos importados (${skipped} pulados)`);
    return imported;
  } catch (error) {
    console.error("✗ Erro ao importar produtos:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Iniciando importação de dados da True Importados...\n");

  try {
    await connectDB();
    const tenantId = await getTenantId("True");
    console.log(`✓ Tenant encontrado: ID ${tenantId}`);

    const produtosCount = await importProdutos(tenantId);

    console.log("\n" + "=".repeat(60));
    console.log("✅ IMPORTAÇÃO CONCLUÍDA!");
    console.log("=".repeat(60));
    console.log(`📊 Produtos importados: ${produtosCount}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n✓ Conexão fechada");
    }
  }
}

main();
