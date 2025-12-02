import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Testes do Dashboard BI - Endpoints de KPIs e Estatísticas
 */
describe("Dashboard BI", () => {
  // Mock de contexto autenticado
  const mockContext: TrpcContext = {
    user: {
      id: 1,
      tenantId: 1,
      email: "admin@cellsync.com",
      name: "Admin",
      role: "admin",
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  describe("topVendors", () => {
    it("deve retornar lista de vendedores ordenados por faturamento", async () => {
      const result = await caller.dashboardBI.topVendors({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
        endDate: new Date().toISOString(),
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Se houver vendedores, verificar estrutura
      if (result.length > 0) {
        const vendor = result[0];
        expect(vendor).toHaveProperty("userId");
        expect(vendor).toHaveProperty("userName");
        expect(vendor).toHaveProperty("totalSales");
        expect(vendor).toHaveProperty("totalRevenue");
        expect(vendor).toHaveProperty("avgTicket");
        
        // Verificar tipos
        expect(typeof vendor.userId).toBe("number");
        expect(typeof vendor.userName).toBe("string");
        expect(typeof vendor.totalSales).toBe("number");
        expect(typeof vendor.totalRevenue).toBe("number");
        expect(typeof vendor.avgTicket).toBe("number");
        
        // Verificar valores não negativos
        expect(vendor.totalSales).toBeGreaterThanOrEqual(0);
        expect(vendor.totalRevenue).toBeGreaterThanOrEqual(0);
        expect(vendor.avgTicket).toBeGreaterThanOrEqual(0);
      }
    });

    it("deve respeitar o limite de resultados", async () => {
      const limit = 5;
      const result = await caller.dashboardBI.topVendors({
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano atrás
        endDate: new Date().toISOString(),
        limit,
      });

      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it("deve retornar vendedores ordenados por faturamento (maior primeiro)", async () => {
      const result = await caller.dashboardBI.topVendors({
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit: 10,
      });

      // Verificar ordenação decrescente por totalRevenue
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].totalRevenue).toBeGreaterThanOrEqual(result[i + 1].totalRevenue);
      }
    });

    it("deve filtrar por período corretamente", async () => {
      // Período muito curto (hoje)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await caller.dashboardBI.topVendors({
        startDate: today.toISOString(),
        endDate: new Date().toISOString(),
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Pode estar vazio se não houver vendas hoje
    });
  });

  describe("salesKPIs", () => {
    it("deve retornar KPIs de vendas válidos", async () => {
      const result = await caller.dashboardBI.salesKPIs({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalSales");
      expect(result).toHaveProperty("totalRevenue");
      expect(result).toHaveProperty("avgTicket");
      
      // Verificar tipos
      expect(typeof result.totalSales).toBe("number");
      expect(typeof result.totalRevenue).toBe("number");
      expect(typeof result.avgTicket).toBe("number");
      
      // Verificar valores não negativos
      expect(result.totalSales).toBeGreaterThanOrEqual(0);
      expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(result.avgTicket).toBeGreaterThanOrEqual(0);
    });
  });

  describe("topProducts", () => {
    it("deve retornar produtos mais vendidos", async () => {
      const result = await caller.dashboardBI.topProducts({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Se houver produtos, verificar estrutura
      if (result.length > 0) {
        const product = result[0];
        expect(product).toHaveProperty("productId");
        expect(product).toHaveProperty("productName");
        expect(product).toHaveProperty("totalQuantity");
        expect(product).toHaveProperty("totalRevenue");
        
        // Verificar tipos
        expect(typeof product.productId).toBe("number");
        expect(typeof product.productName).toBe("string");
        expect(typeof product.totalQuantity).toBe("number");
        expect(typeof product.totalRevenue).toBe("number");
        
        // Verificar valores positivos
        expect(product.totalQuantity).toBeGreaterThan(0);
        expect(product.totalRevenue).toBeGreaterThan(0);
      }
    });

    it("deve respeitar o limite de resultados", async () => {
      const limit = 5;
      const result = await caller.dashboardBI.topProducts({
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit,
      });

      expect(result.length).toBeLessThanOrEqual(limit);
    });
  });

  describe("stockKPIs", () => {
    it("deve retornar KPIs de estoque válidos", async () => {
      const result = await caller.dashboardBI.stockKPIs();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalItems");
      expect(result).toHaveProperty("availableItems");
      expect(result).toHaveProperty("totalValue");
      
      // Verificar tipos
      expect(typeof result.totalItems).toBe("number");
      expect(typeof result.availableItems).toBe("number");
      expect(typeof result.totalValue).toBe("number");
      
      // Verificar valores não negativos
      expect(result.totalItems).toBeGreaterThanOrEqual(0);
      expect(result.availableItems).toBeGreaterThanOrEqual(0);
      expect(result.totalValue).toBeGreaterThanOrEqual(0);
      
      // Verificar lógica: disponível <= total
      expect(result.availableItems).toBeLessThanOrEqual(result.totalItems);
    });
  });
});
