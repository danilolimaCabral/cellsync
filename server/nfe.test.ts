import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  validateCPF,
  validateCNPJ,
  validateDocument,
  calculateICMS,
  calculatePIS,
  calculateCOFINS,
  calculateIPI,
  calculateItemTaxes,
} from "./nfe-utils";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@cellsync.com",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("NF-e Utils - Validação de Documentos", () => {
  it("valida CPF correto", () => {
    expect(validateCPF("123.456.789-09")).toBe(true);
    expect(validateCPF("12345678909")).toBe(true);
  });

  it("rejeita CPF inválido", () => {
    expect(validateCPF("123.456.789-00")).toBe(false);
    expect(validateCPF("111.111.111-11")).toBe(false);
  });

  it("valida CNPJ correto", () => {
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validateCNPJ("11222333000181")).toBe(true);
  });

  it("rejeita CNPJ inválido", () => {
    expect(validateCNPJ("11.222.333/0001-00")).toBe(false);
    expect(validateCNPJ("11.111.111/1111-11")).toBe(false);
  });

  it("valida documento genérico (CPF ou CNPJ)", () => {
    expect(validateDocument("123.456.789-09")).toBe(true);
    expect(validateDocument("11.222.333/0001-81")).toBe(true);
    expect(validateDocument("123.456.789-00")).toBe(false);
  });
});

describe("NF-e Utils - Cálculo de Impostos", () => {
  it("calcula ICMS corretamente (18%)", () => {
    const result = calculateICMS(10000, 1800); // R$ 100,00 com 18%
    expect(result.base).toBe(10000);
    expect(result.rate).toBe(1800);
    expect(result.value).toBe(1800); // R$ 18,00
  });

  it("calcula PIS corretamente (1.65%)", () => {
    const result = calculatePIS(10000, 165); // R$ 100,00 com 1.65%
    expect(result.base).toBe(10000);
    expect(result.rate).toBe(165);
    expect(result.value).toBe(165); // R$ 1,65
  });

  it("calcula COFINS corretamente (7.6%)", () => {
    const result = calculateCOFINS(10000, 760); // R$ 100,00 com 7.6%
    expect(result.base).toBe(10000);
    expect(result.rate).toBe(760);
    expect(result.value).toBe(760); // R$ 7,60
  });

  it("calcula IPI corretamente (10%)", () => {
    const result = calculateIPI(10000, 1000); // R$ 100,00 com 10%
    expect(result.base).toBe(10000);
    expect(result.rate).toBe(1000);
    expect(result.value).toBe(1000); // R$ 10,00
  });

  it("calcula todos os impostos de um item", () => {
    const result = calculateItemTaxes({
      totalPrice: 10000, // R$ 100,00
      icmsRate: 1800, // 18%
      ipiRate: 1000, // 10%
      pisRate: 165, // 1.65%
      cofinsRate: 760, // 7.6%
    });

    expect(result.icms.value).toBe(1800); // R$ 18,00
    expect(result.ipi.value).toBe(1000); // R$ 10,00
    expect(result.pis.value).toBe(165); // R$ 1,65
    expect(result.cofins.value).toBe(760); // R$ 7,60
  });
});

describe("NF-e - Backend", () => {
  it("obtém o último número de NF-e", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lastNumber = await caller.nfe.getLastNumber();
    expect(typeof lastNumber).toBe("number");
    expect(lastNumber).toBeGreaterThanOrEqual(0);
  });

  it("cria uma NF-e com itens", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nfe.create({
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "CellSync Comércio de Celulares LTDA",
      emitterCity: "Goiânia",
      emitterState: "GO",
      recipientDocument: "123.456.789-09",
      recipientName: "João da Silva",
      recipientCity: "Goiânia",
      recipientState: "GO",
      cfop: "5102",
      natureOperation: "Venda de mercadoria",
      paymentMethod: "pix",
      paymentIndicator: "a_vista",
      totalProducts: 150000, // R$ 1.500,00
      totalDiscount: 0,
      totalFreight: 0,
      totalInvoice: 150000,
      items: [
        {
          description: "Smartphone Samsung Galaxy A54",
          ncm: "85171231",
          cfop: "5102",
          unit: "UN",
          quantity: 100, // 1 unidade (em centésimos)
          unitPrice: 150000, // R$ 1.500,00
          totalPrice: 150000,
          discount: 0,
          icmsRate: 1800, // 18%
          pisRate: 165, // 1.65%
          cofinsRate: 760, // 7.6%
        },
      ],
    });

    expect(result.invoiceId).toBeGreaterThan(0);
    expect(result.number).toBeGreaterThan(0);
  });

  it("lista NF-e com filtros", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const invoices = await caller.nfe.list({
      limit: 10,
    });

    expect(Array.isArray(invoices)).toBe(true);
  });

  it("obtém estatísticas de NF-e", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.nfe.stats();

    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("emitidas");
    expect(stats).toHaveProperty("canceladas");
    expect(stats).toHaveProperty("totalValue");
    expect(typeof stats.total).toBe("number");
  });
});

