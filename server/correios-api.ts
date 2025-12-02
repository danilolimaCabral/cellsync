/**
 * Módulo de Integração com API dos Correios
 * 
 * Funcionalidades:
 * - Cálculo de frete (PAC, SEDEX)
 * - Consulta de prazo de entrega
 * - Rastreamento de encomendas
 * - Consulta de CEP
 * 
 * Documentação: https://www.correios.com.br/atendimento/developers
 * 
 * IMPORTANTE: Requer cadastro gratuito no "Meu Correios" e geração de API Key
 * Configure a variável de ambiente CORREIOS_API_KEY
 */

// Variáveis de ambiente
const CORREIOS_API_KEY = process.env.CORREIOS_API_KEY || "";

// Tipos de serviços dos Correios
export const CORREIOS_SERVICES = {
  PAC: "04510", // PAC (Encomenda Normal)
  SEDEX: "04014", // SEDEX (Encomenda Expressa)
  SEDEX_10: "40215", // SEDEX 10
  SEDEX_12: "40169", // SEDEX 12
  SEDEX_HOJE: "40290", // SEDEX Hoje
} as const;

export type CorreiosService = typeof CORREIOS_SERVICES[keyof typeof CORREIOS_SERVICES];

// URLs da API dos Correios
const CORREIOS_API_BASE_URL = "https://api.correios.com.br";
const CORREIOS_PRECO_PRAZO_URL = `${CORREIOS_API_BASE_URL}/preco-prazo/v1`;
const CORREIOS_RASTRO_URL = `${CORREIOS_API_BASE_URL}/rastro/v1`;
const CORREIOS_CEP_URL = `${CORREIOS_API_BASE_URL}/cep/v2`;

// Interfaces
export interface FreteCalculationParams {
  cepOrigem: string; // CEP de origem (sem formatação)
  cepDestino: string; // CEP de destino (sem formatação)
  peso: number; // Peso em gramas
  formato: 1 | 2 | 3; // 1=Caixa/Pacote, 2=Rolo/Prisma, 3=Envelope
  comprimento: number; // Comprimento em cm
  altura: number; // Altura em cm
  largura: number; // Largura em cm
  diametro?: number; // Diâmetro em cm (apenas para formato 2)
  valorDeclarado?: number; // Valor declarado para seguro
  avisoRecebimento?: boolean; // Aviso de recebimento (AR)
}

export interface FreteResult {
  servico: string; // Código do serviço (PAC, SEDEX, etc)
  servicoNome: string; // Nome do serviço
  valor: number; // Valor do frete em reais
  prazoEntrega: number; // Prazo de entrega em dias úteis
  valorSemAdicionais: number; // Valor sem adicionais
  valorAvisoRecebimento?: number; // Valor do AR
  valorValorDeclarado?: number; // Valor do seguro
  erro?: string; // Mensagem de erro se houver
  sucesso: boolean;
}

export interface RastreamentoEvento {
  data: string; // Data do evento (ISO 8601)
  hora: string; // Hora do evento
  local: string; // Local do evento
  status: string; // Status/descrição do evento
  origem?: string; // Origem (cidade/UF)
  destino?: string; // Destino (cidade/UF)
}

export interface RastreamentoResult {
  codigo: string; // Código de rastreamento
  eventos: RastreamentoEvento[];
  erro?: string;
  sucesso: boolean;
}

export interface CepResult {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string; // Estado
  erro?: string;
  sucesso: boolean;
}

/**
 * Verifica se a API Key dos Correios está configurada
 */
export function isCorreiosConfigured(): boolean {
  return !!CORREIOS_API_KEY;
}

/**
 * Calcula frete para múltiplos serviços dos Correios
 */
export async function calcularFrete(
  params: FreteCalculationParams,
  servicos: CorreiosService[] = [CORREIOS_SERVICES.PAC, CORREIOS_SERVICES.SEDEX]
): Promise<FreteResult[]> {
  if (!isCorreiosConfigured()) {
    return servicos.map(servico => ({
      servico,
      servicoNome: getServiceName(servico),
      valor: 0,
      prazoEntrega: 0,
      valorSemAdicionais: 0,
      erro: "API dos Correios não configurada. Configure CORREIOS_API_KEY nas variáveis de ambiente.",
      sucesso: false,
    }));
  }

  try {
    // Limpar CEPs (remover formatação)
    const cepOrigem = params.cepOrigem.replace(/\D/g, "");
    const cepDestino = params.cepDestino.replace(/\D/g, "");

    // Validar CEPs
    if (cepOrigem.length !== 8 || cepDestino.length !== 8) {
      throw new Error("CEPs inválidos. Devem conter 8 dígitos.");
    }

    // Fazer requisições para cada serviço
    const promises = servicos.map(async (servico) => {
      try {
        const response = await fetch(`${CORREIOS_PRECO_PRAZO_URL}/calcular`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${CORREIOS_API_KEY}`,
          },
          body: JSON.stringify({
            cepOrigem,
            cepDestino,
            peso: params.peso,
            formato: params.formato,
            comprimento: params.comprimento,
            altura: params.altura,
            largura: params.largura,
            diametro: params.diametro || 0,
            valorDeclarado: params.valorDeclarado || 0,
            avisoRecebimento: params.avisoRecebimento ? "S" : "N",
            servico,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro na API dos Correios: ${response.status}`);
        }

        const data = await response.json();

        return {
          servico,
          servicoNome: getServiceName(servico),
          valor: parseFloat(data.valor || "0"),
          prazoEntrega: parseInt(data.prazoEntrega || "0", 10),
          valorSemAdicionais: parseFloat(data.valorSemAdicionais || "0"),
          valorAvisoRecebimento: data.valorAvisoRecebimento ? parseFloat(data.valorAvisoRecebimento) : undefined,
          valorValorDeclarado: data.valorValorDeclarado ? parseFloat(data.valorValorDeclarado) : undefined,
          erro: data.erro || undefined,
          sucesso: !data.erro,
        };
      } catch (error) {
        return {
          servico,
          servicoNome: getServiceName(servico),
          valor: 0,
          prazoEntrega: 0,
          valorSemAdicionais: 0,
          erro: error instanceof Error ? error.message : "Erro desconhecido",
          sucesso: false,
        };
      }
    });

    return await Promise.all(promises);
  } catch (error) {
    return servicos.map(servico => ({
      servico,
      servicoNome: getServiceName(servico),
      valor: 0,
      prazoEntrega: 0,
      valorSemAdicionais: 0,
      erro: error instanceof Error ? error.message : "Erro desconhecido",
      sucesso: false,
    }));
  }
}

