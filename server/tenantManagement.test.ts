import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("tenantManagement.list", () => {
  it("should return list of tenants for master_admin", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        name: "Master Admin",
        email: "admin@master.com",
        role: "master_admin",
      },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.tenantManagement.list({});
    
    console.log("Result:", JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(result.tenants).toBeDefined();
    expect(Array.isArray(result.tenants)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it("should filter tenants by status", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        name: "Master Admin",
        email: "admin@master.com",
        role: "master_admin",
      },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.tenantManagement.list({
      status: "active",
    });
    
    console.log("Filtered result:", JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(result.tenants).toBeDefined();
    expect(result.tenants.every((t: any) => t.status === "active")).toBe(true);
  });
});
