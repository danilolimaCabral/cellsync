import { getDb } from "./db";
import { products, stockItems } from "../drizzle/schema";
import { eq, and, gte, lte, like, sql, isNull, isNotNull } from "drizzle-orm";

/**
 * Módulo de Relatório Avançado de Estoque
 * Exibe todos os campos importados com filtros e métricas
 */

export interface AdvancedStockFilters {
  startDate?: Date;
  endDate?: Date;
  supplier?: string;
  warehouse?: string;
  grade?: string;
  readyForSale?: boolean;
  hasDefect?: boolean;
  minDaysInStock?: number;
  maxDaysInStock?: number;
}

export interface AdvancedStockItem {
  // Produto
  productId: number;
  productName: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  grade: string | null;
  sku: string | null;
  
  // Preços
  costPrice: number;
  salePrice: number;
  wholesalePrice: number | null;
  
  // Estoque
  currentStock: number;
  supplier: string | null;
  warehouse: string | null;
  entryDate: Date | null;
  
  // IMEI (se houver)
  stockItemId: number | null;
  imei: string | null;
  batteryHealth: number | null;
  hasDefect: boolean | null;
  readyForSale: boolean | null;
  location: string | null;
  
  // Calculados
  daysInStock: number | null;
}

export interface StockMetrics {
  totalItems: number;
  totalValue: number; // Valor total em custo
  totalRetailValue: number; // Valor total em varejo
  averageDaysInStock: number;
  itemsWithDefect: number;
  itemsReadyForSale: number;
  itemsNotReadyForSale: number;
}

/**
 * Buscar relatório avançado de estoque com todos os campos
 */
export async function getAdvancedStockReport(filters: AdvancedStockFilters = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  // Filtros de data
  if (filters.startDate) {
    conditions.push(gte(products.entryDate, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(products.entryDate, filters.endDate));
  }

  // Filtros de texto
  if (filters.supplier) {
    conditions.push(like(products.supplier, `%${filters.supplier}%`));
  }
  if (filters.warehouse) {
    conditions.push(like(products.warehouse, `%${filters.warehouse}%`));
  }
  if (filters.grade) {
    conditions.push(like(products.grade, `%${filters.grade}%`));
  }

  // Buscar produtos com estoque
  const productsWithStock = await db
    .select({
      productId: products.id,
      productName: products.name,
      category: products.category,
      brand: products.brand,
      model: products.model,
      grade: products.grade,
      sku: products.sku,
      costPrice: products.costPrice,
      salePrice: products.salePrice,
      wholesalePrice: products.wholesalePrice,
      currentStock: products.currentStock,
      supplier: products.supplier,
      warehouse: products.warehouse,
      entryDate: products.entryDate,
    })
    .from(products)
    .where(
      and(
        eq(products.active, true),
        ...conditions
      )
    );

  const result: AdvancedStockItem[] = [];

  for (const product of productsWithStock) {
    // Se o produto requer IMEI, buscar itens individuais
    const productDetails = await db
      .select()
      .from(products)
      .where(eq(products.id, product.productId))
      .limit(1);

    if (productDetails[0]?.requiresImei) {
      // Buscar itens de estoque com IMEI
      const items = await db
        .select()
        .from(stockItems)
        .where(eq(stockItems.productId, product.productId));

      for (const item of items) {
        // Aplicar filtros de IMEI
        if (filters.readyForSale !== undefined && item.readyForSale !== filters.readyForSale) {
          continue;
        }
        if (filters.hasDefect !== undefined && item.hasDefect !== filters.hasDefect) {
          continue;
        }

        const daysInStock = item.createdAt
          ? Math.floor((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Filtro de dias em estoque
        if (filters.minDaysInStock !== undefined && (daysInStock === null || daysInStock < filters.minDaysInStock)) {
          continue;
        }
        if (filters.maxDaysInStock !== undefined && (daysInStock === null || daysInStock > filters.maxDaysInStock)) {
          continue;
        }

        result.push({
          ...product,
          stockItemId: item.id,
          imei: item.imei,
          batteryHealth: item.batteryHealth,
          hasDefect: item.hasDefect,
          readyForSale: item.readyForSale,
          location: item.location,
          daysInStock,
        });
      }
    } else {
      // Produto sem IMEI - adicionar linha única
      const daysInStock = product.entryDate
        ? Math.floor((Date.now() - product.entryDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Filtro de dias em estoque
      if (filters.minDaysInStock !== undefined && (daysInStock === null || daysInStock < filters.minDaysInStock)) {
        continue;
      }
      if (filters.maxDaysInStock !== undefined && (daysInStock === null || daysInStock > filters.maxDaysInStock)) {
        continue;
      }

      result.push({
        ...product,
        stockItemId: null,
        imei: null,
        batteryHealth: null,
        hasDefect: null,
        readyForSale: null,
        location: null,
        daysInStock,
      });
    }
  }

  return result;
}

/**
 * Calcular métricas do estoque
 */
export async function getStockMetrics(filters: AdvancedStockFilters = {}): Promise<StockMetrics> {
  const items = await getAdvancedStockReport(filters);

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.costPrice, 0);
  const totalRetailValue = items.reduce((sum, item) => sum + item.salePrice, 0);
  
  const itemsWithDays = items.filter(item => item.daysInStock !== null);
  const averageDaysInStock = itemsWithDays.length > 0
    ? itemsWithDays.reduce((sum, item) => sum + (item.daysInStock || 0), 0) / itemsWithDays.length
    : 0;

  const itemsWithDefect = items.filter(item => item.hasDefect === true).length;
  const itemsReadyForSale = items.filter(item => item.readyForSale === true).length;
  const itemsNotReadyForSale = items.filter(item => item.readyForSale === false).length;

  return {
    totalItems,
    totalValue,
    totalRetailValue,
    averageDaysInStock: Math.round(averageDaysInStock),
    itemsWithDefect,
    itemsReadyForSale,
    itemsNotReadyForSale,
  };
}

/**
 * Buscar valores únicos para filtros (autocomplete)
 */
export async function getFilterOptions() {
  const db = await getDb();
  if (!db) return { suppliers: [], warehouses: [], grades: [] };

  const suppliersResult = await db
    .selectDistinct({ supplier: products.supplier })
    .from(products)
    .where(and(eq(products.active, true), isNotNull(products.supplier)));

  const warehousesResult = await db
    .selectDistinct({ warehouse: products.warehouse })
    .from(products)
    .where(and(eq(products.active, true), isNotNull(products.warehouse)));

  const gradesResult = await db
    .selectDistinct({ grade: products.grade })
    .from(products)
    .where(and(eq(products.active, true), isNotNull(products.grade)));

  return {
    suppliers: suppliersResult.map(r => r.supplier).filter(Boolean) as string[],
    warehouses: warehousesResult.map(r => r.warehouse).filter(Boolean) as string[],
    grades: gradesResult.map(r => r.grade).filter(Boolean) as string[],
  };
}
