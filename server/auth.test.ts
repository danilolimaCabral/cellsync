import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import bcrypt from "bcryptjs";

describe("Autenticação Local", () => {
  const testEmail = "test@okcells.com";
  const testPassword = "senha123";
  const testName = "Usuário Teste";

  // Criar contexto mock
  function createMockContext(): TrpcContext {
    const cookies: Record<string, string> = {};
    return {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        cookies,
      } as any,
      res: {
        cookie: (name: string, value: string) => {
          cookies[name] = value;
        },
        clearCookie: (name: string) => {
          delete cookies[name];
        },
      } as any,
    };
  }

  describe("auth.register", () => {
    it("deve criar um novo usuário com senha criptografada", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.register({
        email: testEmail,
        password: testPassword,
        name: testName,
        role: "vendedor",
      });

      expect(result.success).toBe(true);

      // Verificar se usuário foi criado no banco
      const user = await db.getUserByEmail(testEmail);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
      expect(user?.name).toBe(testName);
      expect(user?.role).toBe("vendedor");
      expect(user?.active).toBe(true);

      // Verificar se senha foi criptografada
      const isPasswordValid = await bcrypt.compare(testPassword, user!.password);
      expect(isPasswordValid).toBe(true);
    });

    it("não deve permitir cadastro com email duplicado", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Tentar cadastrar com mesmo email
      await expect(
        caller.auth.register({
          email: testEmail,
          password: "outrasenha",
          name: "Outro Nome",
        })
      ).rejects.toThrow("Email já cadastrado");
    });
  });

  describe("auth.login", () => {
    it("deve fazer login com credenciais válidas", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.login({
        email: testEmail,
        password: testPassword,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.name).toBe(testName);
      expect(result.user.role).toBe("vendedor");
    });

    it("não deve fazer login com senha incorreta", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.login({
          email: testEmail,
          password: "senhaerrada",
        })
      ).rejects.toThrow("Email ou senha inválidos");
    });

    it("não deve fazer login com email inexistente", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.login({
          email: "naoexiste@okcells.com",
          password: testPassword,
        })
      ).rejects.toThrow("Email ou senha inválidos");
    });
  });

  describe("auth.logout", () => {
    it("deve fazer logout e limpar cookie", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
    });
  });

  describe("auth.me", () => {
    it("deve retornar null quando não autenticado", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });

    it("deve retornar usuário quando autenticado", async () => {
      // Criar usuário autenticado no contexto
      const user = await db.getUserByEmail(testEmail);
      const ctx = createMockContext();
      ctx.user = user!;
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
    });
  });
});
