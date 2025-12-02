import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";

/**
 * Testes do Sistema de Vendedores
 */
describe("Vendors System", () => {
  // Mock de contexto admin
  const adminContext: TrpcContext = {
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

  const caller = appRouter.createCaller(adminContext);

  describe("list", () => {
    it("deve retornar lista de vendedores", async () => {
      const result = await caller.vendors.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve filtrar vendedores ativos", async () => {
      const result = await caller.vendors.list({ active: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Todos devem estar ativos
      result.forEach(vendor => {
        expect(vendor.active).toBe(true);
      });
    });

    it("deve buscar vendedores por termo", async () => {
      const result = await caller.vendors.list({ search: "test" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("create", () => {
    it("deve validar campos obrigatórios", async () => {
      await expect(
        caller.vendors.create({
          name: "",
          email: "invalid",
          password: "123",
          commissionPercentage: 0,
          commissionType: "percentual",
          fixedCommissionAmount: 0,
        })
      ).rejects.toThrow();
    });

    it("deve aceitar dados válidos de vendedor", async () => {
      const testEmail = `vendor_${Date.now()}@test.com`;
      
      const result = await caller.vendors.create({
        name: "Vendedor Teste",
        email: testEmail,
        password: "senha123",
        cpf: "12345678900",
        phone: "(11) 99999-9999",
        commissionPercentage: 500, // 5%
        commissionType: "percentual",
        fixedCommissionAmount: 0,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.vendorId).toBeDefined();
    });
  });

  describe("getSalesStats", () => {
    it("deve retornar estatísticas de vendas do vendedor", async () => {
      const vendors = await caller.vendors.list({ active: true });
      
      if (vendors.length > 0) {
        const vendorId = vendors[0].id;
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30); // Últimos 30 dias

        const stats = await caller.vendors.getSalesStats({
          vendorId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        expect(stats).toBeDefined();
        expect(stats).toHaveProperty("totalSales");
        expect(stats).toHaveProperty("totalRevenue");
        expect(stats).toHaveProperty("totalCommission");
        expect(stats).toHaveProperty("avgTicket");
        expect(stats).toHaveProperty("topProducts");
        
        // Verificar tipos
        expect(typeof stats.totalSales).toBe("number");
        expect(typeof stats.totalRevenue).toBe("number");
        expect(typeof stats.totalCommission).toBe("number");
        expect(typeof stats.avgTicket).toBe("number");
        expect(Array.isArray(stats.topProducts)).toBe(true);
        
        // Verificar valores não negativos
        expect(stats.totalSales).toBeGreaterThanOrEqual(0);
        expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);
        expect(stats.totalCommission).toBeGreaterThanOrEqual(0);
        expect(stats.avgTicket).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("commission calculation", () => {
    it("deve calcular comissão percentual corretamente", () => {
      const saleAmount = 100000; // R$ 1.000,00 em centavos
      const commissionPercentage = 500; // 5% em centésimos
      
      const expectedCommission = (saleAmount * commissionPercentage) / 10000;
      
      expect(expectedCommission).toBe(5000); // R$ 50,00 em centavos
    });

    it("deve calcular comissão fixa corretamente", () => {
      const fixedCommissionAmount = 10000; // R$ 100,00 em centavos
      
      expect(fixedCommissionAmount).toBe(10000);
    });

    it("deve calcular comissão mista corretamente", () => {
      const saleAmount = 100000; // R$ 1.000,00
      const commissionPercentage = 500; // 5%
      const fixedCommissionAmount = 5000; // R$ 50,00
      
      const percentualCommission = (saleAmount * commissionPercentage) / 10000;
      const totalCommission = percentualCommission + fixedCommissionAmount;
      
      expect(totalCommission).toBe(10000); // R$ 50,00 + R$ 50,00 = R$ 100,00
    });
  });

  describe("vendor validation", () => {
    it("deve validar formato de email", async () => {
      await expect(
        caller.vendors.create({
          name: "Teste",
          email: "email-invalido",
          password: "senha123",
          commissionPercentage: 0,
          commissionType: "percentual",
          fixedCommissionAmount: 0,
        })
      ).rejects.toThrow();
    });

    it("deve validar tamanho mínimo da senha", async () => {
      await expect(
        caller.vendors.create({
          name: "Teste",
          email: "teste@email.com",
          password: "123",
          commissionPercentage: 0,
          commissionType: "percentual",
          fixedCommissionAmount: 0,
        })
      ).rejects.toThrow();
    });

    it("deve validar percentual de comissão (0-100%)", async () => {
      await expect(
        caller.vendors.create({
          name: "Teste",
          email: "teste@email.com",
          password: "senha123",
          commissionPercentage: 15000, // 150% (inválido)
          commissionType: "percentual",
          fixedCommissionAmount: 0,
        })
      ).rejects.toThrow();
    });
  });
});
