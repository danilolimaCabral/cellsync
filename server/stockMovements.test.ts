import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@okcells.com",
    name: "Test User",
    loginMethod: "local",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    active: true,
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

describe("stockMovements", () => {
  it("should create a stock movement", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stockMovements.create({
      productId: 1,
      type: "entrada",
      quantity: 10,
      reason: "Compra de fornecedor",
      toLocation: "Loja Principal",
    });

    expect(result).toHaveProperty("id");
    expect(result.success).toBe(true);
  });

  it("should list stock movements with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stockMovements.list({
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveProperty("movements");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.movements)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("should filter movements by type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stockMovements.list({
      type: "entrada",
      limit: 10,
    });

    expect(result).toHaveProperty("movements");
    if (result.movements.length > 0) {
      result.movements.forEach((movement: any) => {
        expect(movement.type).toBe("entrada");
      });
    }
  });

  it("should filter movements by product", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stockMovements.list({
      productId: 1,
      limit: 10,
    });

    expect(result).toHaveProperty("movements");
    if (result.movements.length > 0) {
      result.movements.forEach((movement: any) => {
        expect(movement.productId).toBe(1);
      });
    }
  });

  it("should get inventory report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stockMovements.inventoryReport();

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const item = result[0];
      expect(item).toHaveProperty("productId");
      expect(item).toHaveProperty("productName");
      expect(item).toHaveProperty("currentStock");
      expect(item).toHaveProperty("calculatedStock");
      expect(item).toHaveProperty("divergence");
      expect(item).toHaveProperty("status");
    }
  });

  it("should track movements by IMEI", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stockMovements.byIMEI({
      imei: "123456789012345",
    });

    expect(Array.isArray(result)).toBe(true);
    // Se houver movimentações, verificar estrutura
    if (result.length > 0) {
      const movement = result[0];
      expect(movement).toHaveProperty("productName");
      expect(movement).toHaveProperty("type");
      expect(movement).toHaveProperty("quantity");
      expect(movement).toHaveProperty("createdAt");
    }
  });

  it("should validate required fields for movement creation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.stockMovements.create({
        productId: 0, // ID inválido
        type: "entrada",
        quantity: 10,
      })
    ).rejects.toThrow();
  });

  it("should validate positive quantity", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.stockMovements.create({
        productId: 1,
        type: "entrada",
        quantity: -5, // Quantidade negativa
      })
    ).rejects.toThrow();
  });
});
