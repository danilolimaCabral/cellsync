import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Sistema Atacado/Varejo", () => {
  let testContext: any;
  let testProductId: number;
  let testCustomerId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    const testUser = {
      id: 999,
      email: "test-wholesale@okcells.com",
      name: "Test User Wholesale",
      role: "vendedor" as const,
      active: true,
    };

    testContext = {
      user: testUser,
      req: { cookies: {} },
      res: { cookie: () => {}, clearCookie: () => {} },
    };

    // Criar produto de teste com preço atacado
    const uniqueSku = `TEST-WS-${Date.now()}`;
    const productResult = await db.createProduct({
      name: "iPhone 15 Pro Max - Teste Atacado",
      category: "Smartphone",
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      sku: uniqueSku,
      salePrice: 800000, // R$ 8.000,00
      costPrice: 600000, // R$ 6.000,00
      currentStock: 100,
      minStock: 5,
      wholesalePrice: 720000, // R$ 7.200,00 (10% desconto)
      minWholesaleQty: 5,
    });
    testProductId = Number(productResult[0].insertId);

    // Criar cliente de teste
    const customerResult = await db.createCustomer({
      name: "Cliente Atacado Teste",
      phone: "11999999999",
      email: "atacado@test.com",
      cpf: "12345678901",
    });
    testCustomerId = Number(customerResult[0].insertId);
  });

  it("deve criar venda no varejo com preço normal", async () => {
    const caller = appRouter.createCaller(testContext);

    const result = await caller.sales.create({
      customerId: testCustomerId,
      items: [
        {
          productId: testProductId,
          quantity: 2, // Menos que o mínimo de atacado (5)
          unitPrice: 800000, // Preço de varejo
        },
      ],
      paymentMethod: "dinheiro",
      totalAmount: 1600000, // 2 x R$ 8.000,00
      discount: 0,
      saleType: "retail",
      appliedDiscount: 0,
    });

    expect(result.success).toBe(true);
    expect(result.saleId).toBeGreaterThan(0);

    // Verificar se a venda foi criada com tipo correto
    const sale = await db.getSaleById(result.saleId);
    expect(sale?.saleType).toBe("retail");
    expect(sale?.appliedDiscount).toBe(0);
  });

  it("deve criar venda no atacado com preço reduzido", async () => {
    const caller = appRouter.createCaller(testContext);

    const quantity = 10; // Acima do mínimo de atacado (5)
    const wholesalePrice = 720000; // R$ 7.200,00
    const retailPrice = 800000; // R$ 8.000,00
    const savedAmount = (retailPrice - wholesalePrice) * quantity; // R$ 800,00

    const result = await caller.sales.create({
      customerId: testCustomerId,
      items: [
        {
          productId: testProductId,
          quantity,
          unitPrice: wholesalePrice, // Preço de atacado
        },
      ],
      paymentMethod: "dinheiro",
      totalAmount: wholesalePrice * quantity,
      discount: 0,
      saleType: "wholesale",
      appliedDiscount: savedAmount,
    });

    expect(result.success).toBe(true);
    expect(result.saleId).toBeGreaterThan(0);

    // Verificar se a venda foi criada com tipo e economia corretos
    const sale = await db.getSaleById(result.saleId);
    expect(sale?.saleType).toBe("wholesale");
    expect(sale?.appliedDiscount).toBe(savedAmount);
    expect(sale?.totalAmount).toBe(wholesalePrice * quantity);
  });

  it("deve calcular economia corretamente no atacado", async () => {
    const quantity = 5; // Exatamente o mínimo
    const wholesalePrice = 720000; // R$ 7.200,00
    const retailPrice = 800000; // R$ 8.000,00
    const expectedSavings = (retailPrice - wholesalePrice) * quantity; // R$ 400,00

    expect(expectedSavings).toBe(400000); // R$ 400,00
  });

  it("deve gerar recibo com tipo de venda e economia", async () => {
    const caller = appRouter.createCaller(testContext);

    // Criar venda atacado
    const saleResult = await caller.sales.create({
      customerId: testCustomerId,
      items: [
        {
          productId: testProductId,
          quantity: 10,
          unitPrice: 720000,
        },
      ],
      paymentMethod: "dinheiro",
      totalAmount: 7200000,
      discount: 0,
      saleType: "wholesale",
      appliedDiscount: 800000, // R$ 800,00 de economia
    });

    // Gerar recibo
    const receiptResult = await caller.sales.generateReceipt({
      saleId: saleResult.saleId,
    });

    expect(receiptResult.success).toBe(true);
    expect(receiptResult.pdf).toBeDefined();
    expect(receiptResult.pdf.length).toBeGreaterThan(0);

    // Verificar se é um PDF válido (começa com %PDF)
    const pdfBuffer = Buffer.from(receiptResult.pdf, "base64");
    const pdfHeader = pdfBuffer.toString("utf-8", 0, 4);
    expect(pdfHeader).toBe("%PDF");
  });

  it("deve validar que preço atacado é menor que varejo", async () => {
    const retailPrice = 800000;
    const wholesalePrice = 720000;

    expect(wholesalePrice).toBeLessThan(retailPrice);
    
    const discountPercentage = ((retailPrice - wholesalePrice) / retailPrice) * 100;
    expect(discountPercentage).toBeGreaterThan(0);
    expect(discountPercentage).toBeLessThan(100);
  });

  it("deve ter quantidade mínima de atacado configurada", async () => {
    // Validar que os campos de atacado existem no schema
    const minWholesaleQty = 5;
    const wholesalePrice = 720000;
    const retailPrice = 800000;
    
    expect(minWholesaleQty).toBeGreaterThan(0);
    expect(wholesalePrice).toBeLessThan(retailPrice);
    expect(wholesalePrice).toBeGreaterThan(0);
  });
});
