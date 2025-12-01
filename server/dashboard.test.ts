import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import bcrypt from "bcryptjs";

describe("Dashboard Overview", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Criar usuário de teste (ou buscar se já existe)
    let user = await db.getUserByEmail("dashboard-test@test.com");
    
    if (!user) {
      const hashedPassword = await bcrypt.hash("test123", 10);
      await db.createUser({
        email: "dashboard-test@test.com",
        password: hashedPassword,
        name: "Dashboard Test User",
        role: "admin",
        active: true,
      });
      user = await db.getUserByEmail("dashboard-test@test.com");
    }

    testUserId = user!.id;
  });

  it("deve retornar overview com estrutura correta", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: "dashboard-test@test.com",
        name: "Dashboard Test User",
        role: "admin",
      },
      req: {} as any,
      res: {} as any,
    });

    const overview = await caller.dashboard.overview();

    // Verificar estrutura do objeto
    expect(overview).toBeDefined();
    expect(overview).toHaveProperty("totalSales");
    expect(overview).toHaveProperty("totalRevenue");
    expect(overview).toHaveProperty("totalCustomers");
    expect(overview).toHaveProperty("totalProducts");
    expect(overview).toHaveProperty("openServiceOrders");
    expect(overview).toHaveProperty("pendingPayments");
  });

  it("deve retornar tipos corretos para todos os campos", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: "dashboard-test@test.com",
        name: "Dashboard Test User",
        role: "admin",
      },
      req: {} as any,
      res: {} as any,
    });

    const overview = await caller.dashboard.overview();

    // Verificar tipos
    expect(typeof overview.totalSales).toBe("number");
    expect(typeof overview.totalRevenue).toBe("number");
    expect(typeof overview.totalCustomers).toBe("number");
    expect(typeof overview.totalProducts).toBe("number");
    expect(typeof overview.openServiceOrders).toBe("number");
    expect(typeof overview.pendingPayments).toBe("number");
  });

  it("deve retornar valores não negativos", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: "dashboard-test@test.com",
        name: "Dashboard Test User",
        role: "admin",
      },
      req: {} as any,
      res: {} as any,
    });

    const overview = await caller.dashboard.overview();

    // Verificar que valores não são negativos
    expect(overview.totalSales).toBeGreaterThanOrEqual(0);
    expect(overview.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(overview.totalCustomers).toBeGreaterThanOrEqual(0);
    expect(overview.totalProducts).toBeGreaterThanOrEqual(0);
    expect(overview.openServiceOrders).toBeGreaterThanOrEqual(0);
    expect(overview.pendingPayments).toBeGreaterThanOrEqual(0);
  });

  it("deve retornar dados reais do banco (não zeros)", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        email: "dashboard-test@test.com",
        name: "Dashboard Test User",
        role: "admin",
      },
      req: {} as any,
      res: {} as any,
    });

    const overview = await caller.dashboard.overview();

    // Com os dados importados, deve ter pelo menos:
    // - 1.100 clientes
    // - 204+ produtos
    expect(overview.totalCustomers).toBeGreaterThan(0);
    expect(overview.totalProducts).toBeGreaterThan(0);
    
    // Receita pode ser 0 se não houver vendas ainda, mas deve ser número válido
    expect(Number.isFinite(overview.totalRevenue)).toBe(true);
  });

  it("deve funcionar para usuário não autenticado (retornar erro)", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    // Deve lançar erro de autenticação
    await expect(caller.dashboard.overview()).rejects.toThrow();
  });
});
