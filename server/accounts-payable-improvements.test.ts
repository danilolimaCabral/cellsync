import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import * as apImprovements from "./accounts-payable-improvements";

describe("Melhorias de Contas a Pagar", () => {
  let testUserId: number;
  let testAccountIds: number[] = [];

  beforeAll(async () => {
    // Criar usuário de teste
    const testEmail = `ap-test-${Date.now()}@test.com`;
    await db.createUser({
      email: testEmail,
      password: "test123",
      name: "Test User AP",
      role: "admin",
    });
    
    const user = await db.getUserByEmail(testEmail);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Criar contas de teste com diferentes status
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 5);

    // Conta vencida
    await db.createAccountPayable({
      description: "Conta Vencida Teste",
      amount: 50000,
      dueDate: yesterday,
      createdBy: testUserId,
    });

    // Conta vencendo hoje
    await db.createAccountPayable({
      description: "Conta Vencendo Hoje Teste",
      amount: 100000,
      dueDate: today,
      createdBy: testUserId,
    });

    // Conta a vencer (próximos 7 dias)
    await db.createAccountPayable({
      description: "Conta A Vencer Teste",
      amount: 150000,
      dueDate: nextWeek,
      createdBy: testUserId,
    });

    // Conta paga
    const paidAccount = await db.createAccountPayable({
      description: "Conta Paga Teste",
      amount: 200000,
      dueDate: yesterday,
      createdBy: testUserId,
    });
    
    // Marcar como paga
    const paidAccountId = Number(paidAccount[0].insertId);
    await db.updateAccountPayableStatus(paidAccountId, "pago", today);

    // Buscar todas as contas criadas para usar nos testes
    const allAccounts = await db.listAccountsPayable({});
    testAccountIds = allAccounts
      .filter((acc: any) => acc.description.includes("Teste"))
      .map((acc: any) => acc.id);
  });

  it("deve calcular métricas de contas a pagar", async () => {
    const metrics = await apImprovements.getAccountsPayableMetrics();

    expect(metrics).toHaveProperty("totalAmount");
    expect(metrics).toHaveProperty("paidAmount");
    expect(metrics).toHaveProperty("pendingAmount");
    expect(metrics).toHaveProperty("overdueCount");
    expect(metrics).toHaveProperty("dueTodayCount");
    expect(metrics).toHaveProperty("upcomingCount");
    expect(metrics).toHaveProperty("paidCount");
    
    // Verificar que temos pelo menos as contas de teste
    expect(metrics.overdueCount).toBeGreaterThanOrEqual(1);
    expect(metrics.dueTodayCount).toBeGreaterThanOrEqual(1);
    expect(metrics.upcomingCount).toBeGreaterThanOrEqual(1);
    expect(metrics.paidCount).toBeGreaterThanOrEqual(1);
  });

  it("deve buscar contas vencidas", async () => {
    const overdueAccounts = await apImprovements.getAccountsByStatusCategory("overdue");

    expect(Array.isArray(overdueAccounts)).toBe(true);
    expect(overdueAccounts.length).toBeGreaterThanOrEqual(1);
    
    // Verificar que todas são pendentes e vencidas
    for (const account of overdueAccounts) {
      expect(account.status).toBe("pendente");
      const dueDate = new Date(account.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(dueDate.getTime()).toBeLessThan(today.getTime());
    }
  });

  it("deve buscar contas vencendo hoje", async () => {
    const dueTodayAccounts = await apImprovements.getAccountsByStatusCategory("dueToday");

    expect(Array.isArray(dueTodayAccounts)).toBe(true);
    expect(dueTodayAccounts.length).toBeGreaterThanOrEqual(1);
    
    // Verificar que todas são pendentes e vencem hoje
    for (const account of dueTodayAccounts) {
      expect(account.status).toBe("pendente");
    }
  });

  it("deve buscar contas a vencer (próximos 7 dias)", async () => {
    const upcomingAccounts = await apImprovements.getAccountsByStatusCategory("upcoming");

    expect(Array.isArray(upcomingAccounts)).toBe(true);
    expect(upcomingAccounts.length).toBeGreaterThanOrEqual(1);
    
    // Verificar que todas são pendentes
    for (const account of upcomingAccounts) {
      expect(account.status).toBe("pendente");
    }
  });

  it("deve buscar contas pagas", async () => {
    const paidAccounts = await apImprovements.getAccountsByStatusCategory("paid");

    expect(Array.isArray(paidAccounts)).toBe(true);
    expect(paidAccounts.length).toBeGreaterThanOrEqual(1);
    
    // Verificar que todas estão pagas
    for (const account of paidAccounts) {
      expect(account.status).toBe("pago");
    }
  });

  it("deve calcular total para pagamento em massa", async () => {
    // Buscar contas pendentes para teste
    const pendingAccounts = await db.listAccountsPayable({});
    const pendingIds = pendingAccounts
      .filter((acc: any) => acc.status === "pendente" && acc.description.includes("Teste"))
      .map((acc: any) => acc.id)
      .slice(0, 2); // Pegar apenas 2 contas

    if (pendingIds.length === 0) {
      console.warn("Nenhuma conta pendente encontrada para teste de pagamento em massa");
      return;
    }

    const preview = await apImprovements.calculateBulkPaymentTotal(pendingIds);

    expect(preview).toHaveProperty("total");
    expect(preview).toHaveProperty("count");
    expect(preview).toHaveProperty("accounts");
    expect(preview.count).toBe(pendingIds.length);
    expect(preview.total).toBeGreaterThan(0);
    expect(preview.accounts.length).toBe(pendingIds.length);
  });

  it("deve realizar pagamento em massa", async () => {
    // Buscar contas pendentes para teste
    const pendingAccounts = await db.listAccountsPayable({});
    const pendingIds = pendingAccounts
      .filter((acc: any) => acc.status === "pendente" && acc.description.includes("Teste"))
      .map((acc: any) => acc.id)
      .slice(0, 2); // Pegar apenas 2 contas

    if (pendingIds.length === 0) {
      console.warn("Nenhuma conta pendente encontrada para teste de pagamento em massa");
      return;
    }

    const result = await apImprovements.payAccountsInBulk(pendingIds);

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("count");
    expect(result).toHaveProperty("paymentDate");
    expect(result.success).toBe(true);
    expect(result.count).toBe(pendingIds.length);

    // Verificar que as contas foram marcadas como pagas
    const updatedAccounts = await apImprovements.getAccountsForBulkPayment(pendingIds);
    for (const account of updatedAccounts) {
      expect(account.status).toBe("pago");
      expect(account.paymentDate).toBeTruthy();
    }
  });

  it("deve lançar erro ao tentar pagamento em massa sem contas", async () => {
    await expect(apImprovements.payAccountsInBulk([])).rejects.toThrow(
      "Nenhuma conta selecionada para pagamento"
    );
  });

  it("deve buscar detalhes de contas para pagamento em massa", async () => {
    const accounts = await apImprovements.getAccountsForBulkPayment(testAccountIds.slice(0, 2));

    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThan(0);
    
    for (const account of accounts) {
      expect(account).toHaveProperty("id");
      expect(account).toHaveProperty("description");
      expect(account).toHaveProperty("amount");
      expect(account).toHaveProperty("dueDate");
    }
  });
});
