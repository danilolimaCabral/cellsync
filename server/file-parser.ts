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
 * Detectar delimitador de CSV analisando a primeira linha
 */
function detectDelimiter(fileContent: string): string {
  const firstLine = fileContent.split('\n')[0];
  if (!firstLine) return ',';

  // Contar ocorrências de cada delimitador potencial
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(d => ({
    delimiter: d,
    count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length
  }));

  // Retornar o delimitador com mais ocorrências
  const best = counts.reduce((a, b) => (a.count > b.count ? a : b));
  return best.count > 0 ? best.delimiter : ',';
}

/**
 * Parse arquivo CSV
 */
export function parseCSV(fileContent: string): ParsedData {
  // Detecta o delimitador mais provável
  const detectedDelimiter = detectDelimiter(fileContent);
  
  // Tenta delimitadores em ordem de probabilidade
  const delimitersToTry = [detectedDelimiter, ';', ',', '\t', '|'];
  const uniqueDelimiters = [...new Set(delimitersToTry)]; // Remove duplicatas
  let lastError = "";

  for (const delimiter of uniqueDelimiters) {
    try {
      const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter,
        transformHeader: (header) => header.trim(),
        dynamicTyping: false, // Manter como string para evitar problemas de tipo
      });

      // Se tiver erros críticos de parsing
      if (result.errors.length > 0) {
        const fatalError = result.errors.find(e => e.type === "Delimiter" || e.code === "UndetectableDelimiter");
        if (fatalError) {
          lastError = fatalError.message;
          continue;
        }
      }

      const data = result.data as Record<string, any>[];
      const columns = result.meta.fields || [];

      // Validação: se achou colunas e dados, sucesso!
      if (columns.length > 0 && data.length > 0) {
        return {
          data,
          columns,
          totalRows: data.length,
        };
      }
    } catch (e) {
      lastError = (e as Error).message;
    }
  }

  // Se chegou aqui, nenhum delimitador funcionou
  throw new Error(`Erro ao ler CSV: Não foi possível detectar o formato automaticamente. Delimitador detectado: '${detectedDelimiter}'. Tente usar um arquivo com delimitador padrão (vírgula ou ponto-e-vírgula). (Erro: ${lastError || "Formato inválido"})`);
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
    
    // Ler como array de arrays para inspecionar estrutura
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      blankrows: false
    }) as any[][];

    if (rawData.length === 0) continue;

    // Heurística: Encontrar a linha de cabeçalho
    // Procuramos a primeira linha que tenha pelo menos 1 coluna preenchida com texto (relaxado de 2 para 1)
    let headerRowIndex = -1;
    const scanLimit = Math.min(rawData.length, 50); // Aumentado de 20 para 50
    
    for (let i = 0; i < scanLimit; i++) {
      const row = rawData[i];
      // Conta células não vazias (string ou número)
      const nonEmptyCells = row.filter(cell => 
        (cell !== null && cell !== undefined && String(cell).trim().length > 0)
      ).length;
      
      // Aceita se tiver pelo menos 1 coluna válida (ex: lista simples de emails)
      if (nonEmptyCells >= 1) {
        headerRowIndex = i;
        break;
      }
    }

    // Se não achou cabeçalho claro, tenta usar a primeira linha não vazia
    if (headerRowIndex === -1 && rawData.length > 0) {
      headerRowIndex = 0;
    }

    if (headerRowIndex !== -1) {
      // Re-ler a planilha usando a linha detectada como cabeçalho
      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
      range.s.r = headerRowIndex; // Ajustar início para a linha do cabeçalho
      
      const finalData = XLSX.utils.sheet_to_json(worksheet, {
        range: range,
        raw: false,
        defval: ""
      }) as Record<string, any>[];

      if (finalData.length > 0) {
        data = finalData;
        columns = Object.keys(data[0]);
        break;
      }
    }
  }

  if (data.length === 0) {
    throw new Error(`Não foi possível encontrar dados na planilha. Verificamos as primeiras 50 linhas de todas as abas (${workbook.SheetNames.join(", ")}). Certifique-se de que há dados preenchidos.`);
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
