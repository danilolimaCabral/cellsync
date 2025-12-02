/**
 * Gerador de cupom fiscal em formato ESC/POS para impressoras térmicas
 * Compatível com: Epson, Bematech, Daruma, Elgin
 */

// Comandos ESC/POS
const ESC = '\x1B';
const GS = '\x1D';

// Comandos de formatação
const COMMANDS = {
  // Inicialização
  INIT: `${ESC}@`,
  
  // Alinhamento
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  
  // Fonte
  FONT_A: `${ESC}M\x00`, // Fonte normal
  FONT_B: `${ESC}M\x01`, // Fonte pequena
  
  // Estilo
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT_ON: `${GS}!\x01`,
  DOUBLE_HEIGHT_OFF: `${GS}!\x00`,
  DOUBLE_WIDTH_ON: `${GS}!\x10`,
  DOUBLE_WIDTH_OFF: `${GS}!\x00`,
  DOUBLE_SIZE_ON: `${GS}!\x11`, // Altura + Largura
  DOUBLE_SIZE_OFF: `${GS}!\x00`,
  
  // Corte
  CUT: `${GS}V\x00`,
  PARTIAL_CUT: `${GS}V\x01`,
  
  // Linha
  LINE_FEED: '\n',
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
  
  // QR Code
  QR_CODE: (data: string) => {
    const len = data.length;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    return `${GS}(k${String.fromCharCode(4, 0, 49, 65, 50, 0)}` + // Model
           `${GS}(k${String.fromCharCode(3, 0, 49, 67, 8)}` + // Size
           `${GS}(k${String.fromCharCode(3, 0, 49, 69, 48)}` + // Error correction
           `${GS}(k${String.fromCharCode(pL + 3, pH, 49, 80, 48)}${data}` + // Store data
           `${GS}(k${String.fromCharCode(3, 0, 49, 81, 48)}`; // Print
  },
};

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SaleData {
  id: number;
  saleDate: Date;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  customerName?: string;
  customerDocument?: string;
  sellerName?: string;
  tenantName?: string;
  tenantDocument?: string;
  tenantAddress?: string;
}

export interface FiscalPrinterOptions {
  paperWidth?: 58 | 80; // mm
  includeLogo?: boolean;
  includeQRCode?: boolean;
  companyName?: string;
  companyDocument?: string;
  companyAddress?: string;
}

/**
 * Gera cupom fiscal em formato ESC/POS
 */
