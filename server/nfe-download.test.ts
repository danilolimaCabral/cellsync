import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { generateNFeXML, generateQRCodeURL } from "./nfe-xml";
import { generateDANFE } from "./nfe-danfe";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("NF-e - Geração de XML", () => {
  it("gera XML válido da NF-e", () => {
    const mockNFe = {
      id: 1,
      saleId: 1,
      number: 123,
      series: 1,
      model: "55",
      type: "saida" as const,
      status: "emitida" as const,
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "OkCells Comércio LTDA",
      emitterFantasyName: "OkCells",
      emitterAddress: "Rua Exemplo, 123",
      emitterCity: "Goiânia",
      emitterState: "GO",
      emitterZipCode: "74000-000",
      recipientDocument: "123.456.789-09",
      recipientName: "João da Silva",
      recipientAddress: "Rua Cliente, 456",
      recipientCity: "Goiânia",
      recipientState: "GO",
      recipientZipCode: "74000-000",
      recipientPhone: "(62) 98765-4321",
      recipientEmail: "joao@example.com",
      totalProducts: 150000,
      totalDiscount: 0,
      totalFreight: 0,
      totalInsurance: 0,
      totalOtherExpenses: 0,
      totalIcms: 27000,
      totalIpi: 0,
      totalPis: 2475,
      totalCofins: 11400,
      totalInvoice: 150000,
      cfop: "5102",
      natureOperation: "Venda de mercadoria",
      paymentMethod: "pix" as const,
      paymentIndicator: "a_vista" as const,
      accessKey: null,
      protocol: null,
      authorizationDate: null,
      xmlUrl: null,
      danfeUrl: null,
      cancelReason: null,
      canceledAt: null,
      cancelProtocol: null,
      additionalInfo: "Nota fiscal de teste",
      internalNotes: null,
      issuedBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 1,
          invoiceId: 1,
          productId: 1,
          description: "Smartphone Samsung Galaxy A54",
          ncm: "85171231",
          cfop: "5102",
          unit: "UN",
          quantity: 100,
          unitPrice: 150000,
          totalPrice: 150000,
          discount: 0,
          icmsBase: 150000,
          icmsRate: 1800,
          icmsValue: 27000,
          ipiBase: 0,
          ipiRate: 0,
          ipiValue: 0,
          pisBase: 150000,
          pisRate: 165,
          pisValue: 2475,
          cofinsBase: 150000,
          cofinsRate: 760,
          cofinsValue: 11400,
          createdAt: new Date(),
        },
      ],
    };

    const xml = generateNFeXML(mockNFe);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<NFe");
    expect(xml).toContain("<infNFe");
    expect(xml).toContain("<emit>");
    expect(xml).toContain("<dest>");
    expect(xml).toContain("<det");
    expect(xml).toContain("<total>");
    expect(xml).toContain(mockNFe.emitterName);
    expect(xml).toContain(mockNFe.recipientName);
    expect(xml).toContain("1500.00"); // Valor total
  });

  it("gera URL de QR Code corretamente", () => {
    const mockNFe = {
      id: 1,
      number: 123,
      series: 1,
      emitterCnpj: "11222333000181",
    } as any;

    const qrCodeURL = generateQRCodeURL(mockNFe);

    expect(qrCodeURL).toContain("fazenda.go.gov.br");
    expect(qrCodeURL).toContain("chNFe=");
    expect(qrCodeURL).toContain("tpAmb=");
  });
});

describe("NF-e - Geração de DANFE", () => {
  it("gera DANFE em PDF com sucesso", async () => {
    const mockNFe = {
      id: 1,
      saleId: 1,
      number: 123,
      series: 1,
      model: "55",
      type: "saida" as const,
      status: "emitida" as const,
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "OkCells Comércio LTDA",
      emitterFantasyName: "OkCells",
      emitterAddress: "Rua Exemplo, 123",
      emitterCity: "Goiânia",
      emitterState: "GO",
      emitterZipCode: "74000-000",
      recipientDocument: "123.456.789-09",
      recipientName: "João da Silva",
      recipientAddress: "Rua Cliente, 456",
      recipientCity: "Goiânia",
      recipientState: "GO",
      recipientZipCode: "74000-000",
      recipientPhone: "(62) 98765-4321",
      recipientEmail: "joao@example.com",
      totalProducts: 150000,
      totalDiscount: 0,
      totalFreight: 0,
      totalInsurance: 0,
      totalOtherExpenses: 0,
      totalIcms: 27000,
      totalIpi: 0,
      totalPis: 2475,
      totalCofins: 11400,
      totalInvoice: 150000,
      cfop: "5102",
      natureOperation: "Venda de mercadoria",
      paymentMethod: "pix" as const,
      paymentIndicator: "a_vista" as const,
      accessKey: "52240111222333000181550010000001231000000012",
      protocol: "123456789012345",
      authorizationDate: new Date(),
      xmlUrl: null,
      danfeUrl: null,
      cancelReason: null,
      canceledAt: null,
      cancelProtocol: null,
      additionalInfo: "Nota fiscal de teste",
      internalNotes: null,
      issuedBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 1,
          invoiceId: 1,
          productId: 1,
          description: "Smartphone Samsung Galaxy A54",
          ncm: "85171231",
          cfop: "5102",
          unit: "UN",
          quantity: 100,
          unitPrice: 150000,
          totalPrice: 150000,
          discount: 0,
          icmsBase: 150000,
          icmsRate: 1800,
          icmsValue: 27000,
          ipiBase: 0,
          ipiRate: 0,
          ipiValue: 0,
          pisBase: 150000,
          pisRate: 165,
          pisValue: 2475,
          cofinsBase: 150000,
          cofinsRate: 760,
          cofinsValue: 11400,
          createdAt: new Date(),
        },
      ],
    };

    const pdfBuffer = await generateDANFE(mockNFe);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Verificar se é um PDF válido (começa com %PDF)
    const pdfHeader = pdfBuffer.toString("utf8", 0, 4);
    expect(pdfHeader).toBe("%PDF");
  });
});

describe("NF-e - Endpoints de Download", () => {
  it("endpoint downloadXML retorna XML e filename", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar uma NF-e para testar
    const invoice = await caller.nfe.create({
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "OkCells",
      recipientDocument: "123.456.789-09",
      recipientName: "Cliente Teste",
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

    const result = await caller.nfe.downloadXML({ id: invoice.invoiceId });

    expect(result).toHaveProperty("xml");
    expect(result).toHaveProperty("filename");
    expect(result.xml).toContain("<?xml");
    expect(result.xml).toContain("<NFe");
    expect(result.filename).toContain(".xml");
    expect(result.filename).toContain("NFe_");
  });

  it("endpoint downloadDANFE retorna PDF em base64 e filename", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar uma NF-e para testar
    const invoice = await caller.nfe.create({
      emitterCnpj: "11.222.333/0001-81",
      emitterName: "OkCells",
      recipientDocument: "123.456.789-09",
      recipientName: "Cliente Teste",
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

    const result = await caller.nfe.downloadDANFE({ id: invoice.invoiceId });

    expect(result).toHaveProperty("pdf");
    expect(result).toHaveProperty("filename");
    expect(result.pdf).toBeTruthy();
    expect(result.filename).toContain(".pdf");
    expect(result.filename).toContain("DANFE_");

    // Verificar se é base64 válido
    const pdfBuffer = Buffer.from(result.pdf, "base64");
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Verificar se é um PDF válido
    const pdfHeader = pdfBuffer.toString("utf8", 0, 4);
    expect(pdfHeader).toBe("%PDF");
  });
});
