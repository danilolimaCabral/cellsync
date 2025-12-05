import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "../db";

/**
 * Serviço de Relatórios Contábeis
 * Gera relatórios financeiros e contábeis
 */

/**
 * Relatório: Diário Contábil
 * Lista todos os lançamentos em ordem cronológica
 */
export async function getJournalReport(
  tenantId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const postings = await db.query.accounting_postings.findMany({
    where: and(
      eq(db.schema.accounting_postings.tenant_id, tenantId),
      gte(db.schema.accounting_postings.posting_date, startDate),
      lte(db.schema.accounting_postings.posting_date, endDate)
    ),
    with: {
      lines: {
        with: {
          account: true,
        },
      },
      posted_by_user: true,
    },
    orderBy: (postings) => [asc(postings.posting_date)],
  });

  return postings.map((posting) => ({
    postingNumber: posting.posting_number,
    postingDate: posting.posting_date,
    description: posting.description,
    referenceType: posting.reference_type,
    referenceDocument: posting.reference_document,
    lines: posting.lines.map((line) => ({
      accountCode: line.account.account_code,
      accountName: line.account.account_name,
      debit: line.debit_amount,
      credit: line.credit_amount,
    })),
    postedBy: posting.posted_by_user?.name,
    postedAt: posting.posted_at,
  }));
}

/**
 * Relatório: Razão Contábil
 * Mostra saldo de cada conta
 */
export async function getLedgerReport(
  tenantId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const accounts = await db.query.chart_of_accounts.findMany({
    where: and(
      eq(db.schema.chart_of_accounts.tenant_id, tenantId),
      eq(db.schema.chart_of_accounts.is_active, true)
    ),
  });

  const ledger = [];

  for (const account of accounts) {
    const lines = await db.query.accounting_posting_lines.findMany({
      where: eq(db.schema.accounting_posting_lines.account_id, account.id),
      with: {
        posting: true,
      },
    });

    const filteredLines = lines.filter(
      (line) =>
        line.posting.posting_date >= startDate &&
        line.posting.posting_date <= endDate
    );

    const totalDebit = filteredLines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = filteredLines.reduce((sum, line) => sum + line.credit_amount, 0);
    const balance = totalDebit - totalCredit;

    if (totalDebit > 0 || totalCredit > 0 || balance !== 0) {
      ledger.push({
        accountCode: account.account_code,
        accountName: account.account_name,
        accountType: account.account_type,
        debit: totalDebit,
        credit: totalCredit,
        balance,
      });
    }
  }

  return ledger;
}

/**
 * Relatório: Balancete de Verificação
 * Verifica se débitos = créditos
 */
export async function getTrialBalanceReport(
  tenantId: number,
  startDate: Date,
  endDate: Date
) {
  const ledger = await getLedgerReport(tenantId, startDate, endDate);

  const totalDebit = ledger.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = ledger.reduce((sum, line) => sum + line.credit, 0);

  return {
    accounts: ledger,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      isBalanced: totalDebit === totalCredit,
    },
  };
}

/**
 * Relatório: Demonstração de Resultado (DRE)
 * Mostra receitas e despesas do período
 */
export async function getIncomeStatementReport(
  tenantId: number,
  startDate: Date,
  endDate: Date
) {
  const ledger = await getLedgerReport(tenantId, startDate, endDate);

  const revenues = ledger.filter((line) => line.accountType === "receita");
  const expenses = ledger.filter((line) => line.accountType === "despesa");

  const totalRevenues = revenues.reduce((sum, line) => sum + line.credit, 0);
  const totalExpenses = expenses.reduce((sum, line) => sum + line.debit, 0);
  const netIncome = totalRevenues - totalExpenses;

  return {
    revenues: revenues.map((line) => ({
      accountCode: line.accountCode,
      accountName: line.accountName,
      amount: line.credit,
    })),
    totalRevenues,
    expenses: expenses.map((line) => ({
      accountCode: line.accountCode,
      accountName: line.accountName,
      amount: line.debit,
    })),
    totalExpenses,
    netIncome,
    netIncomePercentage: totalRevenues > 0 ? (netIncome / totalRevenues) * 100 : 0,
  };
}

