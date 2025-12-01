import { getDb } from "./db";
import { accountsPayable } from "../drizzle/schema";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";

/**
 * Módulo de Melhorias para Contas a Pagar
 * Métricas, cartões de status e pagamento em massa
 */

export interface AccountsPayableMetrics {
  // Totais gerais
  totalAmount: number; // Valor total de todas as contas
  paidAmount: number; // Valor já pago
  pendingAmount: number; // Valor pendente (em aberto)
  
  // Contadores por status
  overdueCount: number; // Vencidas
  dueTodayCount: number; // Vencendo hoje
  upcomingCount: number; // A vencer (próximos 7 dias)
  paidCount: number; // Pagas
  
  // Valores por status
  overdueAmount: number;
  dueTodayAmount: number;
  upcomingAmount: number;
}

/**
 * Calcular métricas de contas a pagar
 */
export async function getAccountsPayableMetrics(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AccountsPayableMetrics> {
  const db = await getDb();
  if (!db) {
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueCount: 0,
      dueTodayCount: 0,
      upcomingCount: 0,
      paidCount: 0,
      overdueAmount: 0,
      dueTodayAmount: 0,
      upcomingAmount: 0,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(accountsPayable.dueDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(accountsPayable.dueDate, filters.endDate));
  }

  // Buscar todas as contas
  const allAccounts = await db
    .select()
    .from(accountsPayable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Calcular métricas
  const metrics: AccountsPayableMetrics = {
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    upcomingCount: 0,
    paidCount: 0,
    overdueAmount: 0,
    dueTodayAmount: 0,
    upcomingAmount: 0,
  };

  for (const account of allAccounts) {
    metrics.totalAmount += account.amount;

    if (account.status === "pago") {
      metrics.paidAmount += account.amount;
      metrics.paidCount++;
    } else if (account.status === "pendente") {
      metrics.pendingAmount += account.amount;

      const dueDate = new Date(account.dueDate);
      
      // Vencidas (antes de hoje)
      if (dueDate < today) {
        metrics.overdueCount++;
        metrics.overdueAmount += account.amount;
      }
      // Vencendo hoje
      else if (dueDate >= today && dueDate < tomorrow) {
        metrics.dueTodayCount++;
        metrics.dueTodayAmount += account.amount;
      }
      // A vencer (próximos 7 dias)
      else if (dueDate >= tomorrow && dueDate < sevenDaysFromNow) {
        metrics.upcomingCount++;
        metrics.upcomingAmount += account.amount;
      }
    }
  }

  return metrics;
}

/**
 * Buscar contas por categoria de status
 */
export async function getAccountsByStatusCategory(category: "overdue" | "dueToday" | "upcoming" | "paid") {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  let conditions;

  switch (category) {
    case "overdue":
      // Pendentes e vencidas (antes de hoje)
      conditions = and(
        eq(accountsPayable.status, "pendente"),
        sql`${accountsPayable.dueDate} < ${today.toISOString().split('T')[0]}`
      );
      break;

    case "dueToday":
      // Pendentes e vencendo hoje
      conditions = and(
        eq(accountsPayable.status, "pendente"),
        sql`DATE(${accountsPayable.dueDate}) = ${today.toISOString().split('T')[0]}`
      );
      break;

    case "upcoming":
      // Pendentes e a vencer nos próximos 7 dias (excluindo hoje)
      conditions = and(
        eq(accountsPayable.status, "pendente"),
        sql`${accountsPayable.dueDate} >= ${tomorrow.toISOString().split('T')[0]}`,
        sql`${accountsPayable.dueDate} < ${sevenDaysFromNow.toISOString().split('T')[0]}`
      );
      break;

    case "paid":
      // Pagas
      conditions = eq(accountsPayable.status, "pago");
      break;

    default:
      return [];
  }

  const results = await db
    .select()
    .from(accountsPayable)
    .where(conditions)
    .orderBy(accountsPayable.dueDate);

  return results;
}

/**
 * Pagamento em massa de contas
 */
export async function payAccountsInBulk(accountIds: number[], paymentDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (accountIds.length === 0) {
    throw new Error("Nenhuma conta selecionada para pagamento");
  }

  const payDate = paymentDate || new Date();

  // Atualizar todas as contas selecionadas
  await db
    .update(accountsPayable)
    .set({
      status: "pago",
      paymentDate: payDate,
    })
    .where(inArray(accountsPayable.id, accountIds));

  return {
    success: true,
    count: accountIds.length,
    paymentDate: payDate,
  };
}

/**
 * Buscar detalhes de contas para pagamento em massa
 */
export async function getAccountsForBulkPayment(accountIds: number[]) {
  const db = await getDb();
  if (!db) return [];

  const accounts = await db
    .select()
    .from(accountsPayable)
    .where(inArray(accountsPayable.id, accountIds));

  return accounts;
}

/**
 * Calcular total de contas selecionadas
 */
export async function calculateBulkPaymentTotal(accountIds: number[]) {
  const accounts = await getAccountsForBulkPayment(accountIds);
  
  const total = accounts.reduce((sum, account) => sum + account.amount, 0);
  const count = accounts.length;

  return {
    total,
    count,
    accounts: accounts.map(acc => ({
      id: acc.id,
      description: acc.description,
      amount: acc.amount,
      dueDate: acc.dueDate,
      supplier: acc.supplier,
    })),
  };
}
