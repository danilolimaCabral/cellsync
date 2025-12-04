import { create } from "xmlbuilder2";
import { SignedXml } from "xml-crypto";
import { DOMParser } from "xmldom";
import forge from "node-forge";
import { getDb } from "../db";
import { digitalCertificates, fiscalSettings, sales, saleItems, products, customers, tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface NFeData {
  ide: any;
  emit: any;
  dest: any;
  det: any[];
  total: any;
  transp: any;
  pag: any;
  infAdic: any;
}

export class NFeService {
  // 1. Gerar XML da NFe
  async generateXML(saleId: number, tenantId: number): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Buscar dados completos da venda
    const sale = await db.query.sales.findFirst({
      where: eq(sales.id, saleId),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    });

    if (!sale) throw new Error("Venda não encontrada");
    if (sale.tenantId !== tenantId) throw new Error("Acesso negado à venda");

    const customer = sale.customerId 
      ? await db.query.customers.findFirst({ where: eq(customers.id, sale.customerId) })
      : null;

    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    const settings = await db.query.fiscalSettings.findFirst({ where: eq(fiscalSettings.tenantId, tenantId) });

    if (!tenant || !settings) throw new Error("Configurações fiscais incompletas");

    // Montar objeto de dados da NFe (Simplificado para MVP)
    const nfeData = this.buildNFeData(sale, customer, tenant, settings);

    // Converter para XML
    const xml = this.buildXML(nfeData);
    
    return xml;
  }

  // 2. Assinar XML
  async signXML(xml: string, tenantId: number): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const settings = await db.query.fiscalSettings.findFirst({ where: eq(fiscalSettings.tenantId, tenantId) });
    if (!settings?.certificateId) throw new Error("Certificado digital não configurado");

    const certificate = await db.query.digitalCertificates.findFirst({
      where: eq(digitalCertificates.id, settings.certificateId)
    });

    if (!certificate) throw new Error("Certificado não encontrado");

    // Tentar carregar certificado real se configurado, senão usar mock
    let pemKey: string;
    let pemCert: string;

    try {
      // Tentar importar storage dinamicamente para evitar erro de inicialização se env vars faltarem
      const { storageGet } = await import("../storage");
      
      // Se tiver URL do arquivo e credenciais de storage, tentar baixar
      if (certificate.fileUrl && process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY) {
        const { url } = await storageGet(certificate.fileUrl);
        const response = await fetch(url);
        const pfxBuffer = await response.arrayBuffer();
        
        // Decodificar PFX
        const p12 = forge.pkcs12.pkcs12FromAsn1(
          forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer).getBytes()), 
          certificate.password
        );
        
        // Extrair chave privada
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key;
        if (!key) throw new Error("Chave privada não encontrada no certificado");
        pemKey = forge.pki.privateKeyToPem(key);
        
        // Extrair certificado público
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const cert = certBags[forge.pki.oids.certBag]![0].cert;
        if (!cert) throw new Error("Certificado público não encontrado no arquivo");
        
        pemCert = forge.pki.certificateToPem(cert)
          .replace('-----BEGIN CERTIFICATE-----', '')
          .replace('-----END CERTIFICATE-----', '')
          .replace(/\r\n/g, '')
          .replace(/\n/g, '');
      } else {
        throw new Error("Storage credentials missing or fileUrl empty");
      }
    } catch (error) {
      console.warn("Usando certificado de teste (Mock) pois o real falhou ou não está configurado:", error);
      
      // Fallback: Gerar par de chaves RSA temporário para assinar (Mock)
      const keys = forge.pki.rsa.generateKeyPair(2048);
      pemKey = forge.pki.privateKeyToPem(keys.privateKey);
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
      const attrs = [{ name: 'commonName', value: 'CellSync Test Certificate' }];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.sign(keys.privateKey);
      pemCert = forge.pki.certificateToPem(cert)
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\r\n/g, '')
        .replace(/\n/g, '');
    }

    const sig = new SignedXml();
    sig.addReference("//*[local-name(.)='infNFe']", [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
    ], "http://www.w3.org/2000/09/xmldsig#sha1");

    sig.signingKey = pemKey;
    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${pemCert}</X509Certificate></X509Data>`
    };

    sig.computeSignature(xml);
    return sig.getSignedXml();
  }

  private buildNFeData(sale: any, customer: any, tenant: any, settings: any): NFeData {
    const now = new Date();
    const accessKey = this.generateAccessKey(tenant.state || '35', now, tenant.cnpj, settings.series, settings.nextNfeNumber);

    return {
      ide: {
        cUF: this.getStateCode(tenant.state || 'SP'),
        cNF: Math.floor(Math.random() * 99999999),
        natOp: "VENDA DE MERCADORIA",
        mod: "55",
        serie: settings.series,
        nNF: settings.nextNfeNumber,
        dhEmi: now.toISOString(),
        tpNF: "1", // 1=Saída
        idDest: "1", // 1=Interna
        cMunFG: "3550308", // Código IBGE SP (Exemplo)
        tpImp: "1", // Retrato
        tpEmis: "1", // Normal
        cDV: accessKey.slice(-1),
        tpAmb: settings.environment === "producao" ? "1" : "2",
        finNFe: "1", // Normal
        indFinal: "1", // Consumidor final
        indPres: "1", // Presencial
        procEmi: "0", // App do contribuinte
        verProc: "CellSync 1.0",
        chave: accessKey
      },
      emit: {
        CNPJ: tenant.cnpj?.replace(/\D/g, ''),
        xNome: tenant.name,
        xFant: tenant.name,
        enderEmit: {
          xLgr: "Rua Exemplo",
          nro: "123",
          xBairro: "Centro",
          cMun: "3550308",
          xMun: "Sao Paulo",
          UF: tenant.state || "SP",
          CEP: "01001000",
          cPais: "1058",
          xPais: "BRASIL",
          fone: "11999999999"
        },
        IE: "ISENTO", // Deveria vir do cadastro
        CRT: settings.simpleNational ? "1" : "3"
      },
      dest: customer ? {
        CNPJ: customer.cnpj?.replace(/\D/g, '') || undefined,
        CPF: customer.cpf?.replace(/\D/g, '') || undefined,
        xNome: customer.name,
        enderDest: {
          xLgr: customer.address || "Rua Desconhecida",
          nro: "S/N",
          xBairro: "Bairro",
          cMun: "3550308",
          xMun: customer.city || "Sao Paulo",
          UF: customer.state || "SP",
          CEP: customer.zipCode?.replace(/\D/g, '') || "00000000",
          cPais: "1058",
          xPais: "BRASIL"
        },
        indIEDest: "9" // Não contribuinte
      } : undefined,
      det: sale.items.map((item: any, index: number) => ({
        nItem: index + 1,
        prod: {
          cProd: item.product.sku || `PROD${item.product.id}`,
          cEAN: "SEM GTIN",
          xProd: item.product.name,
          NCM: settings.defaultNcm || "00000000",
          CFOP: "5102",
          uCom: "UN",
          qCom: item.quantity,
          vUnCom: (item.unitPrice / 100).toFixed(2),
          vProd: (item.totalPrice / 100).toFixed(2),
          cEANTrib: "SEM GTIN",
          uTrib: "UN",
          qTrib: item.quantity,
          vUnTrib: (item.unitPrice / 100).toFixed(2),
          indTot: "1"
        },
        imposto: {
          ICMS: {
            ICMSSN102: { // Simples Nacional sem permissão de crédito
              orig: "0",
              CSOSN: "102"
            }
          },
          PIS: {
            PISOutr: {
              CST: "99",
              vBC: "0.00",
              pPIS: "0.00",
              vPIS: "0.00"
            }
          },
          COFINS: {
            COFINSOutr: {
              CST: "99",
              vBC: "0.00",
              pCOFINS: "0.00",
              vCOFINS: "0.00"
            }
          }
        }
      })),
      total: {
        ICMSTot: {
          vBC: "0.00",
          vICMS: "0.00",
          vICMSDeson: "0.00",
          vFCP: "0.00",
          vBCST: "0.00",
          vST: "0.00",
          vFCPST: "0.00",
          vFCPSTRet: "0.00",
          vProd: (sale.finalAmount / 100).toFixed(2),
          vFrete: "0.00",
          vSeg: "0.00",
          vDesc: "0.00",
          vII: "0.00",
          vIPI: "0.00",
          vIPIDevol: "0.00",
          vPIS: "0.00",
          vCOFINS: "0.00",
          vOutro: "0.00",
          vNF: (sale.finalAmount / 100).toFixed(2)
        }
      },
      transp: {
        modFrete: "9" // Sem frete
      },
      pag: {
        detPag: {
          tPag: "01", // Dinheiro (exemplo)
          vPag: (sale.finalAmount / 100).toFixed(2)
        }
      },
      infAdic: {
        infCpl: "Documento emitido por ME ou EPP optante pelo Simples Nacional."
      }
    };
  }

  private buildXML(data: NFeData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('NFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe' })
        .ele('infNFe', { Id: `NFe${data.ide.chave}`, versao: '4.00' });

    // IDE
    const ide = doc.ele('ide');
    Object.entries(data.ide).forEach(([key, value]) => {
      if (key !== 'chave') ide.ele(key).txt(String(value));
    });

    // EMIT
    const emit = doc.ele('emit');
    emit.ele('CNPJ').txt(data.emit.CNPJ);
    emit.ele('xNome').txt(data.emit.xNome);
    if (data.emit.xFant) emit.ele('xFant').txt(data.emit.xFant);
    
    const enderEmit = emit.ele('enderEmit');
    Object.entries(data.emit.enderEmit).forEach(([key, value]) => enderEmit.ele(key).txt(String(value)));
    
    emit.ele('IE').txt(data.emit.IE);
    emit.ele('CRT').txt(data.emit.CRT);

    // DEST
    if (data.dest) {
      const dest = doc.ele('dest');
      if (data.dest.CNPJ) dest.ele('CNPJ').txt(data.dest.CNPJ);
      if (data.dest.CPF) dest.ele('CPF').txt(data.dest.CPF);
      dest.ele('xNome').txt(data.dest.xNome);
      
      const enderDest = dest.ele('enderDest');
      Object.entries(data.dest.enderDest).forEach(([key, value]) => enderDest.ele(key).txt(String(value)));
      
      dest.ele('indIEDest').txt(data.dest.indIEDest);
    }

    // DET (Itens)
    data.det.forEach((item) => {
      const det = doc.ele('det', { nItem: String(item.nItem) });
      
      const prod = det.ele('prod');
      Object.entries(item.prod).forEach(([key, value]) => prod.ele(key).txt(String(value)));
      
      const imposto = det.ele('imposto');
      // ICMS
      const icms = imposto.ele('ICMS');
      const icmsSn = icms.ele('ICMSSN102');
      Object.entries(item.imposto.ICMS.ICMSSN102).forEach(([key, value]) => icmsSn.ele(key).txt(String(value)));
      
      // PIS
      const pis = imposto.ele('PIS');
      const pisOutr = pis.ele('PISOutr');
      Object.entries(item.imposto.PIS.PISOutr).forEach(([key, value]) => pisOutr.ele(key).txt(String(value)));
      
      // COFINS
      const cofins = imposto.ele('COFINS');
      const cofinsOutr = cofins.ele('COFINSOutr');
      Object.entries(item.imposto.COFINS.COFINSOutr).forEach(([key, value]) => cofinsOutr.ele(key).txt(String(value)));
    });

    // TOTAL
    const total = doc.ele('total');
    const icmsTot = total.ele('ICMSTot');
    Object.entries(data.total.ICMSTot).forEach(([key, value]) => icmsTot.ele(key).txt(String(value)));

    // TRANSP
    const transp = doc.ele('transp');
    transp.ele('modFrete').txt(data.transp.modFrete);

    // PAG
    const pag = doc.ele('pag');
    const detPag = pag.ele('detPag');
    Object.entries(data.pag.detPag).forEach(([key, value]) => detPag.ele(key).txt(String(value)));

    // INFADIC
    const infAdic = doc.ele('infAdic');
    infAdic.ele('infCpl').txt(data.infAdic.infCpl);

    return doc.end({ prettyPrint: false }); // XML sem formatação para assinatura
  }

  private generateAccessKey(uf: string, date: Date, cnpj: string, serie: number, nNF: number): string {
    const cUF = this.getStateCode(uf);
    const AAMM = date.toISOString().slice(2, 4) + date.toISOString().slice(5, 7);
    const CNPJ = cnpj.replace(/\D/g, '');
    const mod = "55";
    const serieStr = String(serie).padStart(3, '0');
    const nNFStr = String(nNF).padStart(9, '0');
    const tpEmis = "1";
    const cNF = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
    
    const keyBase = `${cUF}${AAMM}${CNPJ}${mod}${serieStr}${nNFStr}${tpEmis}${cNF}`;
    const dv = this.calculateDV(keyBase);
    
    return `${keyBase}${dv}`;
  }

  private getStateCode(uf: string): string {
    const codes: Record<string, string> = {
      'SP': '35', 'RJ': '33', 'MG': '31', 'RS': '43', 'PR': '41',
      'SC': '42', 'ES': '32', 'BA': '29', 'PE': '26', 'CE': '23'
    };
    return codes[uf] || '35';
  }

  private calculateDV(key: string): number {
    let weight = 2;
    let sum = 0;
    for (let i = key.length - 1; i >= 0; i--) {
      sum += parseInt(key[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}

export const nfeService = new NFeService();
