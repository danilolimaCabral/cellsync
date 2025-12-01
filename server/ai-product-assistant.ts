/**
 * IA Assistente para Cadastro de Produtos
 * 
 * Analisa o nome de um produto e extrai automaticamente:
 * - Marca (Apple, Samsung, Xiaomi, etc)
 * - Modelo (iPhone 15 Pro Max, Galaxy S24, etc)
 * - Categoria (Smartphone, Tablet, Acessório, etc)
 */

import { invokeLLM } from "./_core/llm";

export interface ProductAnalysisResult {
  brand: string;
  model: string;
  category: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Analisa o nome de um produto usando IA e extrai informações estruturadas
 */
export async function analyzeProductWithAI(productName: string): Promise<ProductAnalysisResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em produtos eletrônicos, especialmente celulares e acessórios.
Sua tarefa é analisar o nome de um produto e extrair:
- Marca (brand): Apple, Samsung, Xiaomi, Motorola, LG, etc
- Modelo (model): iPhone 15 Pro Max, Galaxy S24 Ultra, Redmi Note 13, etc
- Categoria (category): Smartphone, Tablet, Smartwatch, Fone de Ouvido, Carregador, Capa, Película, etc

Regras importantes:
1. Se não conseguir identificar com certeza, use "Não identificado"
2. Seja específico no modelo (inclua variações como Pro, Max, Ultra, Plus)
3. Para acessórios, identifique a categoria correta
4. Retorne APENAS o JSON, sem texto adicional`
        },
        {
          role: "user",
          content: `Analise este produto: "${productName}"`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              brand: {
                type: "string",
                description: "Marca do produto (Apple, Samsung, Xiaomi, etc)"
              },
              model: {
                type: "string",
                description: "Modelo específico do produto"
              },
              category: {
                type: "string",
                description: "Categoria do produto (Smartphone, Tablet, Acessório, etc)"
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Nível de confiança da análise"
              }
            },
            required: ["brand", "model", "category", "confidence"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content || typeof content !== "string") {
      throw new Error("IA não retornou resposta válida");
    }

    const result = JSON.parse(content) as ProductAnalysisResult;
    
    return result;
  } catch (error) {
    console.error("Erro ao analisar produto com IA:", error);
    
    // Fallback: análise básica por palavras-chave
    return analyzeProductFallback(productName);
  }
}

/**
 * Análise de fallback usando regex e palavras-chave
 */
function analyzeProductFallback(productName: string): ProductAnalysisResult {
  const nameLower = productName.toLowerCase();
  
  // Detectar marca
  let brand = "Não identificado";
  if (nameLower.includes("iphone") || nameLower.includes("apple")) brand = "Apple";
  else if (nameLower.includes("samsung") || nameLower.includes("galaxy")) brand = "Samsung";
  else if (nameLower.includes("xiaomi") || nameLower.includes("redmi") || nameLower.includes("poco")) brand = "Xiaomi";
  else if (nameLower.includes("motorola") || nameLower.includes("moto")) brand = "Motorola";
  else if (nameLower.includes("lg")) brand = "LG";
  
  // Detectar categoria
  let category = "Smartphone";
  if (nameLower.includes("fone") || nameLower.includes("earphone") || nameLower.includes("airpods")) category = "Fone de Ouvido";
  else if (nameLower.includes("carregador") || nameLower.includes("charger")) category = "Carregador";
  else if (nameLower.includes("capa") || nameLower.includes("case")) category = "Capa";
  else if (nameLower.includes("película") || nameLower.includes("screen")) category = "Película";
  else if (nameLower.includes("tablet") || nameLower.includes("ipad")) category = "Tablet";
  else if (nameLower.includes("watch") || nameLower.includes("smartwatch")) category = "Smartwatch";
  
  return {
    brand,
    model: productName,
    category,
    confidence: "low"
  };
}
