/**
 * Serviço Unificado de Cotação de Frete
 * 
 * Combina APIs dos Correios e Melhor Envio para oferecer
 * a melhor opção de frete para o cliente
 */

import * as correios from "./correios-api";
import * as melhorEnvio from "./melhor-envio-api";

// Interface unificada de cotação
export interface UnifiedQuote {
  id: string; // ID único da cotação
  carrier: string; // Transportadora (Correios, Jadlog, etc)
  service: string; // Serviço (PAC, SEDEX, etc)
  price: number; // Preço em centavos
  deliveryTime: number; // Prazo em dias úteis
  source: "correios" | "melhor_envio"; // Fonte da cotação
  logo?: string; // URL do logo da transportadora
  error?: string; // Mensagem de erro se houver
}

// Parâmetros de cotação unificados
export interface QuoteParams {
  fromPostalCode: string; // CEP origem
  toPostalCode: string; // CEP destino
  weight: number; // Peso em gramas
  length: number; // Comprimento em cm
  width: number; // Largura em cm
  height: number; // Altura em cm
  insuranceValue?: number; // Valor declarado em centavos
  receipt?: boolean; // Aviso de recebimento
  ownHand?: boolean; // Mão própria
}

/**
 * Calcula cotações de todas as fontes disponíveis
 */
export async function calculateAllQuotes(params: QuoteParams): Promise<UnifiedQuote[]> {
  const quotes: UnifiedQuote[] = [];

  // Validar CEPs
  if (!melhorEnvio.validarCep(params.fromPostalCode) || !melhorEnvio.validarCep(params.toPostalCode)) {
    return [{
      id: "error",
      carrier: "Erro",
      service: "Validação",
      price: 0,
      deliveryTime: 0,
      source: "correios",
      error: "CEPs inválidos. Devem conter 8 dígitos.",
    }];
  }

  // Validar dimensões
  const validacao = correios.validarDimensoes({
    cepOrigem: params.fromPostalCode,
    cepDestino: params.toPostalCode,
    peso: params.weight,
    formato: 1, // Caixa/Pacote
    comprimento: params.length,
    altura: params.height,
    largura: params.width,
  });

  if (!validacao.valido) {
    return [{
      id: "error",
      carrier: "Erro",
      service: "Validação",
      price: 0,
      deliveryTime: 0,
      source: "correios",
      error: validacao.erro,
    }];
  }

  // Buscar cotações dos Correios
  if (correios.isCorreiosConfigured()) {
    try {
      const correiosQuotes = await correios.calcularFrete({
        cepOrigem: params.fromPostalCode,
        cepDestino: params.toPostalCode,
        peso: params.weight,
        formato: 1, // Caixa/Pacote
        comprimento: params.length,
        altura: params.height,
        largura: params.width,
        valorDeclarado: params.insuranceValue ? params.insuranceValue / 100 : undefined,
        avisoRecebimento: params.receipt,
      });

      correiosQuotes.forEach((quote, index) => {
        if (quote.sucesso) {
          quotes.push({
            id: `correios-${quote.servico}`,
            carrier: "Correios",
            service: quote.servicoNome,
            price: Math.round(quote.valor * 100), // Converter para centavos
            deliveryTime: quote.prazoEntrega,
            source: "correios",
          });
        }
      });
    } catch (error) {
      console.error("Erro ao buscar cotações dos Correios:", error);
    }
  }

  // Buscar cotações do Melhor Envio
  if (melhorEnvio.isMelhorEnvioConfigured()) {
    try {
      const melhorEnvioQuotes = await melhorEnvio.calcularCotacao({
        from: {
          postal_code: melhorEnvio.formatarCepParaApi(params.fromPostalCode),
        },
        to: {
          postal_code: melhorEnvio.formatarCepParaApi(params.toPostalCode),
        },
        package: {
          weight: melhorEnvio.gramasParaKg(params.weight),
          width: params.width,
          height: params.height,
          length: params.length,
        },
        options: {
          insurance_value: params.insuranceValue ? params.insuranceValue / 100 : undefined,
          receipt: params.receipt,
          own_hand: params.ownHand,
        },
      });

      melhorEnvioQuotes.forEach((quote) => {
        if (!quote.error) {
          quotes.push({
            id: `melhor-envio-${quote.id}`,
            carrier: quote.company.name,
            service: quote.name,
            price: Math.round(parseFloat(quote.custom_price || quote.price) * 100), // Converter para centavos
            deliveryTime: quote.custom_delivery_time || quote.delivery_time,
            source: "melhor_envio",
            logo: quote.company.picture,
          });
        }
      });
    } catch (error) {
      console.error("Erro ao buscar cotações do Melhor Envio:", error);
    }
  }

  // Se nenhuma cotação foi encontrada
  if (quotes.length === 0) {
    return [{
      id: "no-quotes",
      carrier: "Nenhuma cotação disponível",
      service: "Configure as APIs de frete",
      price: 0,
      deliveryTime: 0,
      source: "correios",
      error: "Configure CORREIOS_API_KEY ou MELHOR_ENVIO_ACCESS_TOKEN para obter cotações",
    }];
  }

  return quotes;
}

