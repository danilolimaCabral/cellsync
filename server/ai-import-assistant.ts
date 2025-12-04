import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

/**
 * Assistente de IA para Importação Inteligente de Dados
 * Analisa arquivos, mapeia colunas automaticamente e aprende com o usuário
 */

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transformation?: string; // ex: "uppercase", "remove_spaces", "format_phone"
}

export interface ImportAnalysis {
  totalRows: number;
  columns: string[];
  sampleData: Record<string, any>[];
  suggestedMapping: ColumnMapping[];
  detectedPatterns: {
    category?: string;
    supplier?: string;
    priceRange?: { min: number; max: number };
  };
  warnings: string[];
}

/**
 * Analisa dados brutos e sugere mapeamento automático
 */
export async function analyzeImportData(
  data: Record<string, any>[],
  moduleType: string,
  tenantMemory?: any[]
): Promise<ImportAnalysis> {
  const columns = Object.keys(data[0] || {});
  const sampleData = data.slice(0, 5);

  // Preparar contexto com memória do tenant (se houver)
  let memoryContext = "";
  if (tenantMemory && tenantMemory.length > 0) {
    memoryContext = "\n\nREGRAS APRENDIDAS ANTERIORMENTE:\n";
    tenantMemory.forEach((mem) => {
      memoryContext += `- ${mem.key}: ${JSON.stringify(mem.value)}\n`;
    });
  }

  // Montar prompt para IA
  const systemPrompt = `Você é um Especialista em Limpeza e Migração de Dados (ETL).
Sua missão é garantir que os dados do usuário sejam importados PERFEITAMENTE para o módulo: ${moduleType}.

CAMPOS ALVO DO SISTEMA:
${getAvailableFields(moduleType)}

${memoryContext}

TAREFA:
1. Mapear colunas do arquivo para os campos do sistema.
2. Identificar problemas de qualidade nos dados (formatação, sujeira, padrões mistos).
3. Sugerir a transformação CORRETA para limpar os dados automaticamente.

TRANSFORMAÇÕES DISPONÍVEIS (Use agressivamente):
- 'uppercase': Para siglas (UF, SKU).
- 'lowercase': Para emails.
- 'titlecase': Para nomes próprios (ex: "JOAO SILVA" -> "Joao Silva").
- 'trim': Remove espaços extras.
- 'format_phone': Remove tudo que não é número (ex: "(11) 9..." -> "119...").
- 'format_cpf_cnpj': Remove pontuação de documentos.
- 'parse_currency_br': Limpa "R$ 1.200,00", "1.200,00", "1200" para número decimal puro.
- 'parse_date_auto': Detecta e converte datas (DD/MM/AAAA, MM/DD/AAAA, YYYY-MM-DD) para objeto Date.
- 'translate_boolean': Converte "Sim/Não", "S/N", "Yes/No", "1/0" para booleano real.
- 'extract_numbers': Extrai apenas números de um texto misto.

REGRAS DE OURO:
- Se detectar preços com "R$", "US$", vírgulas ou pontos, USE 'parse_currency_br'.
- Se detectar datas, USE 'parse_date_auto'.
- Se detectar nomes em CAIXA ALTA, USE 'titlecase'.
- Se detectar documentos (CPF/CNPJ) com pontos/traços, USE 'format_cpf_cnpj'.
- Retorne JSON estrito.`;

  const userPrompt = `COLUNAS ENCONTRADAS: ${columns.join(", ")}

AMOSTRA DOS DADOS (primeiras 5 linhas):
${JSON.stringify(sampleData, null, 2)}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "import_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestedMapping: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceColumn: { type: "string" },
                    targetField: { type: "string" },
                    confidence: { type: "number" },
                    transformation: { type: "string" },
                  },
                  required: ["sourceColumn", "targetField", "confidence"],
                  additionalProperties: false,
                },
              },
              detectedPatterns: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  supplier: { type: "string" },
                  priceRange: {
                    type: "object",
                    properties: {
                      min: { type: "number" },
                      max: { type: "number" },
                    },
                    required: ["min", "max"],
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              warnings: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["suggestedMapping", "detectedPatterns", "warnings"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("IA retornou resposta vazia");
    }

    const analysis = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

    return {
      totalRows: data.length,
      columns,
      sampleData,
      suggestedMapping: analysis.suggestedMapping,
      detectedPatterns: analysis.detectedPatterns,
      warnings: analysis.warnings,
    };
  } catch (error) {
    console.error("[AI Import] Erro ao analisar dados:", error);
    
    // Fallback simples se a IA falhar
    return {
      totalRows: data.length,
      columns,
      sampleData,
      suggestedMapping: columns.map(col => ({
        sourceColumn: col,
        targetField: suggestFieldByKeyword(col, moduleType),
        confidence: 50
      })),
      detectedPatterns: {},
      warnings: ["Falha na análise inteligente. Mapeamento sugerido por palavras-chave."]
    };
  }
}

/**
 * Chat interativo para ajustes de importação
 */
export async function chatWithImportAssistant(
  messages: Message[],
  currentData: Record<string, any>[],
  currentMapping: ColumnMapping[]
): Promise<string> {
  const systemPrompt = `Você é um assistente de importação de dados amigável e prestativo.
O usuário está importando dados e pode pedir ajustes no mapeamento, transformações ou correções.

DADOS ATUAIS: ${currentData.length} linhas
MAPEAMENTO ATUAL: ${JSON.stringify(currentMapping, null, 2)}

Você pode:
- Sugerir alterações no mapeamento
- Propor transformações de dados
- Explicar como os dados serão importados
- Responder dúvidas sobre o processo

Seja conciso e direto. Use emojis para deixar a conversa mais amigável.`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error("[AI Import] Erro no chat:", error);
    return "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?";
  }
}

/**
 * Retorna os campos disponíveis para cada módulo
 */
function getAvailableFields(moduleType: string): string {
  const fields: Record<string, string[]> = {
    products: [
      "name (obrigatório)",
      "description",
      "sku",
      "category",
      "brand",
      "model",
      "retailPrice (obrigatório)",
      "wholesalePrice",
      "minWholesaleQty",
      "costPrice",
      "currentStock",
      "minStock",
      "maxStock",
      "supplier",
      "barcode",
      "weight",
      "dimensions",
      "warranty",
      "active",
    ],
    customers: [
      "name (obrigatório)",
      "fantasyName",
      "email",
      "phone",
      "cpf",
      "cnpj",
      "address",
      "city",
      "state",
      "zipCode",
      "birthDate",
      "segment",
      "notes",
    ],
    sales: [
      "customerName ou customerId",
      "sellerName ou sellerId",
      "saleDate",
      "totalAmount",
      "discount",
      "paymentMethod",
      "paymentStatus",
      "items (produtos vendidos)",
    ],
    stock: [
      "productName ou productId",
      "quantity",
      "imei",
      "supplier",
      "entryDate",
      "costPrice",
      "location",
    ],
    service_orders: [
      "customerName ou customerId",
      "deviceBrand",
      "deviceModel",
      "defect",
      "status",
      "technicianName ou technicianId",
      "openDate",
      "estimatedCost",
    ],
    accounts_payable: [
      "description",
      "amount",
      "dueDate",
      "supplier",
      "category",
      "status",
    ],
    accounts_receivable: [
      "description",
      "amount",
      "dueDate",
      "customerName ou customerId",
      "status",
    ],
  };

  return fields[moduleType]?.join("\n- ") || "Campos não definidos";
}

/**
 * Sugere campo baseado em palavra-chave (Fallback)
 */
function suggestFieldByKeyword(column: string, moduleType: string): string {
  const col = column.toLowerCase();
  
  if (moduleType === 'products') {
    if (col.includes('nome') || col.includes('produto') || col.includes('descrição')) return 'name';
    if (col.includes('preço') && col.includes('venda')) return 'retailPrice';
    if (col.includes('preço') && col.includes('custo')) return 'costPrice';
    if (col.includes('estoque') || col.includes('qtd')) return 'currentStock';
    if (col.includes('sku') || col.includes('código')) return 'sku';
    if (col.includes('marca')) return 'brand';
    if (col.includes('categoria')) return 'category';
  }
  
  if (moduleType === 'customers') {
    if (col.includes('nome') || col.includes('cliente')) return 'name';
    if (col.includes('email')) return 'email';
    if (col.includes('telefone') || col.includes('celular')) return 'phone';
    if (col.includes('cpf')) return 'cpf';
    if (col.includes('cnpj')) return 'cnpj';
    if (col.includes('endereço') || col.includes('rua')) return 'address';
  }
  
  return '';
}

/**
 * Aplica transformações nos dados baseado no mapeamento
 */
export function applyTransformations(
  data: Record<string, any>[],
  mapping: ColumnMapping[]
): Record<string, any>[] {
  return data.map((row) => {
    const transformedRow: Record<string, any> = {};

    mapping.forEach((map) => {
      let value = row[map.sourceColumn];

      // Aplicar transformações
      if (map.transformation && value) {
        switch (map.transformation) {
          case "uppercase":
            value = String(value).toUpperCase();
            break;
          case "lowercase":
            value = String(value).toLowerCase();
            break;
          case "trim":
            value = String(value).trim();
            break;
          case "remove_spaces":
            value = String(value).replace(/\s+/g, "");
            break;
          case "format_phone":
            value = String(value).replace(/\D/g, "");
            break;
          case "format_cpf":
            value = String(value).replace(/\D/g, "").substring(0, 11);
            break;
          case "format_cnpj":
            value = String(value).replace(/\D/g, "").substring(0, 14);
            break;
          case "parse_number":
            value = parseFloat(String(value).replace(/[^\d.-]/g, ""));
            break;
          case "parse_date":
            value = new Date(value);
            break;
          case "titlecase":
            value = String(value).toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
            break;
          case "format_cpf_cnpj":
            value = String(value).replace(/\D/g, "");
            break;
          case "parse_currency_br": // Remove R$, U$, espaços e converte 1.000,00 para 1000.00
            // Remove tudo que não é dígito, vírgula ou ponto (mantém sinal de negativo se houver)
            let cleanStr = String(value).replace(/[^\d.,-]/g, "").trim();
            // Se tiver vírgula no final (ex: 100,00), assume formato BR
            if (cleanStr.includes(",") && !cleanStr.includes(".")) {
               cleanStr = cleanStr.replace(",", ".");
            } else if (cleanStr.includes(".") && cleanStr.includes(",")) {
               // Formato misto (1.000,00) -> remove ponto, troca vírgula por ponto
               cleanStr = cleanStr.replace(/\./g, "").replace(",", ".");
            }
            value = parseFloat(cleanStr);
            break;
          case "parse_date_auto": // Tenta detectar formato DD/MM/AAAA ou YYYY-MM-DD
            const dateStr = String(value).trim();
            if (dateStr.includes("/")) {
               const parts = dateStr.split("/");
               if (parts[0].length === 4) { // YYYY/MM/DD
                 value = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
               } else { // DD/MM/AAAA (assumido)
                 value = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
               }
            } else {
               value = new Date(dateStr);
            }
            break;
          case "translate_boolean": // Yes/No -> true/false ou Sim/Não
            const v = String(value).toLowerCase();
            value = v === "yes" || v === "sim" || v === "true" || v === "s";
            break;
        }
      }

      transformedRow[map.targetField] = value;
    });

    return transformedRow;
  });
}
