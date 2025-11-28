import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Invoice, InvoiceItem } from "../drizzle/schema";
import { generateQRCodeURL } from "./nfe-xml";

interface NFEData extends Invoice {
  items: InvoiceItem[];
}

/**
 * Gera o DANFE (Documento Auxiliar da Nota Fiscal Eletrônica) em PDF
 */
export async function generateDANFE(nfe: NFEData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 5;

  // Gerar QR Code
  const qrCodeURL = generateQRCodeURL(nfe);
  const qrCodeDataURL = await QRCode.toDataURL(qrCodeURL, {
    width: 200,
    margin: 1,
  });

  // ===== CABEÇALHO =====
  let y = margin + 5;

  // Logo e dados do emitente (lado esquerdo)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(nfe.emitterName.toUpperCase(), margin + 2, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`CNPJ: ${nfe.emitterCnpj}`, margin + 2, y);
  y += 3;
  doc.text(nfe.emitterAddress || "", margin + 2, y);
  y += 3;
  doc.text(`${nfe.emitterCity || ""} - ${nfe.emitterState || ""}`, margin + 2, y);

  // DANFE (centro)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DANFE", pageWidth / 2, margin + 8, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Documento Auxiliar da Nota Fiscal Eletrônica", pageWidth / 2, margin + 12, { align: "center" });

  // Número da NF-e (lado direito)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Nº ${String(nfe.number).padStart(9, "0")}`, pageWidth - margin - 2, margin + 8, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Série: ${nfe.series}`, pageWidth - margin - 2, margin + 12, { align: "right" });

  // Linha divisória
  y = margin + 25;
  doc.line(margin, y, pageWidth - margin, y);

  // ===== CHAVE DE ACESSO =====
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CHAVE DE ACESSO", margin + 2, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const chaveAcesso = nfe.accessKey || "0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000";
  doc.text(chaveAcesso, margin + 2, y);

  // QR Code (lado direito)
  doc.addImage(qrCodeDataURL, "PNG", pageWidth - margin - 35, y - 5, 30, 30);

  y += 8;
  doc.line(margin, y, pageWidth - margin, y);

  // ===== DESTINATÁRIO =====
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATÁRIO / REMETENTE", margin + 2, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${nfe.recipientName}`, margin + 2, y);
  y += 3;
  doc.text(`CPF/CNPJ: ${nfe.recipientDocument}`, margin + 2, y);
  y += 3;
  doc.text(`Endereço: ${nfe.recipientAddress || ""}`, margin + 2, y);
  y += 3;
  doc.text(`Município: ${nfe.recipientCity || ""} - UF: ${nfe.recipientState || ""}`, margin + 2, y);
  y += 3;
  doc.text(`CEP: ${nfe.recipientZipCode || ""} - Fone: ${nfe.recipientPhone || ""}`, margin + 2, y);

  y += 5;
  doc.line(margin, y, pageWidth - margin, y);

  // ===== DADOS DA NOTA FISCAL =====
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA NOTA FISCAL", margin + 2, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  
  const col1 = margin + 2;
  const col2 = pageWidth / 2;
  
  doc.text(`Natureza da Operação: ${nfe.natureOperation}`, col1, y);
  doc.text(`CFOP: ${nfe.cfop}`, col2, y);
  y += 3;
  doc.text(`Data de Emissão: ${new Date(nfe.createdAt).toLocaleDateString("pt-BR")}`, col1, y);
  doc.text(`Protocolo: ${nfe.protocol || "Pendente"}`, col2, y);

  y += 5;
  doc.line(margin, y, pageWidth - margin, y);

  // ===== PRODUTOS / SERVIÇOS =====
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("PRODUTOS / SERVIÇOS", margin + 2, y);
  y += 4;

  // Cabeçalho da tabela
  doc.setFontSize(6);
  const tableHeaders = ["Cód", "Descrição", "NCM", "CFOP", "Qtd", "Un", "Valor Unit", "Valor Total"];
  const colWidths = [10, 60, 15, 12, 10, 8, 20, 20];
  let xPos = margin + 2;

  tableHeaders.forEach((header, i) => {
    doc.text(header, xPos, y);
    xPos += colWidths[i];
  });

  y += 3;
  doc.line(margin, y, pageWidth - margin, y);

  // Itens
  doc.setFont("helvetica", "normal");
  nfe.items.forEach((item) => {
    y += 4;
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin + 10;
    }

    xPos = margin + 2;
    doc.text(String(item.productId), xPos, y);
    xPos += colWidths[0];
    
    const desc = item.description.length > 35 ? item.description.substring(0, 32) + "..." : item.description;
    doc.text(desc, xPos, y);
    xPos += colWidths[1];
    
    doc.text(item.ncm, xPos, y);
    xPos += colWidths[2];
    
    doc.text(item.cfop, xPos, y);
    xPos += colWidths[3];
    
    doc.text((item.quantity / 100).toFixed(2), xPos, y);
    xPos += colWidths[4];
    
    doc.text(item.unit, xPos, y);
    xPos += colWidths[5];
    
    doc.text(`R$ ${(item.unitPrice / 100).toFixed(2)}`, xPos, y);
    xPos += colWidths[6];
    
    doc.text(`R$ ${(item.totalPrice / 100).toFixed(2)}`, xPos, y);
  });

  y += 5;
  doc.line(margin, y, pageWidth - margin, y);

  // ===== CÁLCULO DO IMPOSTO =====
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CÁLCULO DO IMPOSTO", margin + 2, y);
  y += 4;
  doc.setFont("helvetica", "normal");

  doc.text(`Base de Cálculo ICMS: R$ ${(nfe.totalProducts / 100).toFixed(2)}`, col1, y);
  doc.text(`Valor ICMS: R$ ${(nfe.totalIcms / 100).toFixed(2)}`, col2, y);
  y += 3;
  doc.text(`Valor PIS: R$ ${(nfe.totalPis / 100).toFixed(2)}`, col1, y);
  doc.text(`Valor COFINS: R$ ${(nfe.totalCofins / 100).toFixed(2)}`, col2, y);
  y += 3;
  doc.text(`Valor IPI: R$ ${(nfe.totalIpi / 100).toFixed(2)}`, col1, y);

  y += 5;
  doc.line(margin, y, pageWidth - margin, y);

  // ===== DADOS ADICIONAIS =====
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("DADOS ADICIONAIS", margin + 2, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(nfe.additionalInfo || "Nota Fiscal emitida pelo sistema OkCells", margin + 2, y, {
    maxWidth: pageWidth - margin * 2 - 4,
  });

  y += 10;
  doc.line(margin, y, pageWidth - margin, y);

  // ===== TOTAIS =====
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  doc.text(`Valor dos Produtos: R$ ${(nfe.totalProducts / 100).toFixed(2)}`, col1, y);
  y += 4;
  doc.text(`Desconto: R$ ${(nfe.totalDiscount / 100).toFixed(2)}`, col1, y);
  y += 4;
  doc.text(`Frete: R$ ${(nfe.totalFreight / 100).toFixed(2)}`, col1, y);
  y += 4;
  doc.setFontSize(10);
  doc.text(`VALOR TOTAL DA NOTA: R$ ${(nfe.totalInvoice / 100).toFixed(2)}`, col1, y);

  // ===== RODAPÉ =====
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Consulte a autenticidade deste documento no portal da SEFAZ usando a chave de acesso acima",
    pageWidth / 2,
    pageHeight - margin - 5,
    { align: "center" }
  );

  // Converter para Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
