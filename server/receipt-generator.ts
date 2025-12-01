/**
 * Gerador de Recibo Moderno para Vendas
 * Gera PDF profissional com informações de garantia e QR Code
 */

import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface ReceiptProduct {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  imei?: string;
  warranty?: string;
}

interface ReceiptData {
  saleId: string;
  saleNumber: number;
  date: Date;
  seller: string;
  customer?: {
    name: string;
    document?: string;
    phone?: string;
  };
  products: ReceiptProduct[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  commission?: number;
  saleType?: 'retail' | 'wholesale';
  savedAmount?: number;
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

/**
 * Formata data e hora
 */
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * Gera QR Code para consulta da venda
 */
async function generateQRCode(saleId: string): Promise<string> {
  const url = `${process.env.VITE_APP_URL || "https://okcells.manus.space"}/vendas/${saleId}`;
  return await QRCode.toDataURL(url, {
    width: 150,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

/**
 * Gera recibo moderno em PDF
 */
export async function generateReceipt(data: ReceiptData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ========== CABEÇALHO ==========
  
  // Logo (círculo azul com "OK")
  doc.setFillColor(37, 99, 235); // blue-600
  doc.circle(pageWidth / 2, yPos + 10, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("OK", pageWidth / 2, yPos + 12, { align: "center" });

  yPos += 25;

  // Nome da loja
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("OkCells", pageWidth / 2, yPos, { align: "center" });

  yPos += 6;

  // Slogan
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Sistema completo de gestão para lojas de celular",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );

  yPos += 10;

  // Linha divisória
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 8;

  // ========== INFORMAÇÕES DA VENDA ==========

  // Título do recibo
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text("RECIBO DE VENDA", pageWidth / 2, yPos, { align: "center" });

  yPos += 8;

  // Badge de tipo de venda
  if (data.saleType) {
    const badgeText = data.saleType === 'wholesale' ? 'VENDA ATACADO' : 'VENDA VAREJO';
    const badgeColor = data.saleType === 'wholesale' ? [34, 197, 94] : [59, 130, 246]; // green-500 : blue-500
    
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    const badgeWidth = doc.getTextWidth(badgeText) + 8;
    doc.roundedRect(pageWidth / 2 - badgeWidth / 2, yPos - 3, badgeWidth, 6, 1, 1, "F");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, pageWidth / 2, yPos + 1, { align: "center" });
    
    yPos += 6;
  }

  yPos += 4;

  // Box com informações da venda
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 2, 2, "F");

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");

  const col1X = margin + 5;
  const col2X = pageWidth / 2 + 5;

  // Coluna 1
  doc.text("Número da Venda:", col1X, yPos + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`#${data.saleNumber.toString().padStart(6, "0")}`, col1X, yPos + 10);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Data e Hora:", col1X, yPos + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(formatDateTime(data.date), col1X, yPos + 20);

  // Coluna 2
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Vendedor:", col2X, yPos + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(data.seller, col2X, yPos + 10);

  if (data.customer) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Cliente:", col2X, yPos + 16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.customer.name, col2X, yPos + 20);
  }

  yPos += 30;

  // ========== PRODUTOS ==========

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Produtos", margin, yPos);

  yPos += 6;

  // Cabeçalho da tabela
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 7, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);

  doc.text("Produto / SKU", margin + 2, yPos + 5);
  doc.text("Qtd", pageWidth - margin - 50, yPos + 5, { align: "right" });
  doc.text("Valor Unit.", pageWidth - margin - 35, yPos + 5, { align: "right" });
  doc.text("Total", pageWidth - margin - 2, yPos + 5, { align: "right" });

  yPos += 7;

  // Produtos
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  for (const product of data.products) {
    // Verifica se precisa de nova página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Linha zebrada
    if (data.products.indexOf(product) % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 12, "F");
    }

    // Nome do produto
    doc.setFont("helvetica", "bold");
    doc.text(product.name, margin + 2, yPos + 4);

    // SKU
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`SKU: ${product.sku}`, margin + 2, yPos + 8);

    // IMEI (se houver)
    if (product.imei) {
      doc.text(`IMEI: ${product.imei}`, margin + 2, yPos + 11);
    }

    // Valores
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(
      product.quantity.toString(),
      pageWidth - margin - 50,
      yPos + 6,
      { align: "right" }
    );
    doc.text(
      formatCurrency(product.unitPrice),
      pageWidth - margin - 35,
      yPos + 6,
      { align: "right" }
    );
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(product.total), pageWidth - margin - 2, yPos + 6, {
      align: "right",
    });

    yPos += 14;
  }

  yPos += 3;

  // Linha divisória
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 8;

  // ========== TOTAIS ==========

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  // Subtotal
  doc.text("Subtotal:", pageWidth - margin - 40, yPos);
  doc.text(formatCurrency(data.subtotal), pageWidth - margin - 2, yPos, {
    align: "right",
  });

  yPos += 6;

  // Desconto
  if (data.discount > 0) {
    doc.setTextColor(220, 38, 38); // red-600
    doc.text("Desconto:", pageWidth - margin - 40, yPos);
    doc.text(`-${formatCurrency(data.discount)}`, pageWidth - margin - 2, yPos, {
      align: "right",
    });
    yPos += 6;
  }

  // Economia (se atacado)
  if (data.savedAmount && data.savedAmount > 0) {
    doc.setFillColor(240, 253, 244); // green-50
    doc.roundedRect(pageWidth - margin - 70, yPos - 2, 70, 8, 1, 1, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); // green-600
    doc.text("✓ Você economizou:", pageWidth - margin - 68, yPos + 3);
    doc.text(formatCurrency(data.savedAmount), pageWidth - margin - 2, yPos + 3, {
      align: "right",
    });
    
    yPos += 10;
  }

  // Total
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(pageWidth - margin - 60, yPos - 2, 60, 8, 1, 1, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", pageWidth - margin - 55, yPos + 4);
  doc.text(formatCurrency(data.total), pageWidth - margin - 2, yPos + 4, {
    align: "right",
  });

  yPos += 12;

  // Forma de pagamento
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Forma de pagamento: ${data.paymentMethod}`,
    pageWidth - margin - 2,
    yPos,
    { align: "right" }
  );

  yPos += 10;

  // ========== GARANTIA ==========

  // Box de garantia destacado
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 2, 2, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(146, 64, 14); // amber-900
  doc.text("⚠️ INFORMAÇÕES DE GARANTIA", margin + 5, yPos + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 53, 15); // amber-950

  const warrantyText = [
    "• Garantia de 90 dias para defeitos de fabricação",
    "• Não cobre danos físicos, oxidação ou mau uso",
    "• Apresentar este recibo para acionamento da garantia",
    "• Válido somente para produtos com IMEI registrado",
  ];

  let warrantyY = yPos + 12;
  for (const line of warrantyText) {
    doc.text(line, margin + 5, warrantyY);
    warrantyY += 4;
  }

  yPos += 30;

  // ========== QR CODE E RODAPÉ ==========

  // Gerar QR Code
  const qrCode = await generateQRCode(data.saleId);
  doc.addImage(qrCode, "PNG", margin, yPos, 25, 25);

  // Texto ao lado do QR Code
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Escaneie para consultar", margin + 28, yPos + 8);
  doc.text("esta venda online", margin + 28, yPos + 12);

  // ID da venda
  doc.setFontSize(7);
  doc.text(`ID: ${data.saleId}`, margin + 28, yPos + 18);

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Obrigado pela preferência!",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  doc.setFontSize(7);
  doc.text(
    "OkCells - Sistema de Gestão para Lojas de Celular",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Converter para Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
