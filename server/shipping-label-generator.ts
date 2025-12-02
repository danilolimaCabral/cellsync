import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';

export interface ShippingLabelData {
  // Destinatário
  recipientName: string;
  recipientCpf?: string;
  recipientAddress: string;
  recipientNumber: string;
  recipientComplement?: string;
  recipientNeighborhood: string;
  recipientCity: string;
  recipientState: string;
  recipientZipCode: string;
  recipientPhone: string;
  
  // Remetente
  senderName: string;
  senderAddress: string;
  senderNumber: string;
  senderComplement?: string;
  senderNeighborhood: string;
  senderCity: string;
  senderState: string;
  senderZipCode: string;
  senderPhone?: string;
  
  // Transportadora
  carrier?: string;
  trackingCode?: string;
  
  // Tipo de etiqueta
  labelType: 'simple' | 'correios';
}

/**
 * Gera código de barras como imagem base64
 */
function generateBarcode(value: string, format: 'CODE128' | 'CODE39' = 'CODE128'): string {
  const canvas = new Canvas(200, 80, 'image');
  
  JsBarcode(canvas, value, {
    format,
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 12,
    margin: 5,
  });
  
  return canvas.toDataURL();
}

/**
 * Gera etiqueta simples (formato 1 da imagem)
 */
function generateSimpleLabel(pdf: jsPDF, data: ShippingLabelData, x: number, y: number) {
  const width = 90;
  const height = 120;
  
  // Borda
  pdf.setDrawColor(200);
  pdf.rect(x, y, width, height);
  
  // Conteúdo
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  
  let currentY = y + 10;
  
  // Nome completo
  pdf.text('Nome completo:', x + 5, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.recipientName, x + 5, currentY + 5);
  currentY += 12;
  
  // CPF
  if (data.recipientCpf) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('CPF:', x + 5, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.recipientCpf, x + 5, currentY + 5);
    currentY += 12;
  }
  
  // Endereço
  pdf.setFont('helvetica', 'bold');
  pdf.text('Endereço:', x + 5, currentY);
  pdf.setFont('helvetica', 'normal');
  const fullAddress = `${data.recipientAddress}, ${data.recipientNumber}`;
  pdf.text(fullAddress, x + 5, currentY + 5, { maxWidth: width - 10 });
  currentY += 12;
  
  // Cidade
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cidade:', x + 5, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.recipientCity, x + 5, currentY + 5);
  currentY += 12;
  
  // Estado
  pdf.setFont('helvetica', 'bold');
  pdf.text('Estado:', x + 5, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.recipientState, x + 5, currentY + 5);
  currentY += 12;
  
  // CEP
  pdf.setFont('helvetica', 'bold');
  pdf.text('CEP:', x + 5, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.recipientZipCode, x + 5, currentY + 5);
  currentY += 12;
  
  // Telefone
  pdf.setFont('helvetica', 'bold');
  pdf.text('Telefone:', x + 5, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.recipientPhone, x + 5, currentY + 5);
  currentY += 12;
  
  // Transportadora
  if (data.carrier) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Transportadora:', x + 5, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.carrier, x + 5, currentY + 5);
  }
}

/**
 * Gera etiqueta formato Correios (formato 2 da imagem)
 */
