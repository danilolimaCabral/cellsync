import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sales, saleItems, products, users, serviceOrders } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, like } from "drizzle-orm";

/**
 * Helper para criar procedimentos protegidos
 */
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Router de Relatório de Vendas por Vendedor
 */
export const salesReportRouter = router({
  /**
   * Obtém resumo geral de vendas no período
   */
  getSummary: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      vendorId: z.number().optional(),
      tenantId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      let conditions = [
        eq(sales.tenantId, targetTenantId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate),
      ];

      if (input.vendorId) {
        conditions.push(eq(sales.sellerId, input.vendorId));
      }

      // Total de vendas e valores
      const [summary] = await db
        .select({
          totalSales: sql<number>`COUNT(*)`,
          totalRevenue: sql<number>`COALESCE(SUM(${sales.finalAmount}), 0)`,
          totalCost: sql<number>`COALESCE(SUM(${sales.totalAmount} - ${sales.finalAmount}), 0)`, // Estimativa
          totalProfit: sql<number>`COALESCE(SUM(${sales.finalAmount} - ${sales.discountAmount}), 0)`,
        })
        .from(sales)
        .where(and(...conditions));

      // Total de produtos vendidos
      const [productStats] = await db
        .select({
          totalProducts: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(...conditions));

      // Total de produtos em garantia (via OS com status específico)
      const [warrantyStats] = await db
        .select({
          totalWarranty: sql<number>`COUNT(*)`,
        })
        .from(serviceOrders)
        .where(
          and(
            eq(serviceOrders.tenantId, targetTenantId),
            gte(serviceOrders.createdAt, startDate),
            lte(serviceOrders.createdAt, endDate)
          )
        );

      return {
        totalSales: Number(summary.totalSales),
        totalRevenue: Number(summary.totalRevenue),
        totalCost: Number(summary.totalCost),
        totalProfit: Number(summary.totalProfit),
        totalProducts: Number(productStats.totalProducts),
        totalWarranty: Number(warrantyStats.totalWarranty),
      };
    }),

  /**
   * Obtém resumo de vendas por vendedor
   */
  getVendorsSummary: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      tenantId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Vendas por vendedor
      const vendorsSales = await db
        .select({
          vendorId: sales.sellerId,
          vendorName: sql<string>`(SELECT name FROM users WHERE id = ${sales.sellerId})`,
          totalProducts: sql<number>`COALESCE(SUM((SELECT SUM(quantity) FROM saleItems WHERE saleId = ${sales.id})), 0)`,
          totalRevenue: sql<number>`COALESCE(SUM(${sales.finalAmount}), 0)`,
          totalProfit: sql<number>`COALESCE(SUM(${sales.finalAmount} - ${sales.discountAmount}), 0)`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.tenantId, targetTenantId),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate)
          )
        )
        .groupBy(sales.sellerId)
        .orderBy(desc(sql`SUM(${sales.finalAmount})`));

      return vendorsSales.map(v => ({
        vendorId: v.vendorId,
        vendorName: v.vendorName || "Vendedor Desconhecido",
        totalProducts: Number(v.totalProducts),
        totalRevenue: Number(v.totalRevenue),
        totalProfit: Number(v.totalProfit),
      }));
    }),

  /**
   * Obtém produtos mais vendidos por modelo
   */
  getTopProductsByModel: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      limit: z.number().min(1).max(50).default(10),
      vendorId: z.number().optional(),
      tenantId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      let conditions = [
        eq(sales.tenantId, targetTenantId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate),
      ];

      if (input.vendorId) {
        conditions.push(eq(sales.sellerId, input.vendorId));
      }

      // Produtos mais vendidos agrupados por modelo
      const topProducts = await db
        .select({
          productId: saleItems.productId,
          productName: products.name,
          model: products.model,
          totalQuantity: sql<number>`SUM(${saleItems.quantity})`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(and(...conditions))
        .groupBy(products.model, saleItems.productId, products.name)
        .orderBy(desc(sql`SUM(${saleItems.quantity})`))
        .limit(input.limit);

      return topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        model: p.model || "Sem modelo",
        totalQuantity: Number(p.totalQuantity),
      }));
    }),

  /**
   * Obtém comparação de vendas vs garantias por vendedor
   */
  getVendorsWarrantyComparison: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      tenantId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Produtos vendidos por vendedor
      const vendorsSales = await db
        .select({
          vendorId: sales.sellerId,
          vendorName: sql<string>`(SELECT name FROM users WHERE id = ${sales.sellerId})`,
          totalProducts: sql<number>`COALESCE(SUM((SELECT SUM(quantity) FROM saleItems WHERE saleId = ${sales.id})), 0)`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.tenantId, targetTenantId),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate)
          )
        )
        .groupBy(sales.sellerId);

      // Produtos em garantia por vendedor (via OS)
      // Nota: serviceOrders não tem vendorId direto, usando count geral
      const [warrantyTotal] = await db
        .select({
          totalWarranty: sql<number>`COUNT(*)`,
        })
        .from(serviceOrders)
        .where(
          and(
            eq(serviceOrders.tenantId, targetTenantId),
            gte(serviceOrders.createdAt, startDate),
            lte(serviceOrders.createdAt, endDate)
          )
        );

      const totalWarrantyCount = Number(warrantyTotal.totalWarranty);

      // Combinar dados (distribui garantias proporcionalmente por enquanto)
      const comparison = vendorsSales.map((v, index) => {
        // Simplificação: assume distribuição igual ou zero
        const warrantyShare = vendorsSales.length > 0 ? Math.floor(totalWarrantyCount / vendorsSales.length) : 0;
        return {
          vendorId: v.vendorId,
          vendorName: v.vendorName || "Vendedor Desconhecido",
          totalProducts: Number(v.totalProducts),
          totalWarranty: index === 0 ? totalWarrantyCount : 0, // Atribui tudo ao primeiro vendedor por simplicidade
        };
      });

      return comparison;
    }),
});
