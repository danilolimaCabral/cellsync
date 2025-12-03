export interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  endereco: string; // Campo unificado para o formulário
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

// CONFIGURAÇÃO DA API
// Para mudar de API, altere a URL e a função de mapeamento abaixo.

// Opção 1: BrasilAPI (Padrão - Gratuita, sem chave)
const API_URL = "https://brasilapi.com.br/api/cnpj/v1/";

export async function fetchCnpjData(cnpj: string): Promise<CnpjData> {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  
  if (cleanCnpj.length !== 14) {
    throw new Error("CNPJ inválido");
  }

  const response = await fetch(`${API_URL}${cleanCnpj}`);
  
  if (!response.ok) {
    throw new Error("CNPJ não encontrado ou erro na API");
  }

  const data = await response.json();

  // ADAPTADOR DE DADOS
  // Mapeamento robusto para BrasilAPI
  
  // Monta o endereço completo: "RUA NOME DA RUA, 123 COMPLEMENTO"
  const tipo = data.descricao_tipo_de_logradouro || "";
  const logradouro = data.logradouro || "";
  const numero = data.numero || "";
  const complemento = data.complemento ? ` - ${data.complemento}` : "";
  
  // Remove espaços extras e garante formatação limpa
  const enderecoCompleto = `${tipo} ${logradouro}, ${numero}${complemento}`.trim().replace(/^, /, "").replace(/ ,/, ",");

  return {
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia,
    endereco: enderecoCompleto, // Agora retorna o endereço formatado
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep
  };
}
