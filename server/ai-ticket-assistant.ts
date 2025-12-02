import { invokeLLM } from "./_core/llm";

/**
 * Análise inteligente de tickets de suporte usando IA
 */

export interface TicketAnalysis {
  suggestedCategory: "duvida" | "problema_tecnico" | "solicitacao_recurso" | "bug";
  suggestedPriority: "baixa" | "media" | "alta" | "urgente";
  autoSolutions: string[];
  relatedArticles: Array<{
    title: string;
    summary: string;
    relevance: number;
  }>;
  needsHumanSupport: boolean;
  confidence: "high" | "medium" | "low";
  estimatedResolutionTime: string;
}

export async function analyzeTicketWithAI(
  subject: string,
  description: string
): Promise<TicketAnalysis> {
  try {
    const prompt = `Você é um assistente de suporte técnico especializado em sistemas de gestão para lojas de celular (CellSync).

Analise o seguinte chamado de suporte e forneça uma resposta em JSON com:
1. Categoria sugerida (duvida, problema_tecnico, solicitacao_recurso, bug)
2. Prioridade sugerida (baixa, media, alta, urgente)
3. Lista de soluções automáticas (máximo 3)
4. Artigos relacionados da base de conhecimento (máximo 3)
5. Se precisa de suporte humano (true/false)
6. Nível de confiança da análise (high, medium, low)
7. Tempo estimado de resolução (ex: "5 minutos", "1 hora", "1 dia")

**Assunto:** ${subject}
**Descrição:** ${description}

**Base de Conhecimento Disponível:**
- Como cadastrar produtos no sistema
- Como fazer uma venda no PDV
- Como emitir nota fiscal (NF-e)
- Como rastrear produtos por IMEI
- Como configurar comissões de vendedores
- Como gerar relatórios de vendas
- Como importar produtos via planilha
- Como usar a IA para diagnóstico de OS
- Como configurar preços de atacado e varejo
- Como gerar etiquetas de produtos
- Problemas comuns de login
- Como alterar senha de usuário
- Como adicionar novos usuários
- Como fazer backup do sistema
- Como usar o sistema multi-tenant

Retorne APENAS um objeto JSON válido, sem markdown ou explicações adicionais.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente de suporte técnico. Responda APENAS com JSON válido, sem markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ticket_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestedCategory: {
                type: "string",
                enum: ["duvida", "problema_tecnico", "solicitacao_recurso", "bug"],
              },
              suggestedPriority: {
                type: "string",
                enum: ["baixa", "media", "alta", "urgente"],
              },
              autoSolutions: {
                type: "array",
                items: { type: "string" },
                maxItems: 3,
              },
              relatedArticles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                    relevance: { type: "number" },
                  },
                  required: ["title", "summary", "relevance"],
                  additionalProperties: false,
                },
                maxItems: 3,
              },
              needsHumanSupport: { type: "boolean" },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
              estimatedResolutionTime: { type: "string" },
            },
            required: [
              "suggestedCategory",
              "suggestedPriority",
              "autoSolutions",
              "relatedArticles",
              "needsHumanSupport",
              "confidence",
              "estimatedResolutionTime",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const analysis: TicketAnalysis = JSON.parse(contentStr);
    return analysis;
  } catch (error) {
    console.error("Erro ao analisar ticket com IA:", error);
    // Fallback: análise básica por palavras-chave
    return analyzeFallback(subject, description);
  }
}

/**
 * Análise de fallback usando palavras-chave (quando IA falha)
 */
function analyzeFallback(subject: string, description: string): TicketAnalysis {
  const text = `${subject} ${description}`.toLowerCase();

  // Detectar categoria
  let suggestedCategory: TicketAnalysis["suggestedCategory"] = "duvida";
  if (
    text.includes("erro") ||
    text.includes("problema") ||
    text.includes("não funciona") ||
    text.includes("travou")
  ) {
    suggestedCategory = "problema_tecnico";
  } else if (
    text.includes("bug") ||
    text.includes("falha") ||
    text.includes("crash")
  ) {
    suggestedCategory = "bug";
  } else if (
    text.includes("quero") ||
    text.includes("preciso") ||
    text.includes("adicionar") ||
    text.includes("implementar")
  ) {
    suggestedCategory = "solicitacao_recurso";
  }

  // Detectar prioridade
  let suggestedPriority: TicketAnalysis["suggestedPriority"] = "media";
  if (
    text.includes("urgente") ||
    text.includes("crítico") ||
    text.includes("parado") ||
    text.includes("não consigo trabalhar")
  ) {
    suggestedPriority = "urgente";
  } else if (text.includes("importante") || text.includes("preciso logo")) {
    suggestedPriority = "alta";
  } else if (text.includes("quando possível") || text.includes("sem pressa")) {
    suggestedPriority = "baixa";
  }

  // Soluções automáticas baseadas em palavras-chave
  const autoSolutions: string[] = [];

  if (text.includes("login") || text.includes("senha")) {
    autoSolutions.push(
      "Tente limpar o cache do navegador e fazer login novamente"
    );
    autoSolutions.push(
      'Use a opção "Esqueci minha senha" na tela de login'
    );
    autoSolutions.push(
      "Verifique se o Caps Lock está desativado ao digitar a senha"
    );
  } else if (text.includes("produto") || text.includes("cadastr")) {
    autoSolutions.push(
      "Acesse o menu Estoque → Novo Produto para cadastrar manualmente"
    );
    autoSolutions.push(
      "Use a IA clicando no botão 'Preencher com IA' para preencher automaticamente"
    );
    autoSolutions.push(
      "Importe produtos em massa via menu Importar Planilha (CSV)"
    );
  } else if (text.includes("venda") || text.includes("pdv")) {
    autoSolutions.push(
      "Acesse o menu Vendas (PDV) para registrar uma nova venda"
    );
    autoSolutions.push(
      "Certifique-se de selecionar o cliente e vendedor antes de finalizar"
    );
    autoSolutions.push(
      "Use F3 para finalizar venda rapidamente ou F4 para limpar carrinho"
    );
  } else if (text.includes("nota fiscal") || text.includes("nf-e")) {
    autoSolutions.push(
      "Acesse o menu Notas Fiscais para emitir uma NF-e manualmente"
    );
    autoSolutions.push(
      "No PDV, marque a opção 'Emitir NF-e automaticamente' ao finalizar venda"
    );
    autoSolutions.push(
      "Certifique-se de que o cliente possui CPF/CNPJ cadastrado"
    );
  } else {
    autoSolutions.push(
      "Consulte a documentação do sistema no menu Ajuda"
    );
    autoSolutions.push(
      "Verifique se você possui as permissões necessárias para esta ação"
    );
    autoSolutions.push(
      "Tente fazer logout e login novamente para atualizar as permissões"
    );
  }

  // Artigos relacionados
  const relatedArticles: TicketAnalysis["relatedArticles"] = [];

  if (text.includes("login") || text.includes("senha")) {
    relatedArticles.push({
      title: "Problemas comuns de login",
      summary:
        "Aprenda a resolver problemas de acesso ao sistema, recuperar senha e configurar autenticação.",
      relevance: 0.9,
    });
    relatedArticles.push({
      title: "Como alterar senha de usuário",
      summary:
        "Passo a passo para alterar sua senha ou a senha de outros usuários (apenas administradores).",
      relevance: 0.8,
    });
  } else if (text.includes("produto")) {
    relatedArticles.push({
      title: "Como cadastrar produtos no sistema",
      summary:
        "Guia completo para cadastrar produtos manualmente, com IA ou importar via planilha.",
      relevance: 0.95,
    });
    relatedArticles.push({
      title: "Como importar produtos via planilha",
      summary:
        "Aprenda a importar centenas de produtos de uma vez usando arquivos CSV ou Excel.",
      relevance: 0.85,
    });
  } else if (text.includes("venda") || text.includes("pdv")) {
    relatedArticles.push({
      title: "Como fazer uma venda no PDV",
      summary:
        "Tutorial completo do Ponto de Venda: buscar produtos, adicionar ao carrinho e finalizar venda.",
      relevance: 0.9,
    });
    relatedArticles.push({
      title: "Como configurar comissões de vendedores",
      summary:
        "Configure comissões automáticas por percentual, valor fixo ou mista para seus vendedores.",
      relevance: 0.7,
    });
  }

  // Preencher com artigos genéricos se necessário
  while (relatedArticles.length < 3) {
    relatedArticles.push({
      title: "Guia de Introdução ao CellSync",
      summary:
        "Conheça os principais recursos do sistema e como começar a usar.",
      relevance: 0.5,
    });
  }

  return {
    suggestedCategory,
    suggestedPriority,
    autoSolutions: autoSolutions.slice(0, 3),
    relatedArticles: relatedArticles.slice(0, 3),
    needsHumanSupport: suggestedPriority === "urgente" || suggestedCategory === "bug",
    confidence: "low",
    estimatedResolutionTime:
      suggestedPriority === "urgente" ? "1 hora" : "1 dia",
  };
}
