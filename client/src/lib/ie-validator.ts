/**
 * Validador de Inscrição Estadual (IE) por UF
 * Baseado nas regras da SEFAZ para cada estado.
 */

type ValidationFunction = (ie: string) => boolean;

const validators: Record<string, ValidationFunction> = {
  AC: (ie) => /^\d{2}\.\d{3}\.\d{3}\/\d{3}-\d{2}$/.test(ie) || /^\d{13}$/.test(ie.replace(/\D/g, '')),
  AL: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  AP: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  AM: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  BA: (ie) => /^\d{8}$/.test(ie.replace(/\D/g, '')) || /^\d{9}$/.test(ie.replace(/\D/g, '')),
  CE: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  DF: (ie) => /^\d{13}$/.test(ie.replace(/\D/g, '')),
  ES: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  GO: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  MA: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  MT: (ie) => /^\d{11}$/.test(ie.replace(/\D/g, '')),
  MS: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  MG: (ie) => /^\d{13}$/.test(ie.replace(/\D/g, '')),
  PA: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  PB: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  PR: (ie) => /^\d{10}$/.test(ie.replace(/\D/g, '')),
  PE: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  PI: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  RJ: (ie) => /^\d{8}$/.test(ie.replace(/\D/g, '')),
  RN: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  RS: (ie) => /^\d{10}$/.test(ie.replace(/\D/g, '')),
  RO: (ie) => /^\d{14}$/.test(ie.replace(/\D/g, '')),
  RR: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  SC: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  SP: (ie) => /^\d{12}$/.test(ie.replace(/\D/g, '')),
  SE: (ie) => /^\d{9}$/.test(ie.replace(/\D/g, '')),
  TO: (ie) => /^\d{11}$/.test(ie.replace(/\D/g, '')),
};

export function validateIE(ie: string, uf: string): boolean {
  if (!ie || ie.toUpperCase() === 'ISENTO') return true;
  
  const cleanIE = ie.replace(/\D/g, '');
  const validator = validators[uf.toUpperCase()];
  
  if (!validator) {
    // Se a UF não for reconhecida, aceita qualquer formato numérico básico
    return cleanIE.length >= 8;
  }
  
  return validator(ie);
}

export function getIEMask(uf: string): string {
  // Retorna a máscara ideal para a UF (simplificado)
  switch (uf.toUpperCase()) {
    case 'SP': return '000.000.000.000';
    case 'RJ': return '00.000.00-0';
    case 'MG': return '000.000.000/0000';
    case 'RS': return '000/0000000';
    default: return '';
  }
}
