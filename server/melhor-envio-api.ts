/**
 * Módulo de Integração com Melhor Envio API
 * 
 * Funcionalidades:
 * - Cotação de frete de múltiplas transportadoras
 * - Geração de etiquetas oficiais
 * - Rastreamento unificado de envios
 * - Webhooks para notificações automáticas
 * 
 * Documentação: https://docs.melhorenvio.com.br
 * 
 * IMPORTANTE: Requer cadastro gratuito no Melhor Envio e criação de aplicativo OAuth2
 * Configure as variáveis de ambiente:
 * - MELHOR_ENVIO_CLIENT_ID
 * - MELHOR_ENVIO_CLIENT_SECRET
 * - MELHOR_ENVIO_ACCESS_TOKEN (gerado após autorização OAuth2)
 */

// Variáveis de ambiente
const MELHOR_ENVIO_CLIENT_ID = process.env.MELHOR_ENVIO_CLIENT_ID || "";
const MELHOR_ENVIO_CLIENT_SECRET = process.env.MELHOR_ENVIO_CLIENT_SECRET || "";
const MELHOR_ENVIO_ACCESS_TOKEN = process.env.MELHOR_ENVIO_ACCESS_TOKEN || "";
const MELHOR_ENVIO_SANDBOX = process.env.MELHOR_ENVIO_SANDBOX === "true";

// URLs da API
const MELHOR_ENVIO_API_BASE_URL = MELHOR_ENVIO_SANDBOX
  ? "https://sandbox.melhorenvio.com.br/api/v2"
  : "https://melhorenvio.com.br/api/v2";

// Transportadoras disponíveis
export const MELHOR_ENVIO_CARRIERS = {
  CORREIOS: 1,
  JADLOG: 2,
  AZUL_CARGO: 4,
  LATAM_CARGO: 5,
  LOGGI: 14,
  BUSLOG: 17,
} as const;

export type MelhorEnvioCarrier = typeof MELHOR_ENVIO_CARRIERS[keyof typeof MELHOR_ENVIO_CARRIERS];

// Interfaces
export interface CotacaoParams {
  from: {
    postal_code: string; // CEP origem (apenas números)
  };
  to: {
    postal_code: string; // CEP destino (apenas números)
  };
  package: {
    weight: number; // Peso em kg
    width: number; // Largura em cm
    height: number; // Altura em cm
    length: number; // Comprimento em cm
  };
  options?: {
    insurance_value?: number; // Valor declarado
    receipt?: boolean; // Aviso de recebimento
    own_hand?: boolean; // Mão própria
  };
  services?: string; // IDs dos serviços separados por vírgula (ex: "1,2,4")
}

export interface CotacaoResult {
  id: number; // ID do serviço
  name: string; // Nome da transportadora + serviço
  price: string; // Preço formatado (ex: "15.50")
  custom_price: string; // Preço com desconto
  discount: string; // Desconto aplicado
  currency: string; // Moeda (BRL)
  delivery_time: number; // Prazo de entrega em dias úteis
  delivery_range: {
    min: number;
    max: number;
  };
  custom_delivery_time: number;
  custom_delivery_range: {
    min: number;
    max: number;
  };
  packages: Array<{
    price: string;
    discount: string;
    format: string;
    weight: string;
    insurance_value: string;
    products: any[];
  }>;
  additional_services: {
    receipt: boolean;
    own_hand: boolean;
    collect: boolean;
  };
  company: {
    id: number;
    name: string;
    picture: string;
  };
  error?: string;
}

export interface RastreamentoMelhorEnvio {
  id: string; // ID do pedido no Melhor Envio
  protocol: string; // Código de rastreamento
  status: string; // Status atual
  tracking: string; // Código de rastreamento da transportadora
  melhorenvio_tracking: string; // Código de rastreamento Melhor Envio
  created_at: string; // Data de criação
  paid_at: string | null; // Data de pagamento
  generated_at: string | null; // Data de geração da etiqueta
  posted_at: string | null; // Data de postagem
  delivered_at: string | null; // Data de entrega
  canceled_at: string | null; // Data de cancelamento
  expired_at: string | null; // Data de expiração
  service_id: number; // ID do serviço
  from: {
    name: string;
    phone: string;
    email: string;
    document: string;
    company_document: string;
    state_register: string;
    address: string;
    complement: string;
    number: string;
    district: string;
    city: string;
    state_abbr: string;
    country_id: string;
    postal_code: string;
    note: string;
  };
  to: {
    name: string;
    phone: string;
    email: string;
    document: string;
    company_document: string;
    state_register: string;
    address: string;
    complement: string;
    number: string;
    district: string;
    city: string;
    state_abbr: string;
    country_id: string;
    postal_code: string;
    note: string;
  };
}

/**
 * Verifica se a API do Melhor Envio está configurada
 */
export function isMelhorEnvioConfigured(): boolean {
  return !!(MELHOR_ENVIO_CLIENT_ID && MELHOR_ENVIO_CLIENT_SECRET && MELHOR_ENVIO_ACCESS_TOKEN);
}

/**
 * Calcula cotação de frete com múltiplas transportadoras
 */
