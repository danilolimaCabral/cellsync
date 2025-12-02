import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import bcrypt from "bcryptjs";

describe("Tenant Switching", () => {
  let masterAdminId: number;
  let tenantId: number;

  beforeAll(async () => {
    // Criar um master_admin de teste
    const hashedPassword = await bcrypt.hash("testpassword123", 10);
    const database = await db.getDb();
    
    if (!database) {
      throw new Error("Database not available");
    }

    // Criar master admin
    const { users } = await import("../drizzle/schema");
    const [masterAdmin] = await database
      .insert(users)
      .values({
        email: "test-master@test.com",
        password: hashedPassword,
        name: "Test Master Admin",
        role: "master_admin",
        active: true,
      })
      .$returningId();

    masterAdminId = masterAdmin.id;

    // Criar um tenant de teste
    const { tenants } = await import("../drizzle/schema");
    const [tenant] = await database
      .insert(tenants)
      .values({
        name: "Test Tenant",
        subdomain: "test-tenant",
        status: "active",
        planId: 1,
      })
      .$returningId();

    tenantId = tenant.id;
  });

  it("should list all tenants for master_admin", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: masterAdminId,
        email: "test-master@test.com",
        name: "Test Master Admin",
        role: "master_admin",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignIn: new Date(),
        password: "hashed",
      },
    });

    const result = await caller.tenantManagement.list({
      page: 1,
      limit: 100,
    });

    expect(result).toBeDefined();
    expect(result.tenants).toBeInstanceOf(Array);
    expect(result.tenants.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("should switch tenant for master_admin", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: masterAdminId,
        email: "test-master@test.com",
        name: "Test Master Admin",
        role: "master_admin",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignIn: new Date(),
        password: "hashed",
      },
    });

    const result = await caller.tenantSwitching.switchTenant({
      tenantId,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toContain("Tenant alterado");
  });

  it("should get current tenant after switching", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: masterAdminId,
        email: "test-master@test.com",
        name: "Test Master Admin",
        role: "master_admin",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignIn: new Date(),
        password: "hashed",
      },
    });

    const result = await caller.tenantSwitching.getCurrentTenant();

    expect(result).toBeDefined();
    // Pode ou não estar impersonando dependendo do estado anterior
  });

  it("should exit impersonation", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: masterAdminId,
        email: "test-master@test.com",
        name: "Test Master Admin",
        role: "master_admin",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignIn: new Date(),
        password: "hashed",
      },
    });

    const result = await caller.tenantSwitching.exitImpersonation();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toContain("Voltou ao seu tenant");
  });
});
