import { js2xml } from "xml-js";
import type { Invoice, InvoiceItem } from "../drizzle/schema";

interface NFEData extends Invoice {
  items: InvoiceItem[];
}

/**
 * Gera o XML da NF-e conforme layout SEFAZ 4.0
 * Nota: Esta é uma versão simplificada para demonstração.
 * Em produção, use uma biblioteca completa como node-nfe ou integre com API de emissão.
 */
export function generateNFeXML(nfe: NFEData): string {
  const now = new Date();
  const dhEmi = now.toISOString();
  const dhSaiEnt = now.toISOString();

  // Chave de acesso simulada (43 dígitos)
  // Formato: UF + AAMM + CNPJ + Modelo + Série + Número + Tipo Emissão + Código Numérico + DV
  const chaveAcesso = generateAccessKey(nfe);

  const nfeXML = {
    _declaration: {
      _attributes: {
        version: "1.0",
        encoding: "UTF-8",
      },
    },
    NFe: {
      _attributes: {
        xmlns: "http://www.portalfiscal.inf.br/nfe",
      },
      infNFe: {
        _attributes: {
          versao: "4.00",
          Id: `NFe${chaveAcesso}`,
        },
        ide: {
          cUF: { _text: "52" }, // Goiás
          cNF: { _text: String(nfe.number).padStart(8, "0") },
          natOp: { _text: nfe.natureOperation },
          mod: { _text: "55" }, // Modelo 55 (NF-e)
          serie: { _text: String(nfe.series) },
          nNF: { _text: String(nfe.number) },
          dhEmi: { _text: dhEmi },
          dhSaiEnt: { _text: dhSaiEnt },
          tpNF: { _text: "1" }, // 1=Saída
          idDest: { _text: "1" }, // 1=Operação interna
          cMunFG: { _text: "5208707" }, // Goiânia
          tpImp: { _text: "1" }, // 1=DANFE normal, Retrato
          tpEmis: { _text: "1" }, // 1=Emissão normal
          tpAmb: { _text: "2" }, // 2=Homologação (usar 1 em produção)
          finNFe: { _text: "1" }, // 1=NF-e normal
          indFinal: { _text: "1" }, // 1=Consumidor final
          indPres: { _text: "1" }, // 1=Operação presencial
          procEmi: { _text: "0" }, // 0=Emissão própria
          verProc: { _text: "CellSync 1.0" },
        },
        emit: {
          CNPJ: { _text: nfe.emitterCnpj.replace(/\D/g, "") },
          xNome: { _text: nfe.emitterName },
          xFant: { _text: nfe.emitterName },
          enderEmit: {
            xLgr: { _text: nfe.emitterAddress || "Rua Exemplo" },
            nro: { _text: "123" },
            xBairro: { _text: "Centro" },
            cMun: { _text: "5208707" },
            xMun: { _text: nfe.emitterCity || "Goiânia" },
            UF: { _text: nfe.emitterState || "GO" },
            CEP: { _text: nfe.emitterZipCode?.replace(/\D/g, "") || "74000000" },
            cPais: { _text: "1058" },
            xPais: { _text: "Brasil" },
            fone: { _text: "" },
          },
          IE: { _text: "ISENTO" },
          CRT: { _text: "3" }, // 3=Regime Normal
        },
        dest: {
          ...(nfe.recipientDocument.length === 11
            ? { CPF: { _text: nfe.recipientDocument.replace(/\D/g, "") } }
            : { CNPJ: { _text: nfe.recipientDocument.replace(/\D/g, "") } }),
          xNome: { _text: nfe.recipientName },
          enderDest: {
            xLgr: { _text: nfe.recipientAddress || "Rua do Cliente" },
            nro: { _text: "456" },
            xBairro: { _text: "Bairro" },
            cMun: { _text: "5208707" },
            xMun: { _text: nfe.recipientCity || "Goiânia" },
            UF: { _text: nfe.recipientState || "GO" },
            CEP: { _text: nfe.recipientZipCode?.replace(/\D/g, "") || "74000000" },
            cPais: { _text: "1058" },
            xPais: { _text: "Brasil" },
            fone: { _text: nfe.recipientPhone?.replace(/\D/g, "") || "" },
          },
          indIEDest: { _text: "9" }, // 9=Não Contribuinte
          email: { _text: nfe.recipientEmail || "" },
        },
        det: nfe.items.map((item, index) => ({
          _attributes: { nItem: String(index + 1) },
          prod: {
            cProd: { _text: String(item.productId) },
            cEAN: { _text: "SEM GTIN" },
            xProd: { _text: item.description },
            NCM: { _text: item.ncm },
            CFOP: { _text: item.cfop },
            uCom: { _text: item.unit },
            qCom: { _text: (item.quantity / 100).toFixed(2) },
            vUnCom: { _text: (item.unitPrice / 100).toFixed(2) },
            vProd: { _text: (item.totalPrice / 100).toFixed(2) },
            cEANTrib: { _text: "SEM GTIN" },
            uTrib: { _text: item.unit },
            qTrib: { _text: (item.quantity / 100).toFixed(2) },
            vUnTrib: { _text: (item.unitPrice / 100).toFixed(2) },
            indTot: { _text: "1" }, // 1=Compõe total da NF-e
          },
          imposto: {
            ICMS: {
              ICMS00: {
                orig: { _text: "0" }, // 0=Nacional
                CST: { _text: "00" }, // 00=Tributada integralmente
                modBC: { _text: "3" }, // 3=Valor da operação
                vBC: { _text: (item.icmsBase / 100).toFixed(2) },
                pICMS: { _text: (item.icmsRate / 100).toFixed(2) },
                vICMS: { _text: (item.icmsValue / 100).toFixed(2) },
              },
            },
            PIS: {
              PISAliq: {
                CST: { _text: "01" }, // 01=Operação Tributável
                vBC: { _text: (item.pisBase / 100).toFixed(2) },
                pPIS: { _text: (item.pisRate / 100).toFixed(2) },
                vPIS: { _text: (item.pisValue / 100).toFixed(2) },
              },
            },
            COFINS: {
              COFINSAliq: {
                CST: { _text: "01" }, // 01=Operação Tributável
                vBC: { _text: (item.cofinsBase / 100).toFixed(2) },
                pCOFINS: { _text: (item.cofinsRate / 100).toFixed(2) },
                vCOFINS: { _text: (item.cofinsValue / 100).toFixed(2) },
              },
            },
          },
        })),
        total: {
          ICMSTot: {
            vBC: { _text: (nfe.totalProducts / 100).toFixed(2) },
            vICMS: { _text: (nfe.totalIcms / 100).toFixed(2) },
            vICMSDeson: { _text: "0.00" },
            vFCP: { _text: "0.00" },
            vBCST: { _text: "0.00" },
            vST: { _text: "0.00" },
            vFCPST: { _text: "0.00" },
            vFCPSTRet: { _text: "0.00" },
            vProd: { _text: (nfe.totalProducts / 100).toFixed(2) },
            vFrete: { _text: (nfe.totalFreight / 100).toFixed(2) },
            vSeg: { _text: (nfe.totalInsurance / 100).toFixed(2) },
            vDesc: { _text: (nfe.totalDiscount / 100).toFixed(2) },
            vII: { _text: "0.00" },
            vIPI: { _text: (nfe.totalIpi / 100).toFixed(2) },
            vIPIDevol: { _text: "0.00" },
            vPIS: { _text: (nfe.totalPis / 100).toFixed(2) },
            vCOFINS: { _text: (nfe.totalCofins / 100).toFixed(2) },
            vOutro: { _text: (nfe.totalOtherExpenses / 100).toFixed(2) },
            vNF: { _text: (nfe.totalInvoice / 100).toFixed(2) },
          },
        },
        transp: {
          modFrete: { _text: "9" }, // 9=Sem frete
        },
        pag: {
          detPag: {
            indPag: { _text: nfe.paymentIndicator === "a_vista" ? "0" : "1" },
            tPag: {
              _text:
                nfe.paymentMethod === "dinheiro"
                  ? "01"
                  : nfe.paymentMethod === "pix"
                  ? "17"
                  : nfe.paymentMethod === "cartao_credito"
                  ? "03"
                  : nfe.paymentMethod === "cartao_debito"
                  ? "04"
                  : "99",
            },
            vPag: { _text: (nfe.totalInvoice / 100).toFixed(2) },
          },
        },
        infAdic: {
          infCpl: {
            _text: nfe.additionalInfo || "Nota Fiscal emitida pelo sistema CellSync",
          },
        },
      },
    },
  };

  return js2xml(nfeXML, { compact: true, spaces: 2 });
}

