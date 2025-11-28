import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createFinancialContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@okcells.com",
    name: "Admin User",
    loginMethod: "local",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("financial module", () => {
  it("should create account payable successfully", async () => {
    const { ctx } = createFinancialContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.financial.accountsPayable.create({
      description: "Teste de conta a pagar",
      category: "opex",
      amount: 10000, // R$ 100,00 em centavos
      dueDate: new Date("2025-12-31"),
    });

    expect(result).toBeDefined();
  });

  it("should create account receivable successfully", async () => {
    const { ctx } = createFinancialContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.financial.accountsReceivable.create({
      description: "Teste de conta a receber",
      amount: 50000, // R$ 500,00 em centavos
      dueDate: new Date("2025-12-31"),
    });

    expect(result).toBeDefined();
  });

  it("should list accounts payable", async () => {
    const { ctx } = createFinancialContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.financial.accountsPayable.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("should list accounts receivable", async () => {
    const { ctx } = createFinancialContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.financial.accountsReceivable.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get cash flow data", async () => {
    const { ctx } = createFinancialContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.financial.cashFlow.get({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalIncome");
    expect(result).toHaveProperty("totalExpenses");
    expect(result).toHaveProperty("balance");
    expect(result).toHaveProperty("transactions");
    expect(typeof result.totalIncome).toBe("number");
    expect(typeof result.totalExpenses).toBe("number");
    expect(typeof result.balance).toBe("number");
    expect(Array.isArray(result.transactions)).toBe(true);
  });

  it("should update account payable status to paid", async () => {
    const { ctx } = createFinancialContext();
    const caller = appRouter.createCaller(ctx);

    // Primeiro cria uma conta
    await caller.financial.accountsPayable.create({
      description: "Conta para teste de status",
      category: "custo_fixo",
      amount: 20000,
      dueDate: new Date("2025-12-31"),
    });

    // Lista para pegar o ID
    const accounts = await caller.financial.accountsPayable.list({});
    const lastAccount = accounts[accounts.length - 1];

    if (lastAccount) {
      const result = await caller.financial.accountsPayable.updateStatus({
        id: lastAccount.id,
        status: "pago",
        paymentDate: new Date(),
      });

      expect(result.success).toBe(true);
    }
  });

  it("should update account receivable status to received", async () => {
    const { ctx } = createFinancialContext();
    const caller = appRouter.createCaller(ctx);

    // Primeiro cria uma conta
    await caller.financial.accountsReceivable.create({
      description: "Conta para teste de status",
      amount: 30000,
      dueDate: new Date("2025-12-31"),
    });

    // Lista para pegar o ID
    const accounts = await caller.financial.accountsReceivable.list({});
    const lastAccount = accounts[accounts.length - 1];

    if (lastAccount) {
      const result = await caller.financial.accountsReceivable.updateStatus({
        id: lastAccount.id,
        status: "recebido",
        paymentDate: new Date(),
      });

      expect(result.success).toBe(true);
    }
  });
});
