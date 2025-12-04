import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Parser de arquivos CSV e Excel para importação
 */

export interface ParsedData {
  data: Record<string, any>[];
  columns: string[];
  totalRows: number;
}

/**
 * Parse arquivo CSV
 */
export function parseCSV(fileContent: string): ParsedData {
  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(`Erro ao ler CSV: ${result.errors[0].message}`);
  }

  const data = result.data as Record<string, any>[];
  const columns = result.meta.fields || [];

  return {
    data,
    columns,
    totalRows: data.length,
  };
}

/**
 * Parse arquivo Excel (XLSX)
 */
export function parseExcel(fileBuffer: Buffer): ParsedData {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  
  // Procurar dados em todas as abas
  let data: Record<string, any>[] = [];
  let columns: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    }) as Record<string, any>[];

    if (sheetData.length > 0) {
      data = sheetData;
      columns = Object.keys(data[0]);
      break; // Encontrou dados, para de procurar
    }
  }

  if (data.length === 0) {
    throw new Error("Planilha vazia ou sem dados legíveis. Verifique se há cabeçalhos na primeira linha.");
  }

  return {
    data,
    columns,
    totalRows: data.length,
  };
}

/**
 * Detectar tipo de arquivo e fazer parse
 */
export function parseFile(fileContent: string | Buffer, fileName: string): ParsedData {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCSV(fileContent as string);
  } else if (extension === "xlsx" || extension === "xls") {
    return parseExcel(fileContent as Buffer);
  } else {
    throw new Error(`Formato de arquivo não suportado: ${extension}`);
  }
}

/**
 * Validar dados básicos
 */
export function validateData(data: Record<string, any>[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push("Arquivo vazio");
    return { valid: false, errors };
  }

  if (data.length > 10000) {
    errors.push("Arquivo muito grande (máximo 10.000 linhas)");
    return { valid: false, errors };
  }

  const columns = Object.keys(data[0]);
  if (columns.length === 0) {
    errors.push("Nenhuma coluna encontrada");
    return { valid: false, errors };
  }

  return { valid: errors.length === 0, errors };
}
