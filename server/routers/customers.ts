import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { customers } from "../../drizzle/schema";
import { eq, like, or, and, desc, asc, count } from "drizzle-orm";

// Helper para criar procedimentos protegidos
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const customersRouter = router({
  // Listar clientes com paginação e busca
  list: protectedProcedure
    .input(z.object({
      page: z.number().int().positive().optional().default(1),
      limit: z.number().int().min(1).max(100).optional().default(20),
      search: z.string().optional(),
      sortBy: z.enum(["name", "createdAt"]).optional().default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const tenantId = ctx.user.tenantId;
      const offset = (input.page - 1) * input.limit;

      // Condições de filtro
      const conditions = [eq(customers.tenantId, tenantId)];
      
      if (input.search) {
        conditions.push(
          or(
            like(customers.name, `%${input.search}%`),
            like(customers.email, `%${input.search}%`),
            like(customers.cpf, `%${input.search}%`),
            like(customers.phone, `%${input.search}%`)
          ) as any
        );
      }

      // Query principal
      let query = db.select().from(customers).where(and(...conditions));

      // Ordenação
      if (input.sortBy === "name") {
        query = input.sortOrder === "asc" 
          ? query.orderBy(asc(customers.name)) as any
          : query.orderBy(desc(customers.name)) as any;
      } else {
        query = input.sortOrder === "asc"
          ? query.orderBy(asc(customers.createdAt)) as any
          : query.orderBy(desc(customers.createdAt)) as any;
      }

      const results = await query.limit(input.limit).offset(offset);

      // Contagem total
      const totalResult = await db
        .select({ count: count() })
        .from(customers)
        .where(and(...conditions));
        
      const total = totalResult[0]?.count || 0;

      return {
        items: results,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Obter cliente por ID
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .select()
        .from(customers)
        .where(and(
          eq(customers.id, input),
          eq(customers.tenantId, ctx.user.tenantId)
        ))
        .limit(1);

      if (!result.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }

      return result[0];
    }),

  // Criar novo cliente
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email("Email inválido").optional().or(z.literal("")),
      phone: z.string().optional(),
      cpf: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(customers).values({
        tenantId: ctx.user.tenantId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        cpf: input.cpf || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zipCode: input.zipCode || null,
        notes: input.notes || null,
      });

      return { success: true, id: result[0].insertId };
    }),

  // Atualizar cliente
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email("Email inválido").optional().or(z.literal("")),
      phone: z.string().optional(),
      cpf: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se existe e pertence ao tenant
      const existing = await db
        .select()
        .from(customers)
        .where(and(
          eq(customers.id, input.id),
          eq(customers.tenantId, ctx.user.tenantId)
        ))
        .limit(1);

      if (!existing.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }

      await db.update(customers)
        .set({
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          cpf: input.cpf || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zipCode: input.zipCode || null,
          notes: input.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, input.id));

      return { success: true };
    }),

  // Excluir cliente
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se existe e pertence ao tenant
      const existing = await db
        .select()
        .from(customers)
        .where(and(
          eq(customers.id, input),
          eq(customers.tenantId, ctx.user.tenantId)
        ))
        .limit(1);

      if (!existing.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }

      await db.delete(customers).where(eq(customers.id, input));

      return { success: true };
    }),
});
