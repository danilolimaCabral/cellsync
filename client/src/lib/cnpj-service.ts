export interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

// CONFIGURAÇÃO DA API
// Para mudar de API, altere a URL e a função de mapeamento abaixo.

// Opção 1: BrasilAPI (Padrão - Gratuita, sem chave)
const API_URL = "https://brasilapi.com.br/api/cnpj/v1/";

// Opção 2: ReceitaWS (Pública - Limite de 3 consultas/min)
// const API_URL = "https://www.receitaws.com.br/v1/cnpj/";

export async function fetchCnpjData(cnpj: string): Promise<CnpjData> {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  
  if (cleanCnpj.length !== 14) {
    throw new Error("CNPJ inválido");
  }

  // Se estiver usando ReceitaWS (JSONP) ou outra API que precise de proxy/config diferente, ajuste aqui.
  // Nota: ReceitaWS gratuita tem limitações de CORS, pode precisar de um proxy.
  
  const response = await fetch(`${API_URL}${cleanCnpj}`);
  
  if (!response.ok) {
    throw new Error("CNPJ não encontrado ou erro na API");
  }

  const data = await response.json();

  // ADAPTADOR DE DADOS
  // Se mudar a API, ajuste o mapeamento dos campos aqui.
  
  // Mapeamento para BrasilAPI
  return {
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep
  };

  /* 
  // Exemplo de Mapeamento para ReceitaWS:
  return {
    razao_social: data.nome,
    nome_fantasia: data.fantasia,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep.replace(".", "")
  };
  */
}
