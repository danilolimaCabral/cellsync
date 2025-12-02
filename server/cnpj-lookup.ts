/**
 * Módulo de consulta de CNPJ na Receita Federal
 * Utiliza múltiplas APIs com fallback automático:
 * 1. ReceitaWS (API Pública - 3 consultas/minuto, cache)
 * 2. BrasilAPI (fallback se ReceitaWS falhar)
 */

export interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  data_inicio_atividade: string;
  
  // Endereço
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  
  // Contato
  ddd_telefone_1: string;
  ddd_telefone_2?: string;
  email?: string;
  
  // Situação
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral?: string;
  
  // Outros
  porte: string;
  capital_social: number;
  natureza_juridica: string;
  
  // Sócios
  qsa?: Array<{
    nome: string;
    qual: string;
    pais_origem?: string;
    nome_rep_legal?: string;
    qual_rep_legal?: string;
  }>;
}

/**
 * Limpa e formata CNPJ (remove pontos, barras e hífens)
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '');
}

/**
 * Formata CNPJ com pontos, barra e hífen
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanCNPJ(cnpj);
  if (cleaned.length !== 14) {
    return cnpj; // Retorna original se inválido
  }
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Valida CNPJ usando algoritmo de dígito verificador
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanCNPJ(cnpj);
  
  if (cleaned.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1+$/.test(cleaned)) {
    return false;
  }
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  if (parseInt(cleaned[12]) !== digit1) {
    return false;
  }
  
  // Calcula segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return parseInt(cleaned[13]) === digit2;
}

/**
 * Consulta CNPJ na ReceitaWS (API Pública - Prioridade 1)
 */
async function lookupReceitaWS(cnpj: string): Promise<CNPJData | null> {
  const cleaned = cleanCNPJ(cnpj);
  
  try {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleaned}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // CNPJ não encontrado no cache
      }
      throw new Error(`ReceitaWS: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verificar se retornou erro
    if (data.status === 'ERROR') {
      return null;
    }
    
    // Mapear campos da ReceitaWS para o formato padrão
    return {
      cnpj: cleanCNPJ(data.cnpj), // Limpar formato (ReceitaWS retorna formatado)
      razao_social: data.nome,
      nome_fantasia: data.fantasia || data.nome,
      cnae_fiscal: parseInt(data.atividade_principal?.[0]?.code || '0'),
      cnae_fiscal_descricao: data.atividade_principal?.[0]?.text || '',
      data_inicio_atividade: data.abertura,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      cep: data.cep,
      ddd_telefone_1: data.telefone,
      email: data.email,
      situacao_cadastral: data.situacao,
      data_situacao_cadastral: data.data_situacao,
      motivo_situacao_cadastral: data.motivo_situacao,
      porte: data.porte,
      capital_social: parseFloat(data.capital_social || '0'),
      natureza_juridica: data.natureza_juridica,
      qsa: data.qsa?.map((socio: any) => ({
        nome: socio.nome,
        qual: socio.qual,
        pais_origem: socio.pais_origem,
        nome_rep_legal: socio.nome_rep_legal,
        qual_rep_legal: socio.qual_rep_legal,
      })),
    };
  } catch (error) {
    console.error('Erro ReceitaWS:', error);
    throw error;
  }
}

/**
 * Consulta CNPJ na BrasilAPI (Fallback - Prioridade 2)
 */
async function lookupBrasilAPI(cnpj: string): Promise<CNPJData | null> {
  const cleaned = cleanCNPJ(cnpj);
  
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`BrasilAPI: ${response.status}`);
    }
    
    const data = await response.json();
    return data as CNPJData;
  } catch (error) {
    console.error('Erro BrasilAPI:', error);
    throw error;
  }
}

/**
 * Consulta CNPJ com fallback automático entre APIs
 */
export async function lookupCNPJ(cnpj: string): Promise<CNPJData | null> {
  const cleaned = cleanCNPJ(cnpj);
  
  // Validar CNPJ antes de consultar
  if (!validateCNPJ(cleaned)) {
    throw new Error('CNPJ inválido');
  }
  
  // Tentar ReceitaWS primeiro (mais confiável, cache local)
  try {
    console.log('Tentando ReceitaWS...');
    const result = await lookupReceitaWS(cleaned);
    if (result) {
      console.log('✓ ReceitaWS: sucesso');
      return result;
    }
  } catch (error: any) {
    console.warn('ReceitaWS falhou:', error.message);
  }
  
  // Fallback para BrasilAPI
  try {
    console.log('Tentando BrasilAPI (fallback)...');
    const result = await lookupBrasilAPI(cleaned);
    if (result) {
      console.log('✓ BrasilAPI: sucesso');
      return result;
    }
  } catch (error: any) {
    console.warn('BrasilAPI falhou:', error.message);
  }
  
  // Se ambas falharam, retornar null
  return null;
}

/**
 * Extrai dados essenciais para uso no sistema
 */
export interface CompanyBasicData {
  cnpj: string;
  cnpjFormatted: string;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  enderecoCompleto: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string | null;
  situacao: string;
  porte: string;
}

/**
 * Converte dados da API para formato simplificado do sistema
 */
export function extractBasicData(cnpjData: CNPJData): CompanyBasicData {
  // Montar endereço completo
  const enderecoPartes = [
    cnpjData.logradouro,
    cnpjData.numero,
    cnpjData.complemento,
  ].filter(Boolean);
  
  const endereco = enderecoPartes.join(', ');
  
  const enderecoCompleto = [
    endereco,
    cnpjData.bairro,
    `${cnpjData.municipio}/${cnpjData.uf}`,
    `CEP: ${cnpjData.cep}`,
  ].filter(Boolean).join(' - ');
  
  // Formatar telefone
  const telefone = cnpjData.ddd_telefone_1 || '';
  
  return {
    cnpj: cnpjData.cnpj,
    cnpjFormatted: formatCNPJ(cnpjData.cnpj),
    razaoSocial: cnpjData.razao_social,
    nomeFantasia: cnpjData.nome_fantasia || cnpjData.razao_social,
    endereco,
    enderecoCompleto,
    cidade: cnpjData.municipio,
    estado: cnpjData.uf,
    cep: cnpjData.cep,
    telefone,
    email: cnpjData.email || null,
    situacao: cnpjData.situacao_cadastral,
    porte: cnpjData.porte,
  };
}