function generateCorreiosLabel(pdf: jsPDF, data: ShippingLabelData, x: number, y: number) {
  const width = 90;
  const height = 120;
  
  // Borda
  pdf.setDrawColor(0);
  pdf.rect(x, y, width, height);
  
  let currentY = y + 5;
  
  // Código de barras de rastreamento (topo)
  if (data.trackingCode) {
    try {
      const barcodeImg = generateBarcode(data.trackingCode, 'CODE128');
      pdf.addImage(barcodeImg, 'PNG', x + 5, currentY, width - 10, 15);
      currentY += 18;
    } catch (error) {
      console.error('Erro ao gerar código de barras:', error);
      currentY += 5;
    }
  }
  
  // Linha separadora
  pdf.setDrawColor(0);
  pdf.line(x, currentY, x + width, currentY);
  currentY += 3;
  
  // Seção DESTINATÁRIO
  pdf.setFillColor(0, 0, 0);
  pdf.rect(x, currentY, width, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESTINATÁRIO', x + 3, currentY + 4);
  pdf.setTextColor(0, 0, 0);
  currentY += 8;
  
  // Nome do destinatário
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.recipientName, x + 3, currentY);
  currentY += 5;
  
  // Endereço completo
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const destAddress = `${data.recipientAddress}, ${data.recipientNumber}`;
  pdf.text(destAddress, x + 3, currentY, { maxWidth: width - 6 });
  currentY += 4;
  
  if (data.recipientComplement) {
    pdf.text(data.recipientComplement, x + 3, currentY);
    currentY += 4;
  }
  
  pdf.text(data.recipientNeighborhood, x + 3, currentY);
  currentY += 6;
  
  // CEP + Cidade/Estado
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  const zipCityState = `${data.recipientZipCode} - ${data.recipientCity}/${data.recipientState}`;
  pdf.text(zipCityState, x + 3, currentY);
  currentY += 6;
  
  // Código de barras do CEP
  try {
    const zipBarcode = generateBarcode(data.recipientZipCode.replace(/\D/g, ''), 'CODE128');
    pdf.addImage(zipBarcode, 'PNG', x + 5, currentY, width - 10, 12);
    currentY += 15;
  } catch (error) {
    console.error('Erro ao gerar código de barras do CEP:', error);
    currentY += 5;
  }
  
  // Linha separadora
  pdf.setDrawColor(0);
  pdf.line(x, currentY, x + width, currentY);
  currentY += 3;
  
  // Seção REMETENTE
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Remetente:', x + 3, currentY);
  currentY += 4;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.senderName, x + 3, currentY);
  currentY += 3;
  
  const senderAddress = `${data.senderAddress}, ${data.senderNumber}`;
  pdf.text(senderAddress, x + 3, currentY, { maxWidth: width - 6 });
  currentY += 3;
  
  const senderCityState = `${data.senderNeighborhood} - ${data.senderCity}/${data.senderState}`;
  pdf.text(senderCityState, x + 3, currentY, { maxWidth: width - 6 });
  currentY += 3;
  
  pdf.text(`CEP: ${data.senderZipCode}`, x + 3, currentY);
}

/**
 * Gera PDF com etiquetas de envio
 * Suporta múltiplas etiquetas por página (formato A4)
 */
export async function generateShippingLabels(
  labels: ShippingLabelData[],
  options: {
    labelsPerRow?: number;
    labelsPerColumn?: number;
  } = {}
): Promise<Buffer> {
  const { labelsPerRow = 2, labelsPerColumn = 4 } = options;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const marginX = 10;
  const marginY = 10;
  
  const labelWidth = (pageWidth - marginX * 2 - 5 * (labelsPerRow - 1)) / labelsPerRow;
  const labelHeight = (pageHeight - marginY * 2 - 5 * (labelsPerColumn - 1)) / labelsPerColumn;
  
  let labelIndex = 0;
  
  for (const labelData of labels) {
    const row = Math.floor(labelIndex / labelsPerRow) % labelsPerColumn;
    const col = labelIndex % labelsPerRow;
    
    // Nova página se necessário
    if (labelIndex > 0 && row === 0 && col === 0) {
      pdf.addPage();
    }
    
    const x = marginX + col * (labelWidth + 5);
    const y = marginY + row * (labelHeight + 5);
    
    if (labelData.labelType === 'simple') {
      generateSimpleLabel(pdf, labelData, x, y);
    } else {
      generateCorreiosLabel(pdf, labelData, x, y);
    }
    
    labelIndex++;
  }
  
  return Buffer.from(pdf.output('arraybuffer'));
}
