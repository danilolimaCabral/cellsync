import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, sales, saleItems, products } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, like, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Helper para criar procedimentos protegidos
 */
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado - apenas admin" });
  }
  return next({ ctx });
});

/**
 * Router de Vendedores
 */
export const vendorsRouter = router({
  /**
   * Lista todos os vendedores
   */
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      active: z.boolean().optional(),
      tenantId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = ctx.user;
      const targetTenantId = (user.role === "master_admin" && input.tenantId) 
        ? input.tenantId 
        : user.tenantId;

      let conditions = [
        eq(users.tenantId, targetTenantId),
        eq(users.role, "vendedor"),
      ];

      if (input.active !== undefined) {
        conditions.push(eq(users.active, input.active));
      }

      if (input.search) {
        conditions.push(
          or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`),
            like(users.cpf, `%${input.search}%`)
          )!
        );
      }

      const vendors = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          cpf: users.cpf,
          phone: users.phone,
          commissionPercentage: users.commissionPercentage,
          commissionType: users.commissionType,
          fixedCommissionAmount: users.fixedCommissionAmount,
          active: users.active,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(...conditions))
        .orderBy(users.name);

      return vendors;
    }),

  /**
   * Obtém detalhes de um vendedor específico
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [vendor] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          cpf: users.cpf,
          phone: users.phone,
          commissionPercentage: users.commissionPercentage,
          commissionType: users.commissionType,
          fixedCommissionAmount: users.fixedCommissionAmount,
          active: users.active,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.id, input.id),
            eq(users.tenantId, ctx.user.tenantId),
            eq(users.role, "vendedor")
          )
        )
        .limit(1);

      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendedor não encontrado" });
      }

      return vendor;
    }),

  /**
   * Cria um novo vendedor
   */
  create: adminProcedure
    .input(z.object({
      name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      commissionPercentage: z.number().min(0).max(10000).default(0), // 0 a 100% (em centésimos)
      commissionType: z.enum(["percentual", "fixo", "misto"]).default("percentual"),
      fixedCommissionAmount: z.number().min(0).default(0), // Em centavos
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se email já existe
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Criar vendedor
      const [newVendor] = await db
        .insert(users)
        .values({
          tenantId: ctx.user.tenantId,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          cpf: input.cpf,
          phone: input.phone,
          role: "vendedor",
          commissionPercentage: input.commissionPercentage,
          commissionType: input.commissionType,
          fixedCommissionAmount: input.fixedCommissionAmount,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      return {
        success: true,
        message: "Vendedor cadastrado com sucesso",
        vendorId: newVendor.insertId,
      };
    }),

  /**
   * Atualiza um vendedor existente
   */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(3).optional(),
      email: z.string().email().optional(),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      commissionPercentage: z.number().min(0).max(10000).optional(),
      commissionType: z.enum(["percentual", "fixo", "misto"]).optional(),
      fixedCommissionAmount: z.number().min(0).optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // Verificar se vendedor existe
      const [vendor] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, id),
            eq(users.tenantId, ctx.user.tenantId),
            eq(users.role, "vendedor")
          )
        )
        .limit(1);

      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendedor não encontrado" });
      }

      // Se email foi alterado, verificar se já existe
      if (updateData.email && updateData.email !== vendor.email) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, updateData.email))
          .limit(1);

        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        }
      }

      // Atualizar vendedor
      await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      return {
        success: true,
        message: "Vendedor atualizado com sucesso",
      };
    }),

  /**
   * Deleta (desativa) um vendedor
   */
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se vendedor existe
      const [vendor] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.id),
            eq(users.tenantId, ctx.user.tenantId),
            eq(users.role, "vendedor")
          )
        )
        .limit(1);

      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendedor não encontrado" });
      }

      // Desativar vendedor (não deletar fisicamente)
      await db
        .update(users)
        .set({
          active: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id));

      return {
        success: true,
        message: "Vendedor desativado com sucesso",
      };
    }),

  /**
   * Obtém estatísticas de vendas de um vendedor
   */
  getSalesStats: protectedProcedure
    .input(z.object({
      vendorId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Estatísticas de vendas
      const [stats] = await db
        .select({
          totalSales: sql<number>`COUNT(*)`,
          totalRevenue: sql<number>`COALESCE(SUM(${sales.finalAmount}), 0)`,
          totalCommission: sql<number>`COALESCE(SUM(${sales.commission}), 0)`,
          avgTicket: sql<number>`COALESCE(AVG(${sales.finalAmount}), 0)`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.sellerId, input.vendorId),
            eq(sales.tenantId, ctx.user.tenantId),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate)
          )
        );

      // Produtos mais vendidos pelo vendedor
      const topProducts = await db
        .select({
          productId: saleItems.productId,
          productName: products.name,
          totalQuantity: sql<number>`SUM(${saleItems.quantity})`,
          totalRevenue: sql<number>`SUM(${saleItems.totalPrice})`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(
          and(
            eq(sales.sellerId, input.vendorId),
            eq(sales.tenantId, ctx.user.tenantId),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate)
          )
        )
        .groupBy(saleItems.productId, products.name)
        .orderBy(desc(sql`SUM(${saleItems.quantity})`))
        .limit(10);

      return {
        totalSales: Number(stats.totalSales),
        totalRevenue: Number(stats.totalRevenue),
        totalCommission: Number(stats.totalCommission),
        avgTicket: Number(stats.avgTicket),
        topProducts: topProducts.map(p => ({
          productId: p.productId,
          productName: p.productName,
          totalQuantity: Number(p.totalQuantity),
          totalRevenue: Number(p.totalRevenue),
        })),
      };
    }),
});
