import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

// Helper para criar procedimentos protegidos
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Helper para procedimentos apenas admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  // ============= AUTENTICAÇÃO LOCAL =============
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user || !user.active) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Email ou senha inválidos" 
          });
        }

        const isValidPassword = await bcrypt.compare(input.password, user.password);
        
        if (!isValidPassword) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Email ou senha inválidos" 
          });
        }

        // Atualizar último login
        await db.updateUserLastSignIn(user.id);

        // Criar JWT token
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({ userId: user.id })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(secret);

        // Definir cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        role: z.enum(["admin", "vendedor", "tecnico", "gerente"]).optional(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se email já existe
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Email já cadastrado" 
          });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Criar usuário
        await db.createUser({
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: input.role || "vendedor",
          active: true,
        });

        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // ============= DASHBOARD / BI =============
  dashboard: router({
    overview: protectedProcedure.query(async () => {
      // TODO: Implementar queries para métricas principais
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        totalProducts: 0,
        openServiceOrders: 0,
        pendingPayments: 0,
      };
    }),
  }),

  // ============= CLIENTES (CRM) =============
  customers: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        segment: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const customers = await db.listCustomers(input || {});
        return customers;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar criação de cliente
        return { success: true };
      }),
  }),

  // ============= PRODUTOS =============
  products: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        lowStock: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const products = await db.listProducts(input || {});
        return products;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        costPrice: z.number().min(0),
        salePrice: z.number().min(0),
        minStock: z.number().min(0).default(10),
        requiresImei: z.boolean().default(false),
      }))
      .mutation(async () => {
        // TODO: Implementar criação de produto
        return { success: true };
      }),
  }),

  // ============= ESTOQUE =============
  stock: router({
    list: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        status: z.enum(["disponivel", "vendido", "reservado", "defeito", "em_reparo"]).optional(),
        location: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de estoque
        return [];
      }),

    addItem: protectedProcedure
      .input(z.object({
        productId: z.number(),
        imei: z.string().optional(),
        serialNumber: z.string().optional(),
        location: z.string().optional(),
        warrantyExpiry: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar adição de item ao estoque
        return { success: true };
      }),

    movements: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        type: z.enum(["entrada", "saida", "transferencia", "ajuste", "devolucao"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de movimentações
        return [];
      }),
  }),

  // ============= VENDAS (PDV) =============
  sales: router({
    list: protectedProcedure
      .input(z.object({
        customerId: z.number().optional(),
        sellerId: z.number().optional(),
        status: z.enum(["pendente", "concluida", "cancelada"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de vendas
        return [];
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().min(1),
          unitPrice: z.number().min(0),
          imei: z.string().optional(),
        })),
        paymentMethod: z.string(),
        totalAmount: z.number().min(0),
        discount: z.number().min(0).default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const sellerId = ctx.user.id;
        const saleId = await db.createSale({
          customerId: input.customerId,
          sellerId,
          items: input.items,
          paymentMethod: input.paymentMethod,
          totalAmount: input.totalAmount,
          discount: input.discount,
        });
        return { success: true, saleId };
      }),
  }),

  // ============= ORDENS DE SERVIÇO =============
  serviceOrders: router({
    list: protectedProcedure
      .input(z.object({
        customerId: z.number().optional(),
        technicianId: z.number().optional(),
        status: z.enum(["aberta", "em_diagnostico", "aguardando_aprovacao", "em_reparo", "concluida", "cancelada", "aguardando_retirada"]).optional(),
        priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de OS
        return [];
      }),

    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        deviceType: z.string(),
        brand: z.string().optional(),
        model: z.string().optional(),
        imei: z.string().optional(),
        serialNumber: z.string().optional(),
        defect: z.string().min(5),
        priority: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
        notes: z.string().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar criação de OS
        return { success: true, orderId: 0 };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["aberta", "em_diagnostico", "aguardando_aprovacao", "em_reparo", "concluida", "cancelada", "aguardando_retirada"]),
        diagnosis: z.string().optional(),
        solution: z.string().optional(),
        estimatedCost: z.number().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar atualização de status da OS
        return { success: true };
      }),
  }),

  // ============= USOS FUTUROS =============
  // Placeholder para futuras funcionalidades
  placeholder: router({
    test: protectedProcedure
      .input(z.object({
        status: z.enum(["pendente", "pago", "atrasado", "cancelado"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de contas a pagar
        return [];
      }),

    accountsReceivable: protectedProcedure
      .input(z.object({
        status: z.enum(["pendente", "recebido", "atrasado", "cancelado"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de contas a receber
        return [];
      }),

    createPayable: protectedProcedure
      .input(z.object({
        description: z.string().min(2),
        category: z.string().optional(),
        costCenter: z.string().optional(),
        supplier: z.string().optional(),
        amount: z.number().min(0),
        dueDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar criação de conta a pagar
        return { success: true };
      }),

    createReceivable: protectedProcedure
      .input(z.object({
        customerId: z.number().optional(),
        description: z.string().min(2),
        amount: z.number().min(0),
        dueDate: z.date(),
        referenceType: z.string().optional(),
        referenceId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar criação de conta a receber
        return { success: true };
      }),
  }),

  // ============= MARKETING / CAMPANHAS =============
  marketing: router({
    campaigns: protectedProcedure
      .input(z.object({
        status: z.enum(["rascunho", "agendada", "enviada", "cancelada"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de campanhas
        return [];
      }),

    createCampaign: protectedProcedure
      .input(z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        type: z.enum(["email", "sms", "whatsapp", "push"]),
        targetSegment: z.string().optional(),
        message: z.string().min(10),
        scheduledFor: z.date().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar criação de campanha
        return { success: true };
      }),
  }),

  // ============= NOTIFICAÇÕES =============
  notifications: router({
    list: protectedProcedure
      .input(z.object({
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de notificações
        return [];
      }),

    markAsRead: protectedProcedure
      .input(z.object({
        notificationId: z.number(),
      }))
      .mutation(async () => {
        // TODO: Implementar marcação como lida
        return { success: true };
      }),
  }),

  // ============= USUÁRIOS (ADMIN) =============
  users: router({
    list: adminProcedure
      .input(z.object({
        role: z.enum(["admin", "vendedor", "tecnico", "gerente"]).optional(),
        active: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async () => {
        // TODO: Implementar query de usuários
        return [];
      }),

    update: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        role: z.enum(["admin", "vendedor", "tecnico", "gerente"]).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async () => {
        // TODO: Implementar atualização de usuário
        return { success: true };
      }),
  }),

  // ============= FINANCEIRO =============
  financial: router({
    // Contas a Pagar
    accountsPayable: router({
      list: protectedProcedure
        .input(z.object({
          status: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }).optional())
        .query(async ({ input }) => {
          return await db.listAccountsPayable(input || {});
        }),

      create: protectedProcedure
        .input(z.object({
          description: z.string(),
          category: z.string().optional(),
          costCenter: z.string().optional(),
          supplier: z.string().optional(),
          amount: z.number(),
          dueDate: z.date(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return await db.createAccountPayable({
            ...input,
            createdBy: ctx.user.id,
          });
        }),

      updateStatus: protectedProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["pendente", "pago", "atrasado", "cancelado"]),
          paymentDate: z.date().optional(),
        }))
        .mutation(async ({ input }) => {
          await db.updateAccountPayableStatus(input.id, input.status, input.paymentDate);
          return { success: true };
        }),
    }),

    // Contas a Receber
    accountsReceivable: router({
      list: protectedProcedure
        .input(z.object({
          status: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }).optional())
        .query(async ({ input }) => {
          return await db.listAccountsReceivable(input || {});
        }),

      create: protectedProcedure
        .input(z.object({
          customerId: z.number().optional(),
          description: z.string(),
          amount: z.number(),
          dueDate: z.date(),
          referenceType: z.string().optional(),
          referenceId: z.number().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return await db.createAccountReceivable({
            ...input,
            createdBy: ctx.user.id,
          });
        }),

      updateStatus: protectedProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["pendente", "recebido", "atrasado", "cancelado"]),
          paymentDate: z.date().optional(),
        }))
        .mutation(async ({ input }) => {
          await db.updateAccountReceivableStatus(input.id, input.status, input.paymentDate);
          return { success: true };
        }),
    }),

    // Fluxo de Caixa
    cashFlow: router({
      get: protectedProcedure
        .input(z.object({
          startDate: z.date(),
          endDate: z.date(),
        }))
        .query(async ({ input }) => {
          return await db.getCashFlow(input.startDate, input.endDate);
        }),
      }),
  }),

  // ============= HISTÓRICO DE VENDAS =============
  salesHistory: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sellerId: z.number().optional(),
        customerId: z.number().optional(),
        status: z.string().optional(),
        paymentMethod: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getSalesHistory(input);
      }),
  }),

  // ============= RELATÓRIOS E BI =============
  reports: router({
    salesStats: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getSalesStats(input.startDate, input.endDate);
      }),

    topProducts: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getTopProducts(input.startDate, input.endDate, input.limit);
      }),

    sellerPerformance: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getSellerPerformance(input.startDate, input.endDate);
      }),

    serviceOrderStats: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getServiceOrderStats(input.startDate, input.endDate);
      }),

    financialKPIs: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getFinancialKPIs(input.startDate, input.endDate);
      }),

    inventoryStats: protectedProcedure
      .query(async () => {
        return await db.getInventoryStats();
      }),
  }),
});

export type AppRouter = typeof appRouter;
