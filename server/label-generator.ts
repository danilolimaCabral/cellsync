/**
 * Módulo de geração de etiquetas com código de barras e QR code
 */
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';

export interface LabelData {
  productName: string;
  price: number; // em centavos
  sku: string;
  brand?: string;
  model?: string;
}

/**
 * Gera código de barras em formato PNG base64
 * @param text Texto para codificar (SKU ou código do produto)
 * @param type Tipo de código de barras (code128, ean13, etc)
 */
export async function generateBarcode(text: string, type: 'code128' | 'ean13' = 'code128'): Promise<string> {
  try {
    // Gerar código de barras
    const png = await bwipjs.toBuffer({
      bcid: type,        // Tipo de código de barras
      text: text,        // Texto a ser codificado
      scale: 3,          // Escala
      height: 10,        // Altura em mm
      includetext: true, // Incluir texto abaixo do código
      textxalign: 'center',
    });
    
    // Converter para base64
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (error) {
    console.error('Erro ao gerar código de barras:', error);
    throw new Error('Falha ao gerar código de barras');
  }
}

/**
 * Gera QR Code em formato PNG base64
 * @param data Dados para codificar no QR code
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    // Gerar QR code
    const qrCode = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 200,
      margin: 1,
    });
    
    return qrCode;
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    throw new Error('Falha ao gerar QR code');
  }
}

/**
 * Gera dados completos de etiqueta com código de barras e QR code
 */
export async function generateLabel(data: LabelData): Promise<{
  barcode: string;
  qrcode: string;
  productName: string;
  price: string;
  sku: string;
  brand?: string;
  model?: string;
}> {
  // Gerar código de barras do SKU
  const barcode = await generateBarcode(data.sku);
  
  // Gerar QR code com informações do produto (JSON)
  const qrData = JSON.stringify({
    name: data.productName,
    price: data.price,
    sku: data.sku,
    brand: data.brand,
    model: data.model,
  });
  const qrcode = await generateQRCode(qrData);
  
  // Formatar preço
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.price / 100);
  
  return {
    barcode,
    qrcode,
    productName: data.productName,
    price: priceFormatted,
    sku: data.sku,
    brand: data.brand,
    model: data.model,
  };
}
