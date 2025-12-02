/**
 * Parser de XML de NF-e (Nota Fiscal Eletrônica)
 * Extrai produtos, fornecedor e valores de XMLs de NF-e de entrada
 */

import { XMLParser } from 'fast-xml-parser';

export interface ParsedProduct {
  code: string;
  name: string;
  ncm: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ean?: string;
  unit: string;
}

export interface ParsedSupplier {
  cnpj: string;
  name: string;
  fantasyName?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface ParsedNFe {
  nfeKey: string;
  number: string;
  series: string;
  issueDate: Date;
  supplier: ParsedSupplier;
  products: ParsedProduct[];
  totalValue: number;
  icmsValue: number;
  ipiValue: number;
}

/**
 * Parse XML de NF-e e extrai informações relevantes
 */
export function parseNFeXML(xmlContent: string): ParsedNFe {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed = parser.parse(xmlContent);

  // Navegação no XML da NF-e (layout 4.00)
  const nfe = parsed.nfeProc?.NFe || parsed.NFe;
  if (!nfe) {
    throw new Error('XML inválido: não é uma NF-e');
  }

  const infNFe = nfe.infNFe;
  const ide = infNFe.ide;
  const emit = infNFe.emit;
  const det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
  const total = infNFe.total.ICMSTot;

  // Extrair chave da NF-e
  const nfeKey = infNFe['@_Id'].replace('NFe', '');

  // Extrair fornecedor
  const supplier: ParsedSupplier = {
    cnpj: emit.CNPJ,
    name: emit.xNome,
    fantasyName: emit.xFant,
    address: emit.enderEmit?.xLgr,
    city: emit.enderEmit?.xMun,
    state: emit.enderEmit?.UF,
  };

  // Extrair produtos
  const products: ParsedProduct[] = det.map((item: any) => {
    const prod = item.prod;
    const quantity = parseFloat(prod.qCom);
    const unitPrice = parseFloat(prod.vUnCom);

    return {
      code: prod.cProd,
      name: prod.xProd,
      ncm: prod.NCM,
      quantity,
      unitPrice,
      totalPrice: parseFloat(prod.vProd),
      ean: prod.cEAN !== 'SEM GTIN' ? prod.cEAN : undefined,
      unit: prod.uCom,
    };
  });

  // Extrair totais
  const totalValue = parseFloat(total.vNF);
  const icmsValue = parseFloat(total.vICMS || '0');
  const ipiValue = parseFloat(total.vIPI || '0');

  // Extrair data de emissão
  const issueDateStr = ide.dhEmi || ide.dEmi;
  const issueDate = new Date(issueDateStr);

  return {
    nfeKey,
    number: ide.nNF,
    series: ide.serie,
    issueDate,
    supplier,
    products,
    totalValue,
    icmsValue,
    ipiValue,
  };
}

/**
 * Valida se o XML é uma NF-e válida
 */
export function isValidNFeXML(xmlContent: string): boolean {
  try {
    const parser = new XMLParser();
    const parsed = parser.parse(xmlContent);
    return !!(parsed.nfeProc?.NFe || parsed.NFe);
  } catch {
    return false;
  }
}

/**
 * Extrai apenas a chave da NF-e do XML (para verificação de duplicatas)
 */
export function extractNFeKey(xmlContent: string): string | null {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const parsed = parser.parse(xmlContent);
    const nfe = parsed.nfeProc?.NFe || parsed.NFe;
    if (!nfe) return null;
    
    const infNFe = nfe.infNFe;
    return infNFe['@_Id'].replace('NFe', '');
  } catch {
    return null;
  }
}