/**
 * Gera uma chave de acesso simulada para a NF-e
 * Formato: UF(2) + AAMM(4) + CNPJ(14) + Mod(2) + Serie(3) + Numero(9) + TpEmis(1) + CodNum(8) + DV(1)
 */
function generateAccessKey(nfe: NFEData): string {
  const uf = "52"; // Goiás
  const aamm = new Date().toISOString().slice(2, 7).replace("-", ""); // AAMM
  const cnpj = nfe.emitterCnpj.replace(/\D/g, "").padStart(14, "0");
  const mod = "55"; // Modelo 55
  const serie = String(nfe.series).padStart(3, "0");
  const numero = String(nfe.number).padStart(9, "0");
  const tpEmis = "1"; // Emissão normal
  const codNum = String(Math.floor(Math.random() * 100000000)).padStart(8, "0");

  const chave = uf + aamm + cnpj + mod + serie + numero + tpEmis + codNum;
  const dv = calculateDV(chave);

  return chave + dv;
}

/**
 * Calcula o dígito verificador da chave de acesso
 */
function calculateDV(chave: string): string {
  const pesos = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let soma = 0;
  for (let i = 0; i < chave.length; i++) {
    soma += parseInt(chave[i]) * pesos[i];
  }

  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;

  return String(dv);
}

/**
 * Gera a URL do QR Code para consulta da NF-e
 */
export function generateQRCodeURL(nfe: NFEData): string {
  const chaveAcesso = generateAccessKey(nfe);
  const ambiente = "2"; // 2=Homologação
  const tpEmis = "1"; // 1=Emissão normal
  
  // URL base do portal da SEFAZ para consulta
  const baseURL = "http://www.fazenda.go.gov.br/nfeweb/sites/consulta.jsp";
  
  return `${baseURL}?chNFe=${chaveAcesso}&tpAmb=${ambiente}&tpEmis=${tpEmis}`;
}
