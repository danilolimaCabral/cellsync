/**
 * Módulo de consulta de CNPJ usando ReceitaWS (API gratuita)
 * Documentação: https://receitaws.com.br/api
 * Limite: 3 consultas por minuto
 */

interface ReceitaWSResponse {
  status: string;
  message?: string;
  cnpj: string;
  nome: string; // Razão Social
  fantasia: string; // Nome Fantasia
  abertura: string;
  situacao: string;
  tipo: string;
  porte: string;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  email: string;
  telefone: string;
  efr: string;
  motivo_situacao: string;
  situacao_especial: string;
  data_situacao_especial: string;
  capital_social: string;
  qsa: Array<{
    nome: string;
    qual: string;
  }>;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  atividades_secundarias: Array<{
    code: string;
    text: string;
  }>;
  billing: {
    free: boolean;
    database: boolean;
  };
}

export interface CNPJData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  email: string;
  telefone: string;
}

/**
 * Valida formato de CNPJ (apenas dígitos, 14 caracteres)
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) {
    return false;
  }

  // Validação de dígitos verificadores
  let tamanho = cleaned.length - 2;
  let numeros = cleaned.substring(0, tamanho);
  const digitos = cleaned.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return false;
  }

  tamanho = tamanho + 1;
  numeros = cleaned.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return false;
  }

  return true;
}

/**
 * Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Consulta dados de CNPJ na ReceitaWS
 */
export async function lookupCNPJ(cnpj: string): Promise<CNPJData> {
  const cleaned = cnpj.replace(/\D/g, '');

  if (!validateCNPJ(cleaned)) {
    throw new Error('CNPJ inválido');
  }

  try {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleaned}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Limite de consultas excedido. Aguarde 1 minuto e tente novamente.');
      }
      throw new Error('Erro ao consultar CNPJ');
    }

    const data: ReceitaWSResponse = await response.json();

    if (data.status === 'ERROR') {
      throw new Error(data.message || 'CNPJ não encontrado');
    }

    return {
      cnpj: formatCNPJ(data.cnpj),
      razaoSocial: data.nome,
      nomeFantasia: data.fantasia || data.nome,
      situacao: data.situacao,
      cep: data.cep.replace(/\D/g, ''),
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      email: data.email,
      telefone: data.telefone,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao consultar CNPJ');
  }
}