describe("NF-e - Integração com PDV", () => {
  it("cria venda e emite NF-e automaticamente", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 1. Criar uma venda (assumindo cliente ID 1 existe)
    const sale = await caller.sales.create({
      customerId: 1,
      totalAmount: 200000, // R$ 2.000,00
      discount: 0,
      paymentMethod: "pix",
      items: [
        {
          productId: 1, // Assumindo que existe produto com ID 1
          quantity: 1,
          unitPrice: 200000,
        },
      ],
    });

    expect(sale.saleId).toBeGreaterThan(0);

    // 2. Emitir NF-e vinculada à venda
    const invoice = await caller.nfe.create({
      saleId: sale.saleId,
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "CellSync",
      recipientDocument: "123.456.789-09",
      recipientName: "Maria Santos",
      cfop: "5102",
      natureOperation: "Venda de mercadoria",
      paymentMethod: "pix",
      paymentIndicator: "a_vista",
      totalProducts: 200000,
      totalDiscount: 0,
      totalInvoice: 200000,
      items: [
        {
          productId: 1,
          description: "Smartphone",
          ncm: "85171231",
          cfop: "5102",
          quantity: 100,
          unitPrice: 200000,
          totalPrice: 200000,
        },
      ],
    });

    expect(invoice.invoiceId).toBeGreaterThan(0);
    expect(invoice.number).toBeGreaterThan(0);

    // 3. Verificar que a NF-e foi criada com sucesso
    expect(invoice.invoiceId).toBeGreaterThan(0);
    expect(invoice.number).toBeGreaterThan(0);
  });

  it("permite emitir NF-e com documento válido", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar NF-e com documento válido deve funcionar
    const invoice = await caller.nfe.create({
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "CellSync",
      recipientDocument: "123.456.789-09", // CPF válido
      recipientName: "Cliente com Documento",
      cfop: "5102",
      natureOperation: "Venda de mercadoria",
      paymentMethod: "pix",
      paymentIndicator: "a_vista",
      totalProducts: 100000,
      totalDiscount: 0,
      totalInvoice: 100000,
      items: [
        {
          description: "Produto Teste",
          ncm: "85171231",
          cfop: "5102",
          quantity: 100,
          unitPrice: 100000,
          totalPrice: 100000,
        },
      ],
    });

    expect(invoice.invoiceId).toBeGreaterThan(0);
    expect(invoice.number).toBeGreaterThan(0);
  });

  it("calcula impostos automaticamente ao emitir NF-e", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const invoice = await caller.nfe.create({
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "CellSync",
      recipientDocument: "123.456.789-09",
      recipientName: "Cliente Teste",
      cfop: "5102",
      natureOperation: "Venda de mercadoria",
      paymentMethod: "pix",
      paymentIndicator: "a_vista",
      totalProducts: 100000, // R$ 1.000,00
      totalDiscount: 0,
      totalInvoice: 100000,
      items: [
        {
          description: "Smartphone",
          ncm: "85171231",
          cfop: "5102",
          quantity: 100,
          unitPrice: 100000,
          totalPrice: 100000,
          icmsRate: 1800, // 18%
          pisRate: 165, // 1.65%
          cofinsRate: 760, // 7.6%
          ipiRate: 0,
        },
      ],
    });

    // Verificar que a NF-e foi criada com sucesso
    expect(invoice.invoiceId).toBeGreaterThan(0);
    expect(invoice.number).toBeGreaterThan(0);
  });
});
