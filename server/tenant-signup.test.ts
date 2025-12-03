import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

/**
 * Testes do fluxo de assinatura:
 * 1. Criar checkout sem autenticação
 * 2. Criar tenant após pagamento
 * 3. Validações de email/CNPJ duplicados
 */

describe("Fluxo de Assinatura - Checkout Direto", () => {
  const mockReq = { headers: { origin: "http://localhost:3000" } } as any;
  const mockRes = {} as any;

  beforeAll(async () => {
    // Garantir que o banco está conectado
    await db.getDb();
  });

  it("deve criar checkout sem autenticação (publicProcedure)", async () => {
    const caller = appRouter.createCaller({
      user: null, // SEM autenticação
      req: mockReq,
      res: mockRes,
    });

    const result = await caller.plans.createCheckout({
      planSlug: "basico",
      billingPeriod: "monthly",
    });

    expect(result).toBeDefined();
    expect(result.checkoutUrl).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(result.checkoutUrl).toContain("checkout.stripe.com");
  });

  it("deve criar tenant após pagamento bem-sucedido", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: mockReq,
      res: mockRes,
    });

    const uniqueEmail = `test-${Date.now()}@example.com`;
    const uniqueCNPJ = `${Math.floor(Math.random() * 100000000000000)}`.padStart(14, "0");

    const result = await caller.tenants.createFromCheckout({
      email: uniqueEmail,
      password: "senha123",
      storeName: "Loja Teste",
      cnpj: uniqueCNPJ,
      ownerName: "João Silva",
      stripeSessionId: `cs_test_${Date.now()}`,
    });

    expect(result.success).toBe(true);
    expect(result.tenantId).toBeDefined();
    expect(result.userId).toBeDefined();
    expect(result.message).toContain("sucesso");
  });

  it("deve rejeitar email duplicado", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: mockReq,
      res: mockRes,
    });

    const email = `duplicate-${Date.now()}@example.com`;
    const cnpj1 = `${Math.floor(Math.random() * 100000000000000)}`.padStart(14, "0");
    const cnpj2 = `${Math.floor(Math.random() * 100000000000000)}`.padStart(14, "0");

    // Criar primeiro tenant
    await caller.tenants.createFromCheckout({
      email,
      password: "senha123",
      storeName: "Loja 1",
      cnpj: cnpj1,
      ownerName: "João",
      stripeSessionId: `cs_test_${Date.now()}_1`,
    });

    // Tentar criar segundo com mesmo email
    await expect(
      caller.tenants.createFromCheckout({
        email, // MESMO EMAIL
        password: "senha456",
        storeName: "Loja 2",
        cnpj: cnpj2,
        ownerName: "Maria",
        stripeSessionId: `cs_test_${Date.now()}_2`,
      })
    ).rejects.toThrow("Email já cadastrado");
  });

  it("deve rejeitar CNPJ duplicado", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: mockReq,
      res: mockRes,
    });

    const cnpj = `${Math.floor(Math.random() * 100000000000000)}`.padStart(14, "0");
    const email1 = `email1-${Date.now()}@example.com`;
    const email2 = `email2-${Date.now()}@example.com`;

    // Criar primeiro tenant
    await caller.tenants.createFromCheckout({
      email: email1,
      password: "senha123",
      storeName: "Loja 1",
      cnpj,
      ownerName: "João",
      stripeSessionId: `cs_test_${Date.now()}_1`,
    });

    // Tentar criar segundo com mesmo CNPJ
    await expect(
      caller.tenants.createFromCheckout({
        email: email2,
        password: "senha456",
        storeName: "Loja 2",
        cnpj, // MESMO CNPJ
        ownerName: "Maria",
        stripeSessionId: `cs_test_${Date.now()}_2`,
      })
    ).rejects.toThrow("CNPJ já cadastrado");
  });

  it("deve validar formato de email", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: mockReq,
      res: mockRes,
    });

    await expect(
      caller.tenants.createFromCheckout({
        email: "email-invalido", // SEM @
        password: "senha123",
        storeName: "Loja Teste",
        cnpj: "12345678901234",
        ownerName: "João",
        stripeSessionId: "cs_test_123",
      })
    ).rejects.toThrow();
  });

  it("deve validar tamanho mínimo de senha", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: mockReq,
      res: mockRes,
    });

    await expect(
      caller.tenants.createFromCheckout({
        email: `test-${Date.now()}@example.com`,
        password: "123", // MENOS DE 6 caracteres
        storeName: "Loja Teste",
        cnpj: "12345678901234",
        ownerName: "João",
        stripeSessionId: "cs_test_123",
      })
    ).rejects.toThrow();
  });

  it("deve validar CNPJ com 14 dígitos", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: mockReq,
      res: mockRes,
    });

    await expect(
      caller.tenants.createFromCheckout({
        email: `test-${Date.now()}@example.com`,
        password: "senha123",
        storeName: "Loja Teste",
        cnpj: "123456", // MENOS DE 14 dígitos
        ownerName: "João",
        stripeSessionId: "cs_test_123",
      })
    ).rejects.toThrow();
  });
});
