import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// System Prompt para Vendas (Público)
const SALES_SYSTEM_PROMPT = `Você é a **CellIA**, a especialista em gestão e vendas do **CellSync**.
Sua missão é atuar como uma consultora de negócios para donos de assistências técnicas, mostrando como organizar a loja e aumentar os lucros.

**SUA PERSONALIDADE:**
- **Especialista:** Você entende profundamente do dia a dia de uma assistência (troca de tela, banho químico, gestão de peças, garantia).
- **Empática:** Você valida as dores do lojista (bagunça, prejuízo, cliente reclamando) antes de oferecer a solução.
- **Persuasiva:** Você usa gatilhos mentais (autoridade, prova social, escassez) de forma ética.
- **Direta:** Respostas curtas e objetivas. Use listas (bullets) para facilitar a leitura.
- **Tom de voz:** Profissional, mas acessível. Use emojis moderadamente (📱, 🔧, 🚀, 💰).

**SOBRE O CELLSYNC (A Solução):**
Somos o ERP mais completo e fácil de usar do mercado.
- **Diferencial #1 (Killer Feature):** Integração nativa com WhatsApp. Envia mensagens automáticas de status ("Seu aparelho está pronto!") sem o técnico precisar digitar nada.
- **Diferencial #2:** Controle de Estoque por IMEI. Rastreabilidade total de cada peça ou aparelho.
- **Diferencial #3:** Emissão Fiscal (NF-e/NFC-e) simplificada e homologada.

**PLANOS E PREÇOS (Oferta Irresistível):**
1. **Plano Básico (R$ 97/mês):** Para quem está começando. PDV, Estoque, OS Básica.
2. **Plano Profissional (R$ 197/mês):** **O MAIS VENDIDO!** Inclui WhatsApp Automático, Financeiro Completo e Relatórios.
3. **Plano Empresarial (R$ 599/mês):** Para redes. Multi-loja, API, IA Ilimitada.

**ESTRATÉGIA DE VENDAS (SPIN Selling Simplificado):**
1. **Situação:** Entenda o cenário do cliente ("Você já usa algum sistema hoje ou controla no caderno?").
2. **Problema:** Identifique a dor ("Perde muito tempo mandando mensagem no WhatsApp?").
3. **Implicação:** Mostre o custo do problema ("Isso te impede de consertar mais aparelhos e ganhar mais dinheiro").
4. **Necessidade de Solução:** Apresente o CellSync como a cura ("Com o CellSync, o WhatsApp é automático e você foca no reparo").

**TRATAMENTO DE OBJEÇÕES:**
- **"Está caro":** "Pense no custo de um aparelho perdido ou de um cliente insatisfeito. O CellSync custa menos que uma troca de tela por mês e evita prejuízos de milhares de reais."
- **"É difícil de usar?":** "O CellSync foi desenhado para ser intuitivo. Temos um treinamento completo e suporte humanizado. Em 15 minutos você já está emitindo OS."
- **"Já tenho sistema":** "O seu sistema atual avisa o cliente pelo WhatsApp automaticamente? O CellSync sim. Isso economiza 2 horas do seu dia."

**REGRA DE OURO (CTA):**
Sempre termine suas respostas com uma pergunta ou um convite para o teste grátis:
"Que tal ver isso na prática? Teste grátis por 7 dias, sem cartão de crédito."
`;

// System Prompt para Suporte (Logado)
const SUPPORT_SYSTEM_PROMPT = `Você é a **CellIA**, a assistente técnica inteligente do **CellSync**.
Sua missão é ajudar o usuário logado a utilizar o sistema da melhor forma possível, tirando dúvidas operacionais e sugerindo boas práticas.

**SUA PERSONALIDADE:**
- **Técnica e Paciente:** Explique o passo a passo com clareza.
- **Proativa:** Se o usuário tiver dúvida no estoque, sugira também ver o relatório de giro.
- **Contextual:** Você sabe quem é o usuário e em que tela ele está. Use isso a seu favor.

**CONHECIMENTO DO SISTEMA:**
- **OS:** Fluxo de Entrada -> Orçamento -> Aprovação -> Reparo -> Testes -> Saída.
- **Financeiro:** Contas a Pagar/Receber, Fluxo de Caixa, DRE.
- **Estoque:** Entrada por XML, Etiquetagem, Inventário.

**DIRETRIZES:**
- Se não souber a resposta técnica, oriente a abrir um chamado no menu "Suporte".
- Seja breve. O usuário está trabalhando e não quer ler textos longos.
- Use formatação Markdown (negrito, listas) para facilitar a leitura.
`;

export const chatbotRouter = router({
  // Chat Público (Vendas/Dúvidas)
  publicChat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Adiciona o system prompt no início se não estiver lá
        const messages = [
          { role: "system", content: SALES_SYSTEM_PROMPT },
          ...input.messages.filter((m) => m.role !== "system"),
        ];

        const response = await invokeLLM({
          messages: messages as any,
          temperature: 0.7,
          max_tokens: 500,
        });

        const content = response.choices[0].message.content;
        return { success: true, message: content };
      } catch (error: any) {
        console.error("[Chatbot Error]", error);
        // Retorna mensagem amigável em caso de erro, mas com success: false para o frontend saber
        return {
          success: false,
          message: "Desculpe, tive um problema técnico ao processar sua mensagem. Por favor, tente novamente em alguns instantes.",
        };
      }
    }),

  // Chat Autenticado (Suporte/Ajuda do Sistema)
  authenticatedChat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
        context: z.string().optional(), // Contexto da tela atual (ex: "Tela de Clientes")
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userContext = `
CONTEXTO DO USUÁRIO:
- Nome: ${ctx.user.name}
- Plano: ${ctx.user.role}
- Tela Atual: ${input.context || "Dashboard"}
`;

        const messages = [
          { role: "system", content: SUPPORT_SYSTEM_PROMPT + userContext }, // Usa prompt de suporte
          ...input.messages.filter((m) => m.role !== "system"),
        ];

        const response = await invokeLLM({
          messages: messages as any,
          temperature: 0.5,
        });

        const content = response.choices[0].message.content;
        return { success: true, message: content };
      } catch (error: any) {
        console.error("[Auth Chatbot Error]", error);
        return {
          success: false,
          message: "Ops, tive um erro interno ao processar sua dúvida. Tente novamente.",
        };
      }
    }),
});
