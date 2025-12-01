/**
 * Módulo de Cálculo de Preços - Atacado/Varejo
 * Implementa lógica de preços diferenciados baseado em tipo de venda e quantidade
 */

export type SaleType = "retail" | "wholesale";
export type PriceType = "retail" | "wholesale";

export interface Product {
  id: number;
  name: string;
  salePrice: number; // Preço de varejo em centavos
  wholesalePrice: number | null; // Preço de atacado em centavos (opcional)
  minWholesaleQty: number | null; // Quantidade mínima para atacado
}

export interface PriceCalculationResult {
  unitPrice: number; // Preço unitário aplicado em centavos
  priceType: PriceType; // Tipo de preço aplicado
  totalPrice: number; // Preço total (unitPrice * quantity)
  savings: number; // Economia em centavos (se atacado)
  message?: string; // Mensagem de alerta/informação
}

/**
 * Calcula o preço de um produto baseado no tipo de venda e quantidade
 */
export function calculatePrice(
  product: Product,
  quantity: number,
  saleType: SaleType
): PriceCalculationResult {
  // Validações básicas
  if (quantity <= 0) {
    throw new Error("Quantidade deve ser maior que zero");
  }

  // Se não tem preço de atacado ou venda é varejo, usa preço de varejo
  if (!product.wholesalePrice || saleType === "retail") {
    return {
      unitPrice: product.salePrice,
      priceType: "retail",
      totalPrice: product.salePrice * quantity,
      savings: 0,
    };
  }

  // Venda no atacado - verifica quantidade mínima
  const minQty = product.minWholesaleQty || 5;

  if (quantity >= minQty) {
    // Quantidade suficiente - aplica preço de atacado
    const savings = (product.salePrice - product.wholesalePrice) * quantity;
    return {
      unitPrice: product.wholesalePrice,
      priceType: "wholesale",
      totalPrice: product.wholesalePrice * quantity,
      savings,
      message: `✅ Atacado aplicado! Economia de R$ ${(savings / 100).toFixed(2)}`,
    };
  } else {
    // Quantidade insuficiente - usa preço de varejo mas avisa
    const needed = minQty - quantity;
    const potentialSavings = (product.salePrice - product.wholesalePrice) * minQty;
    return {
      unitPrice: product.salePrice,
      priceType: "retail",
      totalPrice: product.salePrice * quantity,
      savings: 0,
      message: `⚠️ Adicione mais ${needed} unidade(s) para atacado e economize R$ ${(potentialSavings / 100).toFixed(2)}`,
    };
  }
}

/**
 * Calcula o preço total de múltiplos produtos
 */
export function calculateCartTotal(
  items: Array<{ product: Product; quantity: number }>,
  saleType: SaleType
): {
  subtotal: number;
  totalSavings: number;
  items: Array<PriceCalculationResult & { productId: number; productName: string }>;
} {
  let subtotal = 0;
  let totalSavings = 0;
  const calculatedItems: Array<PriceCalculationResult & { productId: number; productName: string }> = [];

  for (const item of items) {
    const result = calculatePrice(item.product, item.quantity, saleType);
    subtotal += result.totalPrice;
    totalSavings += result.savings;
    calculatedItems.push({
      ...result,
      productId: item.product.id,
      productName: item.product.name,
    });
  }

  return {
    subtotal,
    totalSavings,
    items: calculatedItems,
  };
}

/**
 * Valida se um produto pode ter preço de atacado
 */
export function validateWholesalePrice(
  costPrice: number,
  salePrice: number,
  wholesalePrice: number | null,
  minWholesaleQty: number | null
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (wholesalePrice === null) {
    // Preço de atacado é opcional
    return { valid: true, errors: [] };
  }

  // Validações
  if (wholesalePrice <= 0) {
    errors.push("Preço de atacado deve ser maior que zero");
  }

  if (wholesalePrice >= salePrice) {
    errors.push("Preço de atacado deve ser menor que preço de varejo");
  }

  if (wholesalePrice <= costPrice) {
    errors.push("Preço de atacado deve ser maior que preço de custo");
  }

  if (minWholesaleQty !== null && minWholesaleQty < 2) {
    errors.push("Quantidade mínima para atacado deve ser pelo menos 2");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calcula o percentual de desconto do atacado sobre o varejo
 */
export function calculateDiscountPercentage(
  salePrice: number,
  wholesalePrice: number
): number {
  if (salePrice <= 0) return 0;
  const discount = ((salePrice - wholesalePrice) / salePrice) * 100;
  return Math.round(discount * 10) / 10; // Arredonda para 1 casa decimal
}

/**
 * Calcula preço de atacado baseado em percentual de desconto
 */
export function calculateWholesalePriceFromDiscount(
  salePrice: number,
  discountPercentage: number
): number {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error("Percentual de desconto deve estar entre 0 e 100");
  }
  const discount = (salePrice * discountPercentage) / 100;
  return Math.round(salePrice - discount);
}
