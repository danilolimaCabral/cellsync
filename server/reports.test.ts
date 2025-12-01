import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createReportsContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@cellsync.com",
    name: "Admin User",
    loginMethod: "local",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("reports module", () => {
  const startDate = new Date("2025-01-01");
  const endDate = new Date("2025-12-31");

  it("should get sales statistics", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.salesStats({ startDate, endDate });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalSales");
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("averageTicket");
    expect(result).toHaveProperty("salesByPeriod");
    expect(typeof result.totalSales).toBe("number");
    expect(typeof result.totalRevenue).toBe("number");
    expect(typeof result.averageTicket).toBe("number");
    expect(Array.isArray(result.salesByPeriod)).toBe(true);
  });

  it("should get top products", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.topProducts({ startDate, endDate, limit: 10 });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("productId");
      expect(result[0]).toHaveProperty("productName");
      expect(result[0]).toHaveProperty("quantity");
      expect(result[0]).toHaveProperty("revenue");
    }
  });

  it("should get seller performance", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.sellerPerformance({ startDate, endDate });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("sellerId");
      expect(result[0]).toHaveProperty("sellerName");
      expect(result[0]).toHaveProperty("salesCount");
      expect(result[0]).toHaveProperty("totalRevenue");
    }
  });

  it("should get service order statistics", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.serviceOrderStats({ startDate, endDate });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("byStatus");
    expect(typeof result.total).toBe("number");
    expect(Array.isArray(result.byStatus)).toBe(true);
  });

  it("should get financial KPIs", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.financialKPIs({ startDate, endDate });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("totalExpenses");
    expect(result).toHaveProperty("netProfit");
    expect(result).toHaveProperty("profitMargin");
    expect(typeof result.totalRevenue).toBe("number");
    expect(typeof result.totalExpenses).toBe("number");
    expect(typeof result.netProfit).toBe("number");
    expect(typeof result.profitMargin).toBe("number");
  });

  it("should get inventory statistics", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.inventoryStats();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalProducts");
    expect(result).toHaveProperty("lowStock");
    expect(result).toHaveProperty("outOfStock");
    expect(result).toHaveProperty("totalValue");
    expect(typeof result.totalProducts).toBe("number");
    expect(typeof result.lowStock).toBe("number");
    expect(typeof result.outOfStock).toBe("number");
    expect(typeof result.totalValue).toBe("number");
  });

  it("should calculate average ticket correctly", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.salesStats({ startDate, endDate });

    if (result.totalSales > 0) {
      const expectedAverage = Math.round(result.totalRevenue / result.totalSales);
      expect(result.averageTicket).toBe(expectedAverage);
    } else {
      expect(result.averageTicket).toBe(0);
    }
  });

  it("should calculate profit margin correctly", async () => {
    const { ctx } = createReportsContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.financialKPIs({ startDate, endDate });

    if (result.totalRevenue > 0) {
      const expectedMargin = Math.round((result.netProfit / result.totalRevenue) * 100 * 100) / 100;
      expect(result.profitMargin).toBe(expectedMargin);
    } else {
      expect(result.profitMargin).toBe(0);
    }
  });
});
