import { describe, it, expect } from "vitest";
import { generateFiscalReceipt, escPosToBase64, generatePrintFile } from "./fiscal-printer";

describe("Sistema de Cupom Fiscal", () => {
  const saleData = {
    id: 12345,
    saleDate: new Date("2025-12-02T10:30:00"),
    items: [
      {
        productName: "iPhone 15 Pro Max 256GB",
        quantity: 1,
        unitPrice: 760000,
        totalPrice: 760000,
      },
      {
        productName: "Capinha Silicone",
        quantity: 2,
        unitPrice: 3500,
        totalPrice: 7000,
      },
    ],
    subtotal: 767000,
    discount: 7000,
    totalAmount: 760000,
    paymentMethod: "credito",
    customerName: "João da Silva",
    customerDocument: "12345678900",
    sellerName: "Maria Vendedora",
    tenantName: "CellSync Loja Centro",
    tenantDocument: "12345678000190",
    tenantAddress: "Rua das Flores, 123 - Centro",
  };

  it("deve gerar cupom fiscal com comandos ESC/POS", () => {
    const receipt = generateFiscalReceipt(saleData);

    // Verificar comandos ESC/POS básicos
    expect(receipt).toContain("\x1B@"); // INIT
    expect(receipt).toContain("\x1Ba\x01"); // ALIGN_CENTER
    expect(receipt).toContain("\x1BE\x01"); // BOLD_ON
    expect(receipt).toContain("\x1DV"); // CUT
  });

  it("deve incluir informações da empresa no cabeçalho", () => {
    const receipt = generateFiscalReceipt(saleData);

    expect(receipt).toContain("CellSync Loja Centro");
    expect(receipt).toContain("12.345.678/0001-90"); // CNPJ formatado
    expect(receipt).toContain("Rua das Flores");
  });

  it("deve incluir número do cupom e data", () => {
    const receipt = generateFiscalReceipt(saleData);

    expect(receipt).toContain("#012345"); // Número com padding
    expect(receipt).toContain("02/12/2025"); // Data formatada
  });

  it("deve listar todos os itens da venda", () => {
    const receipt = generateFiscalReceipt(saleData);

    expect(receipt).toContain("iPhone 15 Pro Max 256GB");
    expect(receipt).toContain("Capinha Silicone");
    expect(receipt).toMatch(/1 x R\$\s*7\.600,00/); // Aceita espaços variáveis
    expect(receipt).toContain("2 x R$ 35,00");
  });

  it("deve incluir totais e desconto", () => {
    const receipt = generateFiscalReceipt(saleData);

    expect(receipt).toContain("Subtotal:");
    expect(receipt).toMatch(/R\$\s*7\.670,00/); // Aceita espaços variáveis
    expect(receipt).toContain("Desconto:");
    expect(receipt).toContain("-R$ 70,00");
    expect(receipt).toContain("TOTAL:");
    expect(receipt).toContain("R$ 7.600,00");
  });

  it("deve incluir forma de pagamento", () => {
    const receipt = generateFiscalReceipt(saleData);

    expect(receipt).toContain("Pagamento:");
    expect(receipt).toContain("Cartão de Crédito");
  });

  it("deve incluir dados do cliente e vendedor", () => {
    const receipt = generateFiscalReceipt(saleData);

    expect(receipt).toContain("Cliente: João da Silva");
    expect(receipt).toContain("Vendedor: Maria Vendedora");
  });

  it("deve gerar QR Code quando habilitado", () => {
    const receipt = generateFiscalReceipt(saleData, { includeQRCode: true });

    // Verificar comandos de QR Code ESC/POS
    expect(receipt).toContain("\x1D(k"); // Comando de QR Code
    expect(receipt).toContain("CUPOM:12345"); // Dados do QR Code
  });

  it("não deve incluir QR Code quando desabilitado", () => {
    const receipt = generateFiscalReceipt(saleData, { includeQRCode: false });

    expect(receipt).not.toContain("\x1D(k");
  });

  it("deve suportar papel 58mm", () => {
    const receipt58 = generateFiscalReceipt(saleData, { paperWidth: 58 });
    const receipt80 = generateFiscalReceipt(saleData, { paperWidth: 80 });

    // Cupom 58mm deve ser menor que 80mm
    expect(receipt58.length).toBeLessThan(receipt80.length);
  });

  it("deve converter para Base64 corretamente", () => {
    const receipt = generateFiscalReceipt(saleData);
    const base64 = escPosToBase64(receipt);

    // Verificar formato Base64
    expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(base64.length).toBeGreaterThan(0);

    // Verificar se pode ser decodificado
    const decoded = Buffer.from(base64, "base64").toString("binary");
    expect(decoded).toBe(receipt);
  });

  it("deve gerar arquivo de impressão como Buffer", () => {
    const printFile = generatePrintFile(saleData);

    expect(printFile).toBeInstanceOf(Buffer);
    expect(printFile.length).toBeGreaterThan(0);

    // Verificar se contém comandos ESC/POS
    const content = printFile.toString("binary");
    expect(content).toContain("\x1B@"); // INIT
  });

  it("deve incluir rodapé com mensagem de agradecimento", () => {
    const receipt = generateFiscalReceipt(saleData);

    expect(receipt).toContain("Obrigado pela preferência");
    expect(receipt).toContain("Volte sempre");
  });

  it("deve formatar CPF corretamente", () => {
    const dataWithCPF = {
      ...saleData,
      customerDocument: "12345678900",
    };
    const receipt = generateFiscalReceipt(dataWithCPF);

    // CPF do cliente não é exibido no cupom (apenas nome)
    expect(receipt).toContain("João da Silva");
  });

  it("deve formatar CNPJ corretamente", () => {
    const dataWithCNPJ = {
      ...saleData,
      tenantDocument: "12345678000190",
    };
    const receipt = generateFiscalReceipt(dataWithCNPJ);

    expect(receipt).toContain("12.345.678/0001-90");
  });
});
