import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sales, saleItems, products, stockItems, invoices, accountsPayable, accountsReceivable } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

/**
 * Router de Dashboard BI com KPIs e estatísticas em tempo real
 */
export const dashboardRouter = router({
  /**
   * Obtém KPIs de vendas para o período especificado
   */
  salesKPIs: protectedProcedure
    .input(z.object({
      startDate: z.string(), // ISO date
      endDate: z.string(),   // ISO date
      tenantId: z.number().optional(), // master_admin pode especificar tenant
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

      // Total de vendas no período
      const salesResult = await db
        .select({
          totalSales: sql<number>`COUNT(*)`,
          totalRevenue: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
          avgTicket: sql<number>`COALESCE(AVG(${sales.totalAmount}), 0)`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.tenantId, targetTenantId),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate)
          )
        );

      const stats = salesResult[0] || { totalSales: 0, totalRevenue: 0, avgTicket: 0 };

      // Período anterior (mesmo tamanho) para comparação
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - periodDays);
      const prevEndDate = new Date(startDate);

      const prevSalesResult = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.tenantId, targetTenantId),
            gte(sales.saleDate, prevStartDate),
            lte(sales.saleDate, prevEndDate)
          )
        );

      const prevRevenue = prevSalesResult[0]?.totalRevenue || 0;
      const revenueGrowth = prevRevenue > 0 
        ? ((stats.totalRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;

      return {
        totalSales: Number(stats.totalSales),
        totalRevenue: Number(stats.totalRevenue),
        avgTicket: Number(stats.avgTicket),
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        periodDays,
      };
    }),

  /**
   * Obtém KPIs de estoque
   */
  stockKPIs: protectedProcedure
    .input(z.object({
      tenantId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input?.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      // Estatísticas de estoque (baseado em itens individuais com IMEI)
      const stockResult = await db
        .select({
          totalItems: sql<number>`COUNT(*)`,
          availableItems: sql<number>`SUM(CASE WHEN ${stockItems.status} = 'disponivel' THEN 1 ELSE 0 END)`,
          defectItems: sql<number>`SUM(CASE WHEN ${stockItems.hasDefect} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(stockItems)
        .where(eq(stockItems.tenantId, targetTenantId));

      // Valor total do estoque (usando preço de venda dos produtos)
      const valueResult = await db
        .select({
          totalValue: sql<number>`COALESCE(SUM(${products.salePrice}), 0)`,
        })
        .from(stockItems)
        .innerJoin(products, eq(stockItems.productId, products.id))
        .where(
          and(
            eq(stockItems.tenantId, targetTenantId),
            eq(stockItems.status, "disponivel")
          )
        );

      const stats = stockResult[0] || { totalItems: 0, availableItems: 0, defectItems: 0 };
      const totalValue = Number(valueResult[0]?.totalValue || 0);

      return {
        totalItems: Number(stats.totalItems),
        availableItems: Number(stats.availableItems),
        defectItems: Number(stats.defectItems),
        totalValue,
      };
    }),

  /**
   * Obtém KPIs financeiros
   */
  financialKPIs: protectedProcedure
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

      // Receitas (contas a receber pagas)
      const revenueResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            eq(accountsReceivable.tenantId, targetTenantId),
            sql`${accountsReceivable.status} = 'paid'`,
            gte(accountsReceivable.paymentDate, startDate),
            lte(accountsReceivable.paymentDate, endDate)
          )
        );

      const revenue = Number(revenueResult[0]?.total || 0);

      // Despesas (contas a pagar pagas)
      const expensesResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            eq(accountsPayable.tenantId, targetTenantId),
            sql`${accountsPayable.status} = 'pago'`,
            gte(accountsPayable.paymentDate, startDate),
            lte(accountsPayable.paymentDate, endDate)
          )
        );

      const expenses = Number(expensesResult[0]?.total || 0);
      const netProfit = revenue - expenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        revenue,
        expenses,
        netProfit,
        profitMargin: Number(profitMargin.toFixed(2)),
      };
    }),

  /**
   * Obtém dados para gráfico de vendas ao longo do tempo
   */
  salesTimeline: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
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

      // Formato de data baseado no agrupamento
      let dateFormat = "%Y-%m-%d"; // day
      if (input.groupBy === "week") dateFormat = "%Y-%U";
      if (input.groupBy === "month") dateFormat = "%Y-%m";

      const timeline = await db
        .select({
          period: sql<string>`DATE_FORMAT(${sales.saleDate}, ${dateFormat})`,
          totalSales: sql<number>`COUNT(*)`,
          totalRevenue: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.tenantId, targetTenantId),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate)
          )
        )
        .groupBy(sql`DATE_FORMAT(${sales.saleDate}, ${dateFormat})`)
        .orderBy(sql`DATE_FORMAT(${sales.saleDate}, ${dateFormat})`);

      return timeline.map(t => ({
        period: t.period,
        totalSales: Number(t.totalSales),
        totalRevenue: Number(t.totalRevenue),
      }));
    }),

  /**
   * Obtém produtos mais vendidos
   */
  topProducts: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      limit: z.number().default(10),
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

      const topProducts = await db
        .select({
          productId: saleItems.productId,
          productName: products.name,
          totalQuantity: sql<number>`SUM(${saleItems.quantity})`,
          totalRevenue: sql<number>`SUM(${saleItems.quantity} * ${saleItems.unitPrice})`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(
          and(
            eq(sales.tenantId, targetTenantId),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate)
          )
        )
        .groupBy(saleItems.productId, products.name)
        .orderBy(desc(sql`SUM(${saleItems.quantity})`))
        .limit(input.limit);

      return topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        totalQuantity: Number(p.totalQuantity),
        totalRevenue: Number(p.totalRevenue),
      }));
    }),
});
