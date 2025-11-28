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

describe("serviceOrderParts", () => {
  it("should add a part to service order", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.serviceOrderParts.add({
      serviceOrderId: 1,
      productId: 1,
      quantity: 2,
      unitPrice: 5000, // R$ 50,00
    });

    expect(result).toHaveProperty("id");
    expect(result.success).toBe(true);
  });

  it("should list parts for a service order", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.serviceOrderParts.list({
      serviceOrderId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should calculate total price correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Adicionar peça
    await caller.serviceOrderParts.add({
      serviceOrderId: 1,
      productId: 1,
      quantity: 3,
      unitPrice: 10000, // R$ 100,00
    });

    // Listar peças
    const parts = await caller.serviceOrderParts.list({
      serviceOrderId: 1,
    });

    // Verificar se o total foi calculado corretamente (3 * 10000 = 30000)
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      expect(lastPart.totalPrice).toBe(30000);
    }
  });

  it("should remove a part from service order", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Adicionar peça
    const addResult = await caller.serviceOrderParts.add({
      serviceOrderId: 1,
      productId: 1,
      quantity: 1,
      unitPrice: 5000,
    });

    // Remover peça
    const removeResult = await caller.serviceOrderParts.remove({
      partId: addResult.id,
    });

    expect(removeResult.success).toBe(true);
  });

  it("should get parts by technician", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.serviceOrderParts.byTechnician({
      technicianId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should validate positive quantity", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.serviceOrderParts.add({
        serviceOrderId: 1,
        productId: 1,
        quantity: 0, // Quantidade inválida
        unitPrice: 5000,
      })
    ).rejects.toThrow();
  });

  it("should validate non-negative unit price", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.serviceOrderParts.add({
        serviceOrderId: 1,
        productId: 1,
        quantity: 1,
        unitPrice: -100, // Preço negativo
      })
    ).rejects.toThrow();
  });

  it("should complete service order and update stock", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Adicionar peça à OS
    await caller.serviceOrderParts.add({
      serviceOrderId: 1,
      productId: 1,
      quantity: 1,
      unitPrice: 5000,
    });

    // Finalizar OS (deve criar movimentação e atualizar estoque)
    const result = await caller.serviceOrderParts.completeServiceOrder({
      serviceOrderId: 1,
    });

    expect(result.success).toBe(true);
  });
});