/**
 * Rastreia uma encomenda pelo código de rastreamento
 */
export async function rastrearEncomenda(codigo: string): Promise<RastreamentoResult> {
  if (!isCorreiosConfigured()) {
    return {
      codigo,
      eventos: [],
      erro: "API dos Correios não configurada. Configure CORREIOS_API_KEY nas variáveis de ambiente.",
      sucesso: false,
    };
  }

  try {
    // Limpar código de rastreamento
    const codigoLimpo = codigo.replace(/\s/g, "").toUpperCase();

    const response = await fetch(`${CORREIOS_RASTRO_URL}/objetos/${codigoLimpo}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CORREIOS_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API dos Correios: ${response.status}`);
    }

    const data = await response.json();

    return {
      codigo: codigoLimpo,
      eventos: data.eventos || [],
      sucesso: true,
    };
  } catch (error) {
    return {
      codigo,
      eventos: [],
      erro: error instanceof Error ? error.message : "Erro desconhecido",
      sucesso: false,
    };
  }
}

/**
 * Consulta informações de um CEP
 */
export async function consultarCep(cep: string): Promise<CepResult> {
  try {
    // Limpar CEP (remover formatação)
    const cepLimpo = cep.replace(/\D/g, "");

    // Validar CEP
    if (cepLimpo.length !== 8) {
      throw new Error("CEP inválido. Deve conter 8 dígitos.");
    }

    // Usar API pública do ViaCEP como fallback (não requer autenticação)
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      throw new Error(`Erro ao consultar CEP: ${response.status}`);
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado");
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
      sucesso: true,
    };
  } catch (error) {
    return {
      cep,
      logradouro: "",
      bairro: "",
      localidade: "",
      uf: "",
      erro: error instanceof Error ? error.message : "Erro desconhecido",
      sucesso: false,
    };
  }
}

/**
 * Retorna o nome amigável do serviço
 */
function getServiceName(servico: string): string {
  const names: Record<string, string> = {
    "04510": "PAC",
    "04014": "SEDEX",
    "40215": "SEDEX 10",
    "40169": "SEDEX 12",
    "40290": "SEDEX Hoje",
  };
  return names[servico] || servico;
}

/**
 * Valida dimensões do pacote conforme regras dos Correios
 */
export function validarDimensoes(params: FreteCalculationParams): { valido: boolean; erro?: string } {
  // Limites dos Correios
  const MIN_COMPRIMENTO = 16;
  const MAX_COMPRIMENTO = 105;
  const MIN_LARGURA = 11;
  const MAX_LARGURA = 105;
  const MIN_ALTURA = 2;
  const MAX_ALTURA = 105;
  const MIN_SOMA = 29; // Soma mínima de C + L + A
  const MAX_SOMA = 200; // Soma máxima de C + L + A

  if (params.comprimento < MIN_COMPRIMENTO || params.comprimento > MAX_COMPRIMENTO) {
    return { valido: false, erro: `Comprimento deve estar entre ${MIN_COMPRIMENTO}cm e ${MAX_COMPRIMENTO}cm` };
  }

  if (params.largura < MIN_LARGURA || params.largura > MAX_LARGURA) {
    return { valido: false, erro: `Largura deve estar entre ${MIN_LARGURA}cm e ${MAX_LARGURA}cm` };
  }

  if (params.altura < MIN_ALTURA || params.altura > MAX_ALTURA) {
    return { valido: false, erro: `Altura deve estar entre ${MIN_ALTURA}cm e ${MAX_ALTURA}cm` };
  }

  const soma = params.comprimento + params.largura + params.altura;
  if (soma < MIN_SOMA || soma > MAX_SOMA) {
    return { valido: false, erro: `A soma das dimensões deve estar entre ${MIN_SOMA}cm e ${MAX_SOMA}cm` };
  }

  return { valido: true };
}