export async function calcularCotacao(params: CotacaoParams): Promise<CotacaoResult[]> {
  if (!isMelhorEnvioConfigured()) {
    return [{
      id: 0,
      name: "Melhor Envio não configurado",
      price: "0.00",
      custom_price: "0.00",
      discount: "0.00",
      currency: "BRL",
      delivery_time: 0,
      delivery_range: { min: 0, max: 0 },
      custom_delivery_time: 0,
      custom_delivery_range: { min: 0, max: 0 },
      packages: [],
      additional_services: {
        receipt: false,
        own_hand: false,
        collect: false,
      },
      company: {
        id: 0,
        name: "",
        picture: "",
      },
      error: "Configure MELHOR_ENVIO_CLIENT_ID, MELHOR_ENVIO_CLIENT_SECRET e MELHOR_ENVIO_ACCESS_TOKEN",
    }];
  }

  try {
    const response = await fetch(`${MELHOR_ENVIO_API_BASE_URL}/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MELHOR_ENVIO_ACCESS_TOKEN}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro na API do Melhor Envio: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return [{
      id: 0,
      name: "Erro ao calcular frete",
      price: "0.00",
      custom_price: "0.00",
      discount: "0.00",
      currency: "BRL",
      delivery_time: 0,
      delivery_range: { min: 0, max: 0 },
      custom_delivery_time: 0,
      custom_delivery_range: { min: 0, max: 0 },
      packages: [],
      additional_services: {
        receipt: false,
        own_hand: false,
        collect: false,
      },
      company: {
        id: 0,
        name: "",
        picture: "",
      },
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }];
  }
}

/**
 * Rastreia um pedido pelo ID do Melhor Envio
 */
export async function rastrearPedido(orderId: string): Promise<RastreamentoMelhorEnvio | null> {
  if (!isMelhorEnvioConfigured()) {
    throw new Error("Melhor Envio não configurado");
  }

  try {
    const response = await fetch(`${MELHOR_ENVIO_API_BASE_URL}/me/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MELHOR_ENVIO_ACCESS_TOKEN}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao rastrear pedido: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao rastrear pedido:", error);
    return null;
  }
}

/**
 * Rastreia um pedido pelo código de rastreamento
 */
export async function rastrearPorCodigo(trackingCode: string): Promise<any> {
  if (!isMelhorEnvioConfigured()) {
    throw new Error("Melhor Envio não configurado");
  }

  try {
    const response = await fetch(`${MELHOR_ENVIO_API_BASE_URL}/me/shipment/tracking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MELHOR_ENVIO_ACCESS_TOKEN}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        orders: [trackingCode],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao rastrear por código: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao rastrear por código:", error);
    return null;
  }
}

/**
 * Compara cotações e retorna a melhor opção (menor preço)
 */
export function encontrarMelhorCotacao(cotacoes: CotacaoResult[]): CotacaoResult | null {
  if (cotacoes.length === 0) return null;

  // Filtrar cotações com erro
  const cotacoesValidas = cotacoes.filter(c => !c.error);
  if (cotacoesValidas.length === 0) return null;

  // Ordenar por preço (menor primeiro)
  const ordenadas = [...cotacoesValidas].sort((a, b) => {
    const precoA = parseFloat(a.custom_price || a.price);
    const precoB = parseFloat(b.custom_price || b.price);
    return precoA - precoB;
  });

  return ordenadas[0];
}

/**
 * Compara cotações e retorna a mais rápida (menor prazo)
 */
export function encontrarCotacaoMaisRapida(cotacoes: CotacaoResult[]): CotacaoResult | null {
  if (cotacoes.length === 0) return null;

  // Filtrar cotações com erro
  const cotacoesValidas = cotacoes.filter(c => !c.error);
  if (cotacoesValidas.length === 0) return null;

  // Ordenar por prazo (menor primeiro)
  const ordenadas = [...cotacoesValidas].sort((a, b) => {
    const prazoA = a.custom_delivery_time || a.delivery_time;
    const prazoB = b.custom_delivery_time || b.delivery_time;
    return prazoA - prazoB;
  });

  return ordenadas[0];
}

/**
 * Formata CEP removendo caracteres especiais
 */
export function formatarCepParaApi(cep: string): string {
  return cep.replace(/\D/g, "");
}

/**
 * Valida se o CEP tem 8 dígitos
 */
export function validarCep(cep: string): boolean {
  const cepLimpo = formatarCepParaApi(cep);
  return cepLimpo.length === 8;
}

/**
 * Converte peso de gramas para kg
 */
export function gramasParaKg(gramas: number): number {
  return gramas / 1000;
}

/**
 * Gera URL de autorização OAuth2 para obter access token
 * Esta URL deve ser aberta pelo usuário para autorizar o aplicativo
 */
export function gerarUrlAutorizacao(redirectUri: string, state?: string): string {
  const baseUrl = MELHOR_ENVIO_SANDBOX
    ? "https://sandbox.melhorenvio.com.br/oauth/authorize"
    : "https://melhorenvio.com.br/oauth/authorize";

  const params = new URLSearchParams({
    client_id: MELHOR_ENVIO_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read products-read products-write purchases-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read",
  });

  if (state) {
    params.append("state", state);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Troca código de autorização por access token
 * Deve ser chamado após o usuário autorizar o aplicativo
 */
export async function trocarCodigoPorToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
} | null> {
  try {
    const tokenUrl = MELHOR_ENVIO_SANDBOX
      ? "https://sandbox.melhorenvio.com.br/oauth/token"
      : "https://melhorenvio.com.br/oauth/token";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: MELHOR_ENVIO_CLIENT_ID,
        client_secret: MELHOR_ENVIO_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao trocar código por token: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao trocar código por token:", error);
    return null;
  }
}

/**
 * Renova access token usando refresh token
 */
export async function renovarToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
} | null> {
  try {
    const tokenUrl = MELHOR_ENVIO_SANDBOX
      ? "https://sandbox.melhorenvio.com.br/oauth/token"
      : "https://melhorenvio.com.br/oauth/token";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: MELHOR_ENVIO_CLIENT_ID,
        client_secret: MELHOR_ENVIO_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao renovar token: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return null;
  }
}
