import { invokeLLM } from "./_core/llm";

export interface SuggestedAccount {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  is_analytical: boolean;
  description?: string;
}

export interface SuggestedEntry {
  debit_account_code: string;
  debit_account_name: string;
  credit_account_code: string;
  credit_account_name: string;
  description: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

/**
 * Analisa os dados do negócio e sugere um plano de contas inicial
 */
export async function suggestChartOfAccounts(businessType: string, mainProducts: string[]): Promise<SuggestedAccount[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um contador experiente especializado em configurar planos de contas para empresas.
Sua tarefa é sugerir um plano de contas OTIMIZADO e CONCISO para uma empresa, baseado no seu ramo de atividade e produtos.

Regras:
1. Use o padrão contábil brasileiro (1. Ativo, 2. Passivo, 3. Receita, 4. Despesa).
2. Crie apenas as contas essenciais para o tipo de negócio descrito.
3. Inclua contas sintéticas (agrupadoras) e analíticas (recebem lançamentos).
4. Para "type", use apenas: "asset", "liability", "equity", "revenue", "expense".
5. Retorne uma lista plana ordenada pelo código.`
        },
        {
          role: "user",
          content: `Tipo de Negócio: ${businessType}
Principais Produtos/Serviços: ${mainProducts.join(", ")}

Sugira um plano de contas completo.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chart_of_accounts_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              accounts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string", description: "Código da conta (ex: 1.1.01)" },
                    name: { type: "string", description: "Nome da conta" },
                    type: { type: "string", enum: ["asset", "liability", "equity", "revenue", "expense"] },
                    is_analytical: { type: "boolean", description: "Se aceita lançamentos (true) ou é grupo (false)" },
                    description: { type: "string", description: "Breve descrição do uso da conta" }
                  },
                  required: ["code", "name", "type", "is_analytical", "description"],
                  additionalProperties: false
                }
              }
            },
            required: ["accounts"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("IA não retornou resposta válida");

    const result = JSON.parse(content);
    return result.accounts;

  } catch (error) {
    console.error("Erro na análise de plano de contas:", error);
    // Fallback básico
    return [
      { code: "1", name: "ATIVO", type: "asset", is_analytical: false },
      { code: "1.1", name: "Circulante", type: "asset", is_analytical: false },
      { code: "1.1.01", name: "Caixa", type: "asset", is_analytical: true },
      { code: "2", name: "PASSIVO", type: "liability", is_analytical: false },
      { code: "3", name: "RECEITAS", type: "revenue", is_analytical: false },
      { code: "4", name: "DESPESAS", type: "expense", is_analytical: false },
    ];
  }
}

/**
 * Sugere um lançamento contábil baseado na descrição da transação
 */
export async function suggestEntry(description: string, availableAccounts: string[]): Promise<SuggestedEntry> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um assistente contábil. Analise a descrição de uma transação financeira e sugira o lançamento contábil (Débito e Crédito).
Use APENAS as contas fornecidas na lista de contas disponíveis. Se nenhuma conta se encaixar perfeitamente, escolha a mais próxima ou sugira uma genérica.

Contas Disponíveis:
${availableAccounts.join("\n")}

Regras:
1. Identifique a natureza da operação (Venda, Pagamento, Recebimento, Compra).
2. Determine qual conta deve ser debitada e qual creditada.
3. Explique brevemente o raciocínio.`
        },
        {
          role: "user",
          content: `Transação: "${description}"`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "accounting_entry_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              debit_account_code: { type: "string" },
              debit_account_name: { type: "string" },
              credit_account_code: { type: "string" },
              credit_account_name: { type: "string" },
              description: { type: "string", description: "Histórico contábil sugerido" },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              reasoning: { type: "string", description: "Explicação do lançamento" }
            },
            required: ["debit_account_code", "debit_account_name", "credit_account_code", "credit_account_name", "description", "confidence", "reasoning"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("IA não retornou resposta válida");

    return JSON.parse(content);

  } catch (error) {
    console.error("Erro na sugestão de lançamento:", error);
    return {
      debit_account_code: "",
      debit_account_name: "",
      credit_account_code: "",
      credit_account_name: "",
      description: description,
      confidence: "low",
      reasoning: "Erro ao processar com IA"
    };
  }
}
