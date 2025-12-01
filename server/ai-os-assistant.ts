import { invokeLLM } from "./_core/llm";

export interface OSDiagnosisResult {
  defect: string;
  solution: string;
  parts: string[];
  estimatedTime: string;
  estimatedCost: number;
  confidence: "high" | "medium" | "low";
  notes: string;
}

/**
 * Analisa o problema relatado pelo cliente e sugere diagnóstico, solução e peças
 * Suporta análise de imagem para diagnóstico visual
 */
export async function diagnoseServiceOrder(
  problem: string,
  deviceInfo?: string,
  imageUrl?: string
): Promise<OSDiagnosisResult> {
  try {
    const prompt = `Você é um técnico especialista em assistência técnica de celulares e eletrônicos.

PROBLEMA RELATADO: ${problem}
${deviceInfo ? `DISPOSITIVO: ${deviceInfo}` : ""}
${imageUrl ? `IMAGEM: Analise a foto anexada para identificar danos visíveis` : ""}

Analise o problema e forneça um diagnóstico técnico completo em formato JSON com:
- defect: Defeito identificado (ex: "Tela LCD danificada", "Bateria viciada", "Placa mãe oxidada")
- solution: Solução recomendada (ex: "Substituir display LCD original", "Trocar bateria por nova")
- parts: Array de peças necessárias (ex: ["Display LCD", "Cola UV", "Película protetora"])
- estimatedTime: Tempo estimado (ex: "2 horas", "1 dia útil", "30 minutos")
- estimatedCost: Custo estimado em centavos (ex: 35000 para R$ 350,00)
- confidence: "high" se problema claro, "medium" se precisa confirmação, "low" se incerto
- notes: Observações técnicas importantes

IMPORTANTE:
- Seja específico e técnico
- Considere problemas comuns em celulares (tela, bateria, placa, software, água)
- Estime custos realistas do mercado brasileiro
- Se mencionar água/líquido, sempre sugira limpeza de placa
- Para problemas de software, sugira reset ou flash
- Para tela quebrada, especifique se é só o vidro ou o LCD também`;

    const messages: any[] = [
      {
        role: "system",
        content: "Você é um técnico especialista em assistência técnica. Responda APENAS com JSON válido, sem texto adicional.",
      },
    ];

    // Se houver imagem, adicionar ao conteúdo
    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "os_diagnosis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              defect: {
                type: "string",
                description: "Defeito identificado",
              },
              solution: {
                type: "string",
                description: "Solução recomendada",
              },
              parts: {
                type: "array",
                items: { type: "string" },
                description: "Peças necessárias",
              },
              estimatedTime: {
                type: "string",
                description: "Tempo estimado",
              },
              estimatedCost: {
                type: "integer",
                description: "Custo estimado em centavos",
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Nível de confiança",
              },
              notes: {
                type: "string",
                description: "Observações técnicas",
              },
            },
            required: [
              "defect",
              "solution",
              "parts",
              "estimatedTime",
              "estimatedCost",
              "confidence",
              "notes",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("IA não retornou resposta válida");
    }

    const result = JSON.parse(content) as OSDiagnosisResult;

    return result;
  } catch (error) {
    console.error("Erro ao diagnosticar OS com IA:", error);

    // Fallback: análise básica por palavras-chave
    return analyzeProblemWithKeywords(problem);
  }
}

/**
 * Fallback: análise básica por palavras-chave
 */
function analyzeProblemWithKeywords(problem: string): OSDiagnosisResult {
  const lowerProblem = problem.toLowerCase();

  // Tela quebrada
  if (
    lowerProblem.includes("tela") &&
    (lowerProblem.includes("quebr") ||
      lowerProblem.includes("trinca") ||
      lowerProblem.includes("racha"))
  ) {
    return {
      defect: "Display danificado",
      solution: "Substituir display completo (LCD + Touch)",
      parts: ["Display LCD", "Cola UV", "Película de vidro"],
      estimatedTime: "2 horas",
      estimatedCost: 35000, // R$ 350
      confidence: "high",
      notes: "Verificar se apenas o vidro está quebrado ou se o LCD também foi danificado. Testar touch após troca.",
    };
  }

  // Bateria
  if (
    lowerProblem.includes("bateria") ||
    lowerProblem.includes("descarreg") ||
    lowerProblem.includes("não carrega") ||
    lowerProblem.includes("vicia")
  ) {
    return {
      defect: "Bateria viciada ou danificada",
      solution: "Substituir bateria por nova original",
      parts: ["Bateria original", "Adesivo de bateria"],
      estimatedTime: "1 hora",
      estimatedCost: 15000, // R$ 150
      confidence: "high",
      notes: "Verificar se o conector de carga está funcionando. Testar com carregador original.",
    };
  }

  // Água/líquido
  if (
    lowerProblem.includes("água") ||
    lowerProblem.includes("molh") ||
    lowerProblem.includes("líquido") ||
    lowerProblem.includes("liquido") ||
    lowerProblem.includes("caiu")
  ) {
    return {
      defect: "Oxidação por contato com líquido",
      solution: "Limpeza completa da placa-mãe com ultrassom",
      parts: ["Álcool isopropílico", "Pasta térmica"],
      estimatedTime: "1 dia útil",
      estimatedCost: 20000, // R$ 200
      confidence: "medium",
      notes: "Necessário abrir o aparelho para avaliar extensão dos danos. Pode precisar substituir componentes oxidados.",
    };
  }

  // Software
  if (
    lowerProblem.includes("trava") ||
    lowerProblem.includes("lento") ||
    lowerProblem.includes("não liga") ||
    lowerProblem.includes("reinicia") ||
    lowerProblem.includes("travando")
  ) {
    return {
      defect: "Problema de software",
      solution: "Reset de fábrica ou reinstalação do sistema",
      parts: [],
      estimatedTime: "1 hora",
      estimatedCost: 8000, // R$ 80
      confidence: "medium",
      notes: "Fazer backup dos dados antes. Se não resolver, pode ser problema de hardware (memória ou placa).",
    };
  }

  // Câmera
  if (
    lowerProblem.includes("câmera") ||
    lowerProblem.includes("camera") ||
    lowerProblem.includes("foto")
  ) {
    return {
      defect: "Câmera danificada ou desconectada",
      solution: "Verificar conexão ou substituir módulo da câmera",
      parts: ["Módulo de câmera"],
      estimatedTime: "1 hora",
      estimatedCost: 12000, // R$ 120
      confidence: "medium",
      notes: "Verificar se é problema de software (app) ou hardware. Testar com diferentes apps de câmera.",
    };
  }

  // Botão
  if (lowerProblem.includes("botão") || lowerProblem.includes("botao")) {
    return {
      defect: "Botão danificado ou desconectado",
      solution: "Substituir flex do botão",
      parts: ["Flex de botão"],
      estimatedTime: "1 hora",
      estimatedCost: 8000, // R$ 80
      confidence: "high",
      notes: "Identificar qual botão está com problema (power, volume, home).",
    };
  }

  // Padrão genérico
  return {
    defect: "Diagnóstico inicial necessário",
    solution: "Avaliar aparelho presencialmente para diagnóstico preciso",
    parts: [],
    estimatedTime: "30 minutos",
    estimatedCost: 5000, // R$ 50 (avaliação)
    confidence: "low",
    notes: "Problema não identificado automaticamente. Necessário inspeção técnica detalhada.",
  };
}