/**
 * Relatório: Balanço Patrimonial
 * Mostra ativo, passivo e patrimônio
 */
export async function getBalanceSheetReport(
  tenantId: number,
  asOfDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todos os lançamentos até a data
  const accounts = await db.query.chart_of_accounts.findMany({
    where: and(
      eq(db.schema.chart_of_accounts.tenant_id, tenantId),
      eq(db.schema.chart_of_accounts.is_active, true)
    ),
  });

  const balanceSheet = {
    assets: [] as any[],
    liabilities: [] as any[],
    equity: [] as any[],
  };

  for (const account of accounts) {
    const lines = await db.query.accounting_posting_lines.findMany({
      where: eq(db.schema.accounting_posting_lines.account_id, account.id),
      with: {
        posting: true,
      },
    });

    const filteredLines = lines.filter((line) => line.posting.posting_date <= asOfDate);

    const totalDebit = filteredLines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = filteredLines.reduce((sum, line) => sum + line.credit_amount, 0);
    const balance = totalDebit - totalCredit;

    if (balance !== 0) {
      const accountInfo = {
        accountCode: account.account_code,
        accountName: account.account_name,
        balance: Math.abs(balance),
      };

      if (account.account_type === "ativo") {
        balanceSheet.assets.push(accountInfo);
      } else if (account.account_type === "passivo") {
        balanceSheet.liabilities.push(accountInfo);
      } else if (account.account_type === "patrimonio") {
        balanceSheet.equity.push(accountInfo);
      }
    }
  }

  const totalAssets = balanceSheet.assets.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = balanceSheet.liabilities.reduce((sum, acc) => sum + acc.balance, 0);
  const totalEquity = balanceSheet.equity.reduce((sum, acc) => sum + acc.balance, 0);

  return {
    asOfDate,
    assets: {
      accounts: balanceSheet.assets,
      total: totalAssets,
    },
    liabilities: {
      accounts: balanceSheet.liabilities,
      total: totalLiabilities,
    },
    equity: {
      accounts: balanceSheet.equity,
      total: totalEquity,
    },
    totals: {
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: totalAssets === totalLiabilities + totalEquity,
    },
  };
}

/**
 * Relatório: Análise de Vendas
 * Mostra vendas por período, cliente, produto
 */
export async function getSalesAnalysisReport(
  tenantId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sales = await db.query.sales.findMany({
    where: and(
      eq(db.schema.sales.tenantId, tenantId),
      gte(db.schema.sales.createdAt, startDate),
      lte(db.schema.sales.createdAt, endDate)
    ),
    with: {
      items: true,
      customer: true,
    },
  });

  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discountAmount, 0);
  const totalFinalAmount = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);

  const averageSale = totalSales > 0 ? totalFinalAmount / totalSales : 0;

  // Vendas por cliente
  const salesByCustomer = {} as Record<string, any>;
  for (const sale of sales) {
    const customerName = sale.customer?.name || "Consumidor";
    if (!salesByCustomer[customerName]) {
      salesByCustomer[customerName] = {
        customerName,
        quantity: 0,
        totalAmount: 0,
        averageAmount: 0,
      };
    }
    salesByCustomer[customerName].quantity++;
    salesByCustomer[customerName].totalAmount += sale.finalAmount;
  }

  for (const customer in salesByCustomer) {
    salesByCustomer[customer].averageAmount =
      salesByCustomer[customer].totalAmount / salesByCustomer[customer].quantity;
  }

  return {
    period: {
      startDate,
      endDate,
    },
    summary: {
      totalSales,
      totalAmount,
      totalDiscount,
      totalFinalAmount,
      averageSale,
    },
    salesByCustomer: Object.values(salesByCustomer),
  };
}

// Importar asc do drizzle-orm
import { asc } from "drizzle-orm";
