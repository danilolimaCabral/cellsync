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
  const systemPrompt = `Você é um assistente especializado em análise de dados para importação.
Seu objetivo é analisar os dados fornecidos e sugerir o melhor mapeamento de colunas.

MÓDULO: ${moduleType}

CAMPOS DISPONÍVEIS NO SISTEMA:
${getAvailableFields(moduleType)}

INSTRUÇÕES:
1. Analise as colunas fornecidas
2. Sugira o mapeamento mais adequado para cada coluna
3. Identifique padrões nos dados (categorias, fornecedores, faixas de preço)
4. Detecte possíveis problemas ou inconsistências
5. Aplique as regras aprendidas anteriormente (se houver)
${memoryContext}

Responda APENAS com um JSON válido no seguinte formato:
{
  "suggestedMapping": [
    {
      "sourceColumn": "nome da coluna original",
      "targetField": "campo do sistema",
      "confidence": 95,
      "transformation": "opcional: transformação necessária"
    }
  ],
  "detectedPatterns": {
    "category": "categoria detectada",
    "supplier": "fornecedor detectado",
    "priceRange": { "min": 100, "max": 5000 }
  },
  "warnings": ["lista de avisos importantes"]
}`;

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
        }
      }

      transformedRow[map.targetField] = value;
    });

    return transformedRow;
  });
}
