/**
 * Procedures de onboarding self-service
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { tenants, users, plans } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail, generateTemporaryPassword } from "./email";

/**
 * Router de onboarding
 */
export const onboardingRouter = router({
  /**
   * Verifica se email já está em uso
   */
  checkEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      return {
        available: existingUser.length === 0,
      };
    }),

  /**
   * Cadastra novo cliente (tenant + usuário admin)
   */
  register: publicProcedure
    .input(z.object({
      // Dados pessoais
      name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
      email: z.string().email("Email inválido"),
      phone: z.string().min(10, "Telefone inválido"),
      
      // Dados da loja
      storeName: z.string().min(3, "Nome da loja deve ter pelo menos 3 caracteres"),
      cnpj: z.string().optional(),
      
      // Plano escolhido
      planSlug: z.enum(["basico", "profissional", "empresarial"]),
    }))
    .mutation(async ({ input }) => {
      // 1. Verificar se email já existe
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email já está cadastrado",
        });
      }

      // 2. Gerar subdomain único baseado no nome da loja
      const baseSubdomain = input.storeName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9]/g, "-") // Substitui caracteres especiais por hífen
        .replace(/-+/g, "-") // Remove hífens duplicados
        .replace(/^-|-$/g, ""); // Remove hífens no início/fim

      // Verificar se subdomain já existe e adicionar número se necessário
      let subdomain = baseSubdomain;
      let counter = 1;
      while (true) {
        const existingTenant = await db
          .select()
          .from(tenants)
          .where(eq(tenants.subdomain, subdomain))
          .limit(1);

        if (existingTenant.length === 0) break;
        
        subdomain = `${baseSubdomain}-${counter}`;
        counter++;
      }

      // 3. Buscar plano selecionado
      const planResult = await db
        .select()
        .from(plans)
        .where(eq(plans.slug, input.planSlug))
        .limit(1);
      
      const plan = planResult[0];

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plano não encontrado",
        });
      }

      // 4. Criar tenant
      await db
        .insert(tenants)
        .values({
          name: input.storeName,
          subdomain,
          planId: plan.id,
          status: "trial", // Começa em trial
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        });
      
      // Buscar tenant recém-criado
      const [newTenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
      if (!newTenant) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create tenant" });
      }

      // 5. Gerar senha temporária
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      // 6. Criar usuário admin do tenant
      await db
        .insert(users)
        .values({
          tenantId: newTenant.id,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "admin",
          active: true,
        });
      
      // Buscar usuário recém-criado
      const [newUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!newUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
      }

      // 7. Enviar email de boas-vindas
      const loginUrl = `${process.env.VITE_APP_URL || "http://localhost:3000"}/login`;
      const supportUrl = "https://help.cellsync.com"; // Ajustar conforme necessário

      await sendWelcomeEmail({
        userName: input.name,
        userEmail: input.email,
        temporaryPassword,
        loginUrl,
        supportUrl,
      });

      // 8. Retornar dados do tenant e usuário
      return {
        success: true,
        tenant: {
          id: newTenant.id,
          name: newTenant.name,
          subdomain: newTenant.subdomain,
          status: newTenant.status,
          trialEndsAt: newTenant.trialEndsAt,
        },
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        message: "Cadastro realizado com sucesso! Verifique seu email para acessar o sistema.",
      };
    }),
});