/**
 * Encontra a cotação mais barata
 */
export function findCheapestQuote(quotes: UnifiedQuote[]): UnifiedQuote | null {
  const validQuotes = quotes.filter(q => !q.error && q.price > 0);
  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((cheapest, current) => 
    current.price < cheapest.price ? current : cheapest
  );
}

/**
 * Encontra a cotação mais rápida
 */
export function findFastestQuote(quotes: UnifiedQuote[]): UnifiedQuote | null {
  const validQuotes = quotes.filter(q => !q.error && q.deliveryTime > 0);
  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((fastest, current) => 
    current.deliveryTime < fastest.deliveryTime ? current : fastest
  );
}

/**
 * Encontra o melhor custo-benefício (considera preço e prazo)
 */
export function findBestValueQuote(quotes: UnifiedQuote[]): UnifiedQuote | null {
  const validQuotes = quotes.filter(q => !q.error && q.price > 0 && q.deliveryTime > 0);
  if (validQuotes.length === 0) return null;

  // Normalizar valores para comparação (0-1)
  const maxPrice = Math.max(...validQuotes.map(q => q.price));
  const maxDelivery = Math.max(...validQuotes.map(q => q.deliveryTime));

  // Calcular score (peso 60% preço, 40% prazo)
  const quotesWithScore = validQuotes.map(q => ({
    quote: q,
    score: (q.price / maxPrice) * 0.6 + (q.deliveryTime / maxDelivery) * 0.4,
  }));

  // Retornar o de menor score (melhor custo-benefício)
  return quotesWithScore.reduce((best, current) => 
    current.score < best.score ? current : best
  ).quote;
}

/**
 * Ordena cotações por preço (menor primeiro)
 */
export function sortByPrice(quotes: UnifiedQuote[]): UnifiedQuote[] {
  return [...quotes].sort((a, b) => {
    // Cotações com erro vão para o final
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    return a.price - b.price;
  });
}

/**
 * Ordena cotações por prazo (menor primeiro)
 */
export function sortByDeliveryTime(quotes: UnifiedQuote[]): UnifiedQuote[] {
  return [...quotes].sort((a, b) => {
    // Cotações com erro vão para o final
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    return a.deliveryTime - b.deliveryTime;
  });
}

/**
 * Formata preço de centavos para reais
 */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Formata prazo de entrega
 */
export function formatDeliveryTime(days: number): string {
  if (days === 0) return "Não disponível";
  if (days === 1) return "1 dia útil";
  return `${days} dias úteis`;
}

/**
 * Verifica se alguma API está configurada
 */
export function isAnyApiConfigured(): boolean {
  return correios.isCorreiosConfigured() || melhorEnvio.isMelhorEnvioConfigured();
}

/**
 * Retorna status de configuração das APIs
 */
export function getApisStatus(): {
  correios: boolean;
  melhorEnvio: boolean;
  anyConfigured: boolean;
} {
  return {
    correios: correios.isCorreiosConfigured(),
    melhorEnvio: melhorEnvio.isMelhorEnvioConfigured(),
    anyConfigured: isAnyApiConfigured(),
  };
}
