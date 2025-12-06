import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { chart_of_accounts, accounting_postings, accounting_posting_lines } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Helper para procedimentos protegidos
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const accountingRouter = router({
  // ============= PLANO DE CONTAS =============
  
  getChartOfAccounts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const accounts = await db.select().from(chart_of_accounts)
      .where(eq(chart_of_accounts.tenant_id, ctx.user.tenantId))
      .orderBy(chart_of_accounts.account_code);

    return accounts;
  }),

  createAccount: protectedProcedure
    .input(z.object({
      account_code: z.string(),
      account_name: z.string(),
      account_type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
      parent_account_id: z.number().optional(),
      is_analytical: z.boolean().default(true),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar duplicidade de código
      const existing = await db.query.chart_of_accounts.findFirst({
        where: and(
          eq(chart_of_accounts.tenant_id, ctx.user.tenantId),
          eq(chart_of_accounts.account_code, input.account_code)
        ),
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Código de conta já existe" });
      }

      const [result] = await db.insert(chart_of_accounts).values({
        tenant_id: ctx.user.tenantId,
        ...input,
      });

      return { success: true, id: result.insertId };
    }),

  updateAccount: protectedProcedure
    .input(z.object({
      id: z.number(),
      account_name: z.string(),
      account_type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
      is_analytical: z.boolean(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(chart_of_accounts)
        .set({
          account_name: input.account_name,
          account_type: input.account_type,
          is_analytical: input.is_analytical,
          description: input.description,
        })
        .where(and(
          eq(chart_of_accounts.id, input.id),
          eq(chart_of_accounts.tenant_id, ctx.user.tenantId)
        ));

      return { success: true };
    }),

  deleteAccount: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se tem lançamentos
      // TODO: Implementar verificação de uso

      await db.delete(chart_of_accounts)
        .where(and(
          eq(chart_of_accounts.id, input),
          eq(chart_of_accounts.tenant_id, ctx.user.tenantId)
        ));

      return { success: true };
    }),

  // ============= LANÇAMENTOS CONTÁBEIS =============

  getPostings: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar lançamentos
      const postings = await db.query.accounting_postings.findMany({
        where: eq(accounting_postings.tenant_id, ctx.user.tenantId),
        orderBy: [desc(accounting_postings.posting_date)],
        limit: input.limit,
        with: {
          // Precisaria configurar relations no schema para trazer as linhas
        }
      });

      // Como relations não estão configuradas no schema principal para accounting,
      // vamos buscar as linhas manualmente ou apenas retornar os cabeçalhos por enquanto
      
      return postings;
    }),

  createPosting: protectedProcedure
    .input(z.object({
      posting_date: z.string(), // YYYY-MM-DD
      description: z.string(),
      lines: z.array(z.object({
        account_id: z.number(),
        debit_amount: z.number(),
        credit_amount: z.number(),
        description: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Validar partidas dobradas
      const totalDebit = input.lines.reduce((sum, line) => sum + line.debit_amount, 0);
      const totalCredit = input.lines.reduce((sum, line) => sum + line.credit_amount, 0);

      if (totalDebit !== totalCredit) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `Partidas dobradas inválidas. Débito: ${totalDebit}, Crédito: ${totalCredit}` 
        });
      }

      // Gerar número do lançamento
      const dateStr = input.posting_date.replace(/-/g, "");
      const postingNumber = `${dateStr}-${Date.now().toString().slice(-6)}`;

      // Criar cabeçalho
      const [postingResult] = await db.insert(accounting_postings).values({
        tenant_id: ctx.user.tenantId,
        posting_date: input.posting_date, // Assumindo que o driver aceita string YYYY-MM-DD para date
        posting_number: postingNumber,
        reference_type: "adjustment", // Lançamento manual
        description: input.description,
        status: "posted",
        posted_by: ctx.user.id,
        posted_at: new Date(),
      });

      const postingId = postingResult.insertId;

      // Criar linhas
      for (const line of input.lines) {
        await db.insert(accounting_posting_lines).values({
          posting_id: postingId,
          account_id: line.account_id,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          description: line.description || input.description,
        });
      }

      return { success: true, postingId };
    }),

  // ============= RELATÓRIOS =============

  getTrialBalance: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Query complexa para somar débitos e créditos por conta
      // Por simplificação, vamos buscar todas as contas e calcular via JS ou fazer query raw depois
      
      const accounts = await db.select().from(chart_of_accounts)
        .where(eq(chart_of_accounts.tenant_id, ctx.user.tenantId));

      // TODO: Implementar lógica real de saldo
      // Retornando mock por enquanto para estrutura da UI
      return accounts.map(acc => ({
        ...acc,
        initial_balance: 0,
        debits: 0,
        credits: 0,
        final_balance: 0
      }));
    }),
});
