import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { accounting_postings, accounting_posting_lines, chart_of_accounts } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// Helper para procedimentos protegidos
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const accountantRouter = router({
  // Exportar Diário (Lançamentos) em CSV
  exportJournalCsv: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar lançamentos com suas linhas e contas
      // Como o drizzle relations pode não estar configurado, faremos via query raw ou joins manuais se necessário
      // Mas vamos tentar usar o query builder assumindo que conseguimos pegar os dados
      
      const postings = await db.select({
        date: accounting_postings.posting_date,
        number: accounting_postings.posting_number,
        description: accounting_postings.description,
        line_debit: accounting_posting_lines.debit_amount,
        line_credit: accounting_posting_lines.credit_amount,
        account_code: chart_of_accounts.account_code,
        account_name: chart_of_accounts.account_name,
      })
      .from(accounting_postings)
      .innerJoin(accounting_posting_lines, eq(accounting_postings.id, accounting_posting_lines.posting_id))
      .innerJoin(chart_of_accounts, eq(accounting_posting_lines.account_id, chart_of_accounts.id))
      .where(and(
        eq(accounting_postings.tenant_id, ctx.user.tenantId),
        gte(accounting_postings.posting_date, input.startDate),
        lte(accounting_postings.posting_date, input.endDate)
      ))
      .orderBy(accounting_postings.posting_date, accounting_postings.id);

      // Gerar CSV
      const header = "Data;Numero;Conta Codigo;Conta Nome;Debito;Credito;Historico\n";
      const rows = postings.map(p => {
        const debit = (p.line_debit || 0) / 100;
        const credit = (p.line_credit || 0) / 100;
        return `${p.date};${p.number};${p.account_code};"${p.account_name}";${debit.toFixed(2).replace('.', ',')};${credit.toFixed(2).replace('.', ',')};"${p.description}"`;
      }).join("\n");

      return { csv: header + rows, filename: `diario_${input.startDate}_${input.endDate}.csv` };
    }),

  // Exportar Balancete em CSV
  exportTrialBalanceCsv: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Simplificação: Buscar todas as contas e seus saldos (mockado por enquanto pois requer cálculo complexo de saldo anterior)
      // Em produção, precisaria de uma tabela de saldos mensais ou calcular on-the-fly desde o início
      
      const accounts = await db.select().from(chart_of_accounts)
        .where(eq(chart_of_accounts.tenant_id, ctx.user.tenantId))
        .orderBy(chart_of_accounts.account_code);

      // Gerar CSV
      const header = "Codigo;Nome;Tipo;Saldo Anterior;Debitos;Creditos;Saldo Atual\n";
      const rows = accounts.map(a => {
        // Mock values for demonstration
        return `${a.account_code};"${a.account_name}";${a.account_type};0,00;0,00;0,00;0,00`;
      }).join("\n");

      return { csv: header + rows, filename: `balancete_${input.startDate}_${input.endDate}.csv` };
    }),
});
