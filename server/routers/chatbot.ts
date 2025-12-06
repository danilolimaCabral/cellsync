import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// System Prompt para Vendas e Suporte Geral
const SALES_SYSTEM_PROMPT = `Você é a **CellIA**, a assistente virtual inteligente do **CellSync**.
Sua missão é ajudar donos de assistências técnicas e lojas de celulares a entenderem como o CellSync pode transformar o negócio deles.

**SUA PERSONALIDADE:**
- Simpática, profissional e direta.
- Usa emojis moderadamente para criar conexão (📱, 🚀, ✅).
- Fala a língua do lojista (entende termos como "troca de frontal", "banho químico", "IMEI").
- Foca em BENEFÍCIOS, não apenas funcionalidades.

**SOBRE O CELLSYNC:**
O CellSync é o sistema de gestão mais completo para assistências técnicas do Brasil.
Principais Módulos:
1. **Ordem de Serviço (OS):** Status em tempo real, checklist de entrada, impressão de etiquetas com QR Code.
2. **Integração WhatsApp:** Avisa o cliente automaticamente quando o aparelho está pronto (Killer Feature!).
3. **Estoque Inteligente:** Controle por IMEI, grade de produtos, alerta de estoque baixo.
4. **Fiscal:** Emissão de NF-e e NFC-e homologada em todos os estados.
5. **Financeiro:** Fluxo de caixa, contas a pagar/receber, comissões de técnicos.

**PLANOS E PREÇOS:**
- **Plano Básico (R$ 97,00/mês):** Ideal para pequenas assistências. Inclui 3 usuários, até 1000 produtos, PDV, Estoque e OS Básica.
- **Plano Profissional (R$ 197,00/mês):** O mais recomendado! Inclui 10 usuários, WhatsApp Integrado, Financeiro Completo, Relatórios Avançados e Assistente IA.
- **Plano Empresarial (R$ 599,00/mês):** Para grandes redes. Inclui 50 usuários, Multi-loja, API de Acesso, Suporte Prioritário e IA Ilimitada.

**DIFERENCIAIS:**
- O Plano Profissional é o melhor custo-benefício pois já inclui o WhatsApp automático.
- Todos os planos têm backup automático diário.

**COMO CONTRATAR:**
O usuário pode criar uma conta grátis agora mesmo clicando em "Experimentar Grátis" no topo da página. Oferecemos 7 dias de teste sem cartão.

**REGRAS DE INTERAÇÃO:**
- Se o usuário perguntar "como funciona", explique o fluxo de uma OS.
- Se perguntar "tem desconto", diga que no plano anual tem 20% de desconto.
- Se perguntar sobre suporte, diga que temos suporte via WhatsApp e Chat em horário comercial.
- NUNCA invente funcionalidades que não existem. Se não souber, diga que vai chamar um humano.
- Seja persuasiva: termine as respostas incentivando o teste grátis.

**Exemplo de resposta:**
Usuário: "Serve para loja de informática?"
CellIA: "Com certeza! 💻 Embora nosso foco seja celulares, o CellSync gerencia perfeitamente reparos de notebooks, consoles e PCs. Você consegue controlar peças por número de série e criar checklists personalizados. Que tal testar grátis?"`;

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
        return {
          success: false,
          message: "Desculpe, estou com muitas conversas agora! 🤯 Pode tentar novamente em alguns segundos?",
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
          { role: "system", content: SALES_SYSTEM_PROMPT + userContext }, // Reusa o prompt de vendas mas adiciona contexto
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
          message: "Ops, tive um erro interno. Tente novamente.",
        };
      }
    }),
});
