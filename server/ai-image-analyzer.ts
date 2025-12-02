import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

export type ImageAnalysisType = "product" | "document" | "invoice" | "general";

export interface ImageAnalysisResult {
  success: boolean;
  data: any;
  suggestions: string[];
  confidence: number;
}

/**
 * Analisa uma imagem usando IA e extrai informações estruturadas
 */
export async function analyzeImage(
  imageUrl: string,
  analysisType: ImageAnalysisType,
  context?: string
): Promise<ImageAnalysisResult> {
  try {
    const systemPrompts: Record<ImageAnalysisType, string> = {
      product: `Você é um especialista em análise de produtos eletrônicos, especialmente celulares e acessórios.
Analise a imagem e extraia:
- Nome do produto
- Marca
- Modelo
- Especificações visíveis (cor, armazenamento, etc.)
- Estado (novo, usado, lacrado)
- Categoria
- Preço sugerido (se visível)

Retorne em formato JSON estruturado.`,

      document: `Você é um especialista em OCR e análise de documentos.
Analise a imagem e extraia:
- Tipo de documento (RG, CNH, CPF, CNPJ, etc.)
- Nome completo
- CPF ou CNPJ
- Endereço (se disponível)
- Telefone (se disponível)
- Data de nascimento (se disponível)
- Outros dados relevantes

Retorne em formato JSON estruturado.`,

      invoice: `Você é um especialista em análise de notas fiscais eletrônicas (NF-e).
Analise a imagem e extraia:
- Número da nota
- Data de emissão
- CNPJ do emitente
- Nome do emitente
- Produtos (nome, quantidade, valor unitário, valor total)
- Valor total da nota
- Impostos (ICMS, PIS, COFINS, IPI)

Retorne em formato JSON estruturado.`,

      general: `Você é um assistente de análise de imagens.
Descreva o que você vê na imagem e extraia informações relevantes.
Retorne em formato JSON estruturado.`,
    };

    const messages: Message[] = [
      {
        role: "system",
        content: systemPrompts[analysisType],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: context || "Analise esta imagem e extraia todas as informações relevantes.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ];

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "image_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              extracted_data: {
                type: "object",
                description: "Dados extraídos da imagem",
                additionalProperties: true,
              },
              confidence: {
                type: "number",
                description: "Nível de confiança da análise (0-100)",
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "Sugestões para o usuário",
              },
            },
            required: ["extracted_data", "confidence", "suggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    const message = response.choices[0]?.message;
    if (!message || !message.content) {
      throw new Error("Resposta vazia da IA");
    }

    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    const parsed = JSON.parse(content);

    return {
      success: true,
      data: parsed.extracted_data,
      suggestions: parsed.suggestions || [],
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error("[AI Image Analyzer] Error:", error);
    return {
      success: false,
      data: {},
      suggestions: ["Não foi possível analisar a imagem. Tente novamente com uma imagem mais nítida."],
      confidence: 0,
    };
  }
}

/**
 * Analisa uma imagem de produto e sugere dados para cadastro
 */
export async function analyzeProductImage(imageUrl: string): Promise<{
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  suggestedPrice?: number;
  specifications?: Record<string, string>;
}> {
  const result = await analyzeImage(imageUrl, "product");
  
  if (!result.success) {
    return {};
  }

  return {
    name: result.data.name || result.data.product_name,
    brand: result.data.brand || result.data.manufacturer,
    model: result.data.model,
    category: result.data.category,
    description: result.data.description,
    suggestedPrice: result.data.suggested_price || result.data.price,
    specifications: result.data.specifications || {},
  };
}

/**
 * Analisa um documento e extrai dados pessoais
 */
export async function analyzeDocumentImage(imageUrl: string): Promise<{
  name?: string;
  cpf?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
}> {
  const result = await analyzeImage(imageUrl, "document");
  
  if (!result.success) {
    return {};
  }

  return {
    name: result.data.name || result.data.full_name,
    cpf: result.data.cpf,
    cnpj: result.data.cnpj,
    phone: result.data.phone || result.data.telephone,
    address: result.data.address || result.data.street,
    city: result.data.city,
    state: result.data.state || result.data.uf,
    zipCode: result.data.zip_code || result.data.cep,
    birthDate: result.data.birth_date || result.data.date_of_birth,
  };
}

/**
 * Analisa uma nota fiscal e extrai produtos
 */
export async function analyzeInvoiceImage(imageUrl: string): Promise<{
  invoiceNumber?: string;
  issueDate?: string;
  emitterCnpj?: string;
  emitterName?: string;
  products?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount?: number;
  taxes?: {
    icms?: number;
    pis?: number;
    cofins?: number;
    ipi?: number;
  };
}> {
  const result = await analyzeImage(imageUrl, "invoice");
  
  if (!result.success) {
    return {};
  }

  return {
    invoiceNumber: result.data.invoice_number || result.data.number,
    issueDate: result.data.issue_date || result.data.date,
    emitterCnpj: result.data.emitter_cnpj || result.data.cnpj,
    emitterName: result.data.emitter_name || result.data.company_name,
    products: result.data.products || result.data.items || [],
    totalAmount: result.data.total_amount || result.data.total,
    taxes: {
      icms: result.data.icms,
      pis: result.data.pis,
      cofins: result.data.cofins,
      ipi: result.data.ipi,
    },
  };
}
