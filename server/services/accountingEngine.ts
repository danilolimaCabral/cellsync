import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  sales,
  saleItems,
  customers,
  products,
} from "../drizzle/schema";

/**
 * Engine de Contabilização Automática
 * Responsável por gerar lançamentos contábeis após emissão de NF-e
 */

interface PostingLine {
  accountId: number;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

interface AccountingPosting {
  tenantId: number;
  postingDate: Date;
  postingNumber: string;
  referenceType: "sale" | "purchase" | "payment" | "receipt" | "adjustment";
  referenceId: number;
  referenceDocument: string;
  description: string;
  lines: PostingLine[];
}

/**
 * Gera número de lançamento único
 */
export async function generatePostingNumber(tenantId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar o último lançamento do dia
  const today = new Date().toISOString().split("T")[0];
  const lastPosting = await db.query.accounting_postings.findFirst({
    where: and(
      eq(db.schema.accounting_postings.tenant_id, tenantId),
      eq(db.schema.accounting_postings.posting_date, today)
    ),
    orderBy: (postings) => [desc(postings.id)],
  });

  const sequence = lastPosting ? parseInt(lastPosting.posting_number.split("-")[1]) + 1 : 1;
  return `${today.replace(/-/g, "")}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Calcula impostos sobre a venda
 */
export async function calculateTaxes(
  saleId: number,
  totalAmount: number,
  tenantId: number
) {
  const icmsRate = 0.18; // 18%
  const pisRate = 0.0165; // 1.65%
  const cofinsRate = 0.076; // 7.6%

  const icmsAmount = Math.round(totalAmount * icmsRate);
  const pisAmount = Math.round(totalAmount * pisRate);
  const cofinsAmount = Math.round(totalAmount * cofinsRate);

  return {
    icms: {
      type: "icms",
      base: totalAmount,
      rate: icmsRate,
      amount: icmsAmount,
    },
    pis: {
      type: "pis",
      base: totalAmount,
      rate: pisRate,
      amount: pisAmount,
    },
    cofins: {
      type: "cofins",
      base: totalAmount,
      rate: cofinsRate,
      amount: cofinsAmount,
    },
  };
}

/**
 * Busca o template de posting para um tipo de transação
 */
export async function getPostingTemplate(
  tenantId: number,
  templateType: "sale" | "sale_return" | "payment" | "receipt"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const template = await db.query.posting_templates.findFirst({
    where: and(
      eq(db.schema.posting_templates.tenant_id, tenantId),
      eq(db.schema.posting_templates.template_type, templateType),
      eq(db.schema.posting_templates.is_active, true)
    ),
    with: {
      lines: {
        orderBy: (lines) => [asc(lines.line_number)],
      },
    },
  });

  return template;
}

/**
 * Gera linhas de lançamento baseado no template
 */
export async function generatePostingLines(
  template: any,
  totalAmount: number,
  taxes: any
): Promise<PostingLine[]> {
  const lines: PostingLine[] = [];

  for (const templateLine of template.lines) {
    const debitAmount = Math.round((totalAmount * templateLine.debit_percentage) / 100);
    const creditAmount = Math.round((totalAmount * templateLine.credit_percentage) / 100);

    if (debitAmount > 0 || creditAmount > 0) {
      lines.push({
        accountId: templateLine.account_id,
        debitAmount,
        creditAmount,
        description: templateLine.description_template,
      });
    }
  }

  // Adicionar linhas de impostos
  if (taxes.icms.amount > 0) {
    lines.push({
      accountId: await getAccountIdByCode("5.1.1.01.01", template.tenant_id), // ICMS sobre Vendas
      debitAmount: taxes.icms.amount,
      creditAmount: 0,
      description: "ICMS sobre Vendas",
    });

    lines.push({
      accountId: await getAccountIdByCode("2.1.2.01.01", template.tenant_id), // ICMS a Pagar
      debitAmount: 0,
      creditAmount: taxes.icms.amount,
      description: "ICMS a Pagar",
    });
  }

  return lines;
}

/**
 * Busca ID da conta pelo código
 */
export async function getAccountIdByCode(
  accountCode: string,
  tenantId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const account = await db.query.chart_of_accounts.findFirst({
    where: and(
      eq(db.schema.chart_of_accounts.account_code, accountCode),
      eq(db.schema.chart_of_accounts.tenant_id, tenantId)
    ),
  });

  if (!account) {
    throw new Error(`Conta ${accountCode} não encontrada para tenant ${tenantId}`);
  }

  return account.id;
}

/**
 * Cria um lançamento contábil no banco de dados
 */
export async function createAccounting Posting(
  posting: AccountingPosting,
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar que débito = crédito
  const totalDebit = posting.lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const totalCredit = posting.lines.reduce((sum, line) => sum + line.creditAmount, 0);

  if (totalDebit !== totalCredit) {
    throw new Error(
      `Lançamento desbalanceado: Débito ${totalDebit} ≠ Crédito ${totalCredit}`
    );
  }

  // Inserir lançamento principal
  const [postingResult] = await db
    .insert(db.schema.accounting_postings)
    .values({
      tenant_id: posting.tenantId,
      posting_date: posting.postingDate,
      posting_number: posting.postingNumber,
      reference_type: posting.referenceType,
      reference_id: posting.referenceId,
      reference_document: posting.referenceDocument,
      description: posting.description,
      status: "posted",
      posted_by: userId,
      posted_at: new Date(),
    });

  const postingId = Number(postingResult.insertId);

  // Inserir linhas do lançamento
  for (const line of posting.lines) {
    await db
      .insert(db.schema.accounting_posting_lines)
      .values({
        posting_id: postingId,
        account_id: line.accountId,
        debit_amount: line.debitAmount,
        credit_amount: line.creditAmount,
        description: line.description,
      });
  }

  return postingId;
}

/**
 * Registra a venda no módulo financeiro
 */
export async function recordSaleInFinancial(
  saleId: number,
  nfeId: number,
  totalAmount: number,
  paymentMethod: string,
  tenantId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const recordType = paymentMethod === "dinheiro" ? "revenue" : "receivable";
  const dueDate = paymentMethod === "dinheiro" ? new Date() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  await db
    .insert(db.schema.financial_records)
    .values({
      tenant_id: tenantId,
      sale_id: saleId,
      nfe_id: nfeId,
      record_type: recordType,
      due_date: dueDate,
      amount: totalAmount,
      status: "pending",
    });
}

/**
 * Contabiliza uma venda após emissão de NF-e
 * Função principal que orquestra todo o processo
 */
export async function postSaleToAccounting(
  saleId: number,
  nfeId: number,
  userId: number,
  tenantId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // 1. Buscar dados da venda
    const sale = await db.query.sales.findFirst({
      where: eq(db.schema.sales.id, saleId),
      with: {
        items: true,
        customer: true,
      },
    });

    if (!sale) {
      throw new Error(`Venda ${saleId} não encontrada`);
    }

    // 2. Calcular impostos
    const taxes = calculateTaxes(saleId, sale.totalAmount, tenantId);

    // 3. Buscar template de posting
    const template = await getPostingTemplate(tenantId, "sale");
    if (!template) {
      throw new Error("Template de posting para vendas não encontrado");
    }

    // 4. Gerar linhas de lançamento
    const lines = await generatePostingLines(template, sale.totalAmount, taxes);

    // 5. Gerar número de lançamento
    const postingNumber = await generatePostingNumber(tenantId);

    // 6. Criar lançamento contábil
    const posting: AccountingPosting = {
      tenantId,
      postingDate: new Date(),
      postingNumber,
      referenceType: "sale",
      referenceId: saleId,
      referenceDocument: `NF-e ${nfeId}`,
      description: `Venda #${saleId} - Cliente: ${sale.customer?.name || "Consumidor"}`,
      lines,
    };

    const postingId = await createAccountingPosting(posting, userId);

    // 7. Registrar no módulo financeiro
    await recordSaleInFinancial(
      saleId,
      nfeId,
      sale.totalAmount,
      sale.paymentMethod,
      tenantId
    );

    // 8. Registrar impostos
    for (const [taxType, taxData] of Object.entries(taxes)) {
      await db
        .insert(db.schema.tax_calculations)
        .values({
          sale_id: saleId,
          tax_type: taxType as any,
          tax_base: (taxData as any).base,
          tax_rate: (taxData as any).rate,
          tax_amount: (taxData as any).amount,
          tax_account_id: await getAccountIdByCode(
            taxType === "icms"
              ? "5.1.1.01.01"
              : taxType === "pis"
              ? "5.1.1.01.02"
              : "5.1.1.01.03",
            tenantId
          ),
        });
    }

    return {
      success: true,
      postingId,
      postingNumber,
      message: `Venda contabilizada com sucesso. Lançamento: ${postingNumber}`,
    };
  } catch (error) {
    console.error("Erro ao contabilizar venda:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Importar desc e asc do drizzle-orm
import { desc, asc } from "drizzle-orm";