export function generateFiscalReceipt(
  sale: SaleData,
  options: FiscalPrinterOptions = {}
): string {
  const {
    paperWidth = 80,
    includeQRCode = true,
    companyName = sale.tenantName || "LOJA DE CELULAR",
    companyDocument = sale.tenantDocument || "",
    companyAddress = sale.tenantAddress || "",
  } = options;

  const lineWidth = paperWidth === 58 ? 32 : 48;
  let receipt = '';

  // Inicializar impressora
  receipt += COMMANDS.INIT;

  // Cabeçalho - Nome da empresa
  receipt += COMMANDS.ALIGN_CENTER;
  receipt += COMMANDS.DOUBLE_SIZE_ON;
  receipt += COMMANDS.BOLD_ON;
  receipt += companyName + COMMANDS.LINE_FEED;
  receipt += COMMANDS.DOUBLE_SIZE_OFF;
  receipt += COMMANDS.BOLD_OFF;
  receipt += COMMANDS.LINE_FEED;

  // Dados da empresa
  if (companyDocument) {
    receipt += `CNPJ: ${formatDocument(companyDocument)}` + COMMANDS.LINE_FEED;
  }
  if (companyAddress) {
    receipt += companyAddress + COMMANDS.LINE_FEED;
  }
  receipt += COMMANDS.LINE_FEED;

  // Separador
  receipt += COMMANDS.ALIGN_CENTER;
  receipt += '='.repeat(lineWidth) + COMMANDS.LINE_FEED;
  receipt += COMMANDS.BOLD_ON;
  receipt += 'CUPOM NÃO FISCAL' + COMMANDS.LINE_FEED;
  receipt += COMMANDS.BOLD_OFF;
  receipt += '='.repeat(lineWidth) + COMMANDS.LINE_FEED;
  receipt += COMMANDS.LINE_FEED;

  // Dados da venda
  receipt += COMMANDS.ALIGN_LEFT;
  receipt += `Cupom: #${sale.id.toString().padStart(6, '0')}` + COMMANDS.LINE_FEED;
  receipt += `Data: ${formatDate(sale.saleDate)}` + COMMANDS.LINE_FEED;
  if (sale.sellerName) {
    receipt += `Vendedor: ${sale.sellerName}` + COMMANDS.LINE_FEED;
  }
  if (sale.customerName) {
    receipt += `Cliente: ${sale.customerName}` + COMMANDS.LINE_FEED;
  }
  receipt += COMMANDS.LINE_FEED;

  // Separador de itens
  receipt += '-'.repeat(lineWidth) + COMMANDS.LINE_FEED;
  receipt += COMMANDS.BOLD_ON;
  receipt += padRight('ITEM', lineWidth - 10) + padLeft('VALOR', 10) + COMMANDS.LINE_FEED;
  receipt += COMMANDS.BOLD_OFF;
  receipt += '-'.repeat(lineWidth) + COMMANDS.LINE_FEED;

  // Itens da venda
  sale.items.forEach((item) => {
    // Nome do produto
    receipt += item.productName + COMMANDS.LINE_FEED;
    
    // Quantidade x Preço unitário = Total
    const qtyPrice = `${item.quantity} x ${formatCurrency(item.unitPrice)}`;
    const total = formatCurrency(item.totalPrice);
    receipt += padRight(qtyPrice, lineWidth - total.length) + total + COMMANDS.LINE_FEED;
  });

  // Separador de totais
  receipt += '-'.repeat(lineWidth) + COMMANDS.LINE_FEED;

  // Subtotal
  receipt += padRight('Subtotal:', lineWidth - 12) + 
             padLeft(formatCurrency(sale.subtotal), 12) + COMMANDS.LINE_FEED;

  // Desconto
  if (sale.discount > 0) {
    receipt += padRight('Desconto:', lineWidth - 12) + 
               padLeft(`-${formatCurrency(sale.discount)}`, 12) + COMMANDS.LINE_FEED;
  }

  // Total
  receipt += COMMANDS.BOLD_ON;
  receipt += COMMANDS.DOUBLE_HEIGHT_ON;
  receipt += padRight('TOTAL:', lineWidth - 12) + 
             padLeft(formatCurrency(sale.totalAmount), 12) + COMMANDS.LINE_FEED;
  receipt += COMMANDS.DOUBLE_HEIGHT_OFF;
  receipt += COMMANDS.BOLD_OFF;

  // Forma de pagamento
  receipt += COMMANDS.LINE_FEED;
  receipt += `Pagamento: ${formatPaymentMethod(sale.paymentMethod)}` + COMMANDS.LINE_FEED;

  // QR Code (opcional)
  if (includeQRCode) {
    receipt += COMMANDS.LINE_FEED;
    receipt += COMMANDS.ALIGN_CENTER;
    const qrData = `CUPOM:${sale.id}|DATA:${sale.saleDate.toISOString()}|VALOR:${sale.totalAmount}`;
    receipt += COMMANDS.QR_CODE(qrData);
    receipt += COMMANDS.LINE_FEED;
  }

  // Rodapé
  receipt += COMMANDS.LINE_FEED;
  receipt += COMMANDS.ALIGN_CENTER;
  receipt += '='.repeat(lineWidth) + COMMANDS.LINE_FEED;
  receipt += 'Obrigado pela preferência!' + COMMANDS.LINE_FEED;
  receipt += 'Volte sempre!' + COMMANDS.LINE_FEED;
  receipt += '='.repeat(lineWidth) + COMMANDS.LINE_FEED;

  // Alimentar papel e cortar
  receipt += COMMANDS.FEED_LINES(3);
  receipt += COMMANDS.CUT;

  return receipt;
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
}

/**
 * Formata data e hora
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Formata documento (CPF/CNPJ)
 */
function formatDocument(doc: string): string {
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) {
    // CPF: 000.000.000-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

/**
 * Formata método de pagamento
 */
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'debito': 'Cartão de Débito',
    'credito': 'Cartão de Crédito',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'transferencia': 'Transferência',
  };
  return methods[method] || method;
}

/**
 * Preenche string à direita com espaços
 */
function padRight(str: string, width: number): string {
  return str.padEnd(width, ' ');
}

/**
 * Preenche string à esquerda com espaços
 */
function padLeft(str: string, width: number): string {
  return str.padStart(width, ' ');
}

/**
 * Converte string ESC/POS para Base64 (para envio via web)
 */
export function escPosToBase64(escPosString: string): string {
  return Buffer.from(escPosString, 'binary').toString('base64');
}

/**
 * Gera arquivo de texto com comandos ESC/POS para download
 */
export function generatePrintFile(sale: SaleData, options?: FiscalPrinterOptions): Buffer {
  const receipt = generateFiscalReceipt(sale, options);
  return Buffer.from(receipt, 'binary');
}
