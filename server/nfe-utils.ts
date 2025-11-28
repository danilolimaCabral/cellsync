/**
 * Utilitários para Nota Fiscal Eletrônica (NF-e)
 * Inclui validação de documentos, cálculo de impostos e formatação
 */

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, "");
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Todos os dígitos iguais
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, "");
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // Todos os dígitos iguais
  
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida CPF ou CNPJ
 */
export function validateDocument(document: string): boolean {
  const cleaned = document.replace(/[^\d]/g, "");
  if (cleaned.length === 11) return validateCPF(document);
  if (cleaned.length === 14) return validateCNPJ(document);
  return false;
}

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/[^\d]/g, "");
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  cnpj = cnpj.replace(/[^\d]/g, "");
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/**
 * Formata CPF ou CNPJ
 */
export function formatDocument(document: string): string {
  const cleaned = document.replace(/[^\d]/g, "");
  if (cleaned.length === 11) return formatCPF(document);
  if (cleaned.length === 14) return formatCNPJ(document);
  return document;
}

/**
 * Calcula ICMS
 * @param baseValue Valor base em centavos
 * @param rate Alíquota em centésimos de % (ex: 1800 = 18%)
 */
export function calculateICMS(baseValue: number, rate: number): {
  base: number;
  rate: number;
  value: number;
} {
  const value = Math.round((baseValue * rate) / 10000);
  return {
    base: baseValue,
    rate,
    value,
  };
}

/**
 * Calcula PIS
 * @param baseValue Valor base em centavos
 * @param rate Alíquota em centésimos de % (ex: 165 = 1.65%)
 */
export function calculatePIS(baseValue: number, rate: number = 165): {
  base: number;
  rate: number;
  value: number;
} {
  const value = Math.round((baseValue * rate) / 10000);
  return {
    base: baseValue,
    rate,
    value,
  };
}

/**
 * Calcula COFINS
 * @param baseValue Valor base em centavos
 * @param rate Alíquota em centésimos de % (ex: 760 = 7.6%)
 */
export function calculateCOFINS(baseValue: number, rate: number = 760): {
  base: number;
  rate: number;
  value: number;
} {
  const value = Math.round((baseValue * rate) / 10000);
  return {
    base: baseValue,
    rate,
    value,
  };
}

/**
 * Calcula IPI
 * @param baseValue Valor base em centavos
 * @param rate Alíquota em centésimos de % (ex: 1000 = 10%)
 */
export function calculateIPI(baseValue: number, rate: number): {
  base: number;
  rate: number;
  value: number;
} {
  const value = Math.round((baseValue * rate) / 10000);
  return {
    base: baseValue,
    rate,
    value,
  };
}

/**
 * Calcula todos os impostos de um item
 */
export function calculateItemTaxes(params: {
  totalPrice: number; // Preço total em centavos
  icmsRate?: number; // Alíquota ICMS em centésimos de %
  ipiRate?: number; // Alíquota IPI em centésimos de %
  pisRate?: number; // Alíquota PIS em centésimos de %
  cofinsRate?: number; // Alíquota COFINS em centésimos de %
}): {
  icms: { base: number; rate: number; value: number };
  ipi: { base: number; rate: number; value: number };
  pis: { base: number; rate: number; value: number };
  cofins: { base: number; rate: number; value: number };
} {
  const { totalPrice, icmsRate = 1800, ipiRate = 0, pisRate = 165, cofinsRate = 760 } = params;
  
  return {
    icms: calculateICMS(totalPrice, icmsRate),
    ipi: calculateIPI(totalPrice, ipiRate),
    pis: calculatePIS(totalPrice, pisRate),
    cofins: calculateCOFINS(totalPrice, cofinsRate),
  };
}

/**
 * Gera número da NF-e (sequencial)
 */
export function generateInvoiceNumber(lastNumber: number): number {
  return lastNumber + 1;
}

/**
 * Determina CFOP padrão baseado no tipo de operação
 */
export function getDefaultCFOP(type: "saida" | "entrada", state: string, sameState: boolean): string {
  if (type === "saida") {
    if (sameState) {
      return "5102"; // Venda de mercadoria dentro do estado
    } else {
      return "6102"; // Venda de mercadoria para outro estado
    }
  } else {
    if (sameState) {
      return "1102"; // Compra para comercialização dentro do estado
    } else {
      return "2102"; // Compra para comercialização de outro estado
    }
  }
}

/**
 * Determina CST do ICMS baseado no regime tributário
 */
export function getDefaultICMSCST(regime: "simples" | "normal"): string {
  if (regime === "simples") {
    return "102"; // Tributada pelo Simples Nacional sem permissão de crédito
  } else {
    return "000"; // Tributada integralmente
  }
}

/**
 * Determina CST do PIS/COFINS baseado no regime tributário
 */
export function getDefaultPISCOFINSCST(regime: "simples" | "normal"): string {
  if (regime === "simples") {
    return "99"; // Outras operações
  } else {
    return "01"; // Operação tributável com alíquota básica
  }
}
