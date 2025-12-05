import { postSaleToAccounting } from "./accountingEngine";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

/**
 * Integração NF-e com Contabilidade
 * Dispara posting automático após emissão de NF-e
 */

interface NFeIssuanceResult {
  success: boolean;
  nfeId: number;
  nfeNumber: string;
  saleId: number;
  message: string;
  accountingPosting?: {
    postingId: number;
    postingNumber: string;
  };
  error?: string;
}

/**
 * Callback executado após emissão bem-sucedida de NF-e
 * Dispara contabilização automática
 */
export async function onNFeIssued(
  nfeId: number,
  saleId: number,
  tenantId: number,
  userId: number
): Promise<NFeIssuanceResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      nfeId,
      saleId,
      nfeNumber: "",
      message: "Erro: Banco de dados não disponível",
      error: "Database not available",
    };
  }

  try {
    // 1. Buscar dados da NF-e
    const nfe = await db.query.nfe_issuances.findFirst({
      where: eq(db.schema.nfe_issuances.id, nfeId),
    });

    if (!nfe) {
      return {
        success: false,
        nfeId,
        saleId,
        nfeNumber: "",
        message: "Erro: NF-e não encontrada",
        error: "NF-e not found",
      };
    }

    // 2. Verificar se já foi contabilizada
    const existingPosting = await db.query.accounting_postings.findFirst({
      where: eq(db.schema.accounting_postings.reference_id, saleId),
    });

    if (existingPosting) {
      return {
        success: false,
        nfeId,
        saleId,
        nfeNumber: nfe.nfe_number || "",
        message: "Erro: Venda já foi contabilizada",
        error: "Sale already posted",
      };
    }

    // 3. Contabilizar a venda
    const accountingResult = await postSaleToAccounting(
      saleId,
      nfeId,
      userId,
      tenantId
    );

    if (!accountingResult.success) {
      return {
        success: false,
        nfeId,
        saleId,
        nfeNumber: nfe.nfe_number || "",
        message: `Erro ao contabilizar: ${accountingResult.error}`,
        error: accountingResult.error,
      };
    }

    // 4. Atualizar status da NF-e para "contabilizada"
    await db
      .update(db.schema.nfe_issuances)
      .set({
        status: "posted",
        posted_at: new Date(),
      })
      .where(eq(db.schema.nfe_issuances.id, nfeId));

    // 5. Registrar log de auditoria
    await logAccountingEvent(
      tenantId,
      "nfe_posted",
      `NF-e ${nfe.nfe_number} contabilizada. Lançamento: ${accountingResult.postingNumber}`,
      saleId,
      userId
    );

    return {
      success: true,
      nfeId,
      saleId,
      nfeNumber: nfe.nfe_number || "",
      message: `NF-e contabilizada com sucesso. Lançamento: ${accountingResult.postingNumber}`,
      accountingPosting: {
        postingId: accountingResult.postingId,
        postingNumber: accountingResult.postingNumber,
      },
    };
  } catch (error) {
    console.error("Erro ao processar NF-e para contabilidade:", error);

    // Registrar erro em log
    await logAccountingEvent(
      tenantId,
      "nfe_posting_error",
      `Erro ao contabilizar NF-e: ${(error as Error).message}`,
      saleId,
      userId
    );

    return {
      success: false,
      nfeId,
      saleId,
      nfeNumber: "",
      message: `Erro ao contabilizar: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}

/**
 * Registra eventos de contabilidade para auditoria
 */
async function logAccountingEvent(
  tenantId: number,
  eventType: string,
  description: string,
  referenceId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    // Criar tabela de logs se não existir
    await db.execute(`
      CREATE TABLE IF NOT EXISTS accounting_audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        description TEXT,
        reference_id INT,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Inserir log
    await db.execute(
      `INSERT INTO accounting_audit_logs (tenant_id, event_type, description, reference_id, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [tenantId, eventType, description, referenceId, userId]
    );
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}

/**
 * Valida se uma venda pode ser contabilizada
 */
export async function validateSaleForAccounting(
  saleId: number,
  tenantId: number
): Promise<{ valid: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return {
      valid: false,
      message: "Banco de dados não disponível",
    };
  }

  try {
    // Buscar venda
    const sale = await db.query.sales.findFirst({
      where: eq(db.schema.sales.id, saleId),
      with: {
        customer: true,
        items: true,
      },
    });

    if (!sale) {
      return {
        valid: false,
        message: "Venda não encontrada",
      };
    }

    // Validar cliente
    if (!sale.customerId) {
      return {
        valid: false,
        message: "Venda sem cliente identificado",
      };
    }

    // Validar itens
    if (!sale.items || sale.items.length === 0) {
      return {
        valid: false,
        message: "Venda sem itens",
      };
    }

    // Validar valor
    if (sale.totalAmount <= 0) {
      return {
        valid: false,
        message: "Venda com valor inválido",
      };
    }

    // Validar se já foi contabilizada
    const existingPosting = await db.query.accounting_postings.findFirst({
      where: eq(db.schema.accounting_postings.reference_id, saleId),
    });

    if (existingPosting) {
      return {
        valid: false,
        message: "Venda já foi contabilizada",
      };
    }

    return {
      valid: true,
      message: "Venda válida para contabilização",
    };
  } catch (error) {
    return {
      valid: false,
      message: `Erro ao validar venda: ${(error as Error).message}`,
    };
  }
}

/**
 * Retorna status de contabilização de uma venda
 */
export async function getSaleAccountingStatus(saleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const posting = await db.query.accounting_postings.findFirst({
    where: eq(db.schema.accounting_postings.reference_id, saleId),
  });

  if (!posting) {
    return {
      isPosted: false,
      postingNumber: null,
      postingDate: null,
      status: "pending",
    };
  }

  return {
    isPosted: true,
    postingNumber: posting.posting_number,
    postingDate: posting.posting_date,
    status: posting.status,
  };
}

/**
 * Reverte uma contabilização (apenas para casos especiais)
 * Requer autorização especial
 */
export async function reverseAccountingPosting(
  postingId: number,
  reason: string,
  userId: number,
  tenantId: number
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Banco de dados não disponível",
    };
  }

  try {
    // Buscar lançamento original
    const posting = await db.query.accounting_postings.findFirst({
      where: eq(db.schema.accounting_postings.id, postingId),
    });

    if (!posting) {
      return {
        success: false,
        message: "Lançamento não encontrado",
      };
    }

    if (posting.status === "reversed") {
      return {
        success: false,
        message: "Lançamento já foi revertido",
      };
    }

    // Criar lançamento reverso
    const reversePostingNumber = `${posting.posting_number}-REV`;

    // Buscar linhas do lançamento original
    const lines = await db.query.accounting_posting_lines.findMany({
      where: eq(db.schema.accounting_posting_lines.posting_id, postingId),
    });

    // Inserir lançamento reverso com débitos e créditos invertidos
    const [reverseResult] = await db
      .insert(db.schema.accounting_postings)
      .values({
        tenant_id: tenantId,
        posting_date: new Date(),
        posting_number: reversePostingNumber,
        reference_type: posting.reference_type,
        reference_id: posting.reference_id,
        reference_document: `Reversão de ${posting.posting_number}`,
        description: `Reversão: ${reason}`,
        status: "posted",
        posted_by: userId,
        posted_at: new Date(),
      });

    const reversePostingId = Number(reverseResult.insertId);

    // Inserir linhas reversas
    for (const line of lines) {
      await db
        .insert(db.schema.accounting_posting_lines)
        .values({
          posting_id: reversePostingId,
          account_id: line.account_id,
          debit_amount: line.credit_amount, // Inverter
          credit_amount: line.debit_amount, // Inverter
          description: `Reversão: ${line.description}`,
        });
    }

    // Marcar lançamento original como revertido
    await db
      .update(db.schema.accounting_postings)
      .set({
        status: "reversed",
      })
      .where(eq(db.schema.accounting_postings.id, postingId));

    // Registrar log
    await logAccountingEvent(
      tenantId,
      "posting_reversed",
      `Lançamento ${posting.posting_number} revertido. Motivo: ${reason}`,
      posting.reference_id,
      userId
    );

    return {
      success: true,
      message: `Lançamento revertido com sucesso. Lançamento reverso: ${reversePostingNumber}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao reverter lançamento: ${(error as Error).message}`,
    };
  }
}
