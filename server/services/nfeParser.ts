import { DOMParser } from "@xmldom/xmldom";

export interface NFeProduct {
  code: string;
  name: string;
  ncm: string;
  cfop: string;
  uCom: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ean: string;
}

export interface NFeData {
  accessKey: string;
  number: string;
  series: string;
  date: string;
  issuer: {
    cnpj: string;
    name: string;
    tradeName: string;
  };
  products: NFeProduct[];
}

/**
 * Faz o parse de um XML de NFe (procNFe ou NFe) e extrai os dados
 */
export function parseNFeXML(xmlContent: string): NFeData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  // Helper para pegar valor de tag
  const getTagValue = (parent: Element | Document, tagName: string): string => {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0].textContent || "" : "";
  };

  // Dados da NFe
  const ide = doc.getElementsByTagName("ide")[0];
  const emit = doc.getElementsByTagName("emit")[0];
  const infNFe = doc.getElementsByTagName("infNFe")[0];
  
  if (!ide || !emit || !infNFe) {
    throw new Error("XML inválido: tags ide, emit ou infNFe não encontradas");
  }

  const accessKey = infNFe.getAttribute("Id")?.replace("NFe", "") || "";
  const number = getTagValue(ide, "nNF");
  const series = getTagValue(ide, "serie");
  const date = getTagValue(ide, "dhEmi");

  // Dados do Emitente
  const issuer = {
    cnpj: getTagValue(emit, "CNPJ"),
    name: getTagValue(emit, "xNome"),
    tradeName: getTagValue(emit, "xFant"),
  };

  // Produtos
  const detTags = doc.getElementsByTagName("det");
  const products: NFeProduct[] = [];

  for (let i = 0; i < detTags.length; i++) {
    const prod = detTags[i].getElementsByTagName("prod")[0];
    if (prod) {
      products.push({
        code: getTagValue(prod, "cProd"),
        name: getTagValue(prod, "xProd"),
        ncm: getTagValue(prod, "NCM"),
        cfop: getTagValue(prod, "CFOP"),
        uCom: getTagValue(prod, "uCom"),
        quantity: parseFloat(getTagValue(prod, "qCom")),
        unitPrice: parseFloat(getTagValue(prod, "vUnCom")),
        totalPrice: parseFloat(getTagValue(prod, "vProd")),
        ean: getTagValue(prod, "cEAN"),
      });
    }
  }

  return {
    accessKey,
    number,
    series,
    date,
    issuer,
    products,
  };
}
