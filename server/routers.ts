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
        saleType: z.enum(["retail", "wholesale"]).optional(),
        appliedDiscount: z.number().min(0).default(0),
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
          saleType: input.saleType,
          appliedDiscount: input.appliedDiscount,
        });
        return { success: true, saleId };
      }),

    generateReceipt: protectedProcedure
      .input(z.object({
        saleId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { generateReceipt } = await import("./receipt-generator");
        
        // Buscar dados da venda
        const sale = await db.getSaleById(input.saleId);
        if (!sale) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Venda não encontrada" });
        }
        
        // Buscar dados do cliente
        const customer = sale.customerId ? await db.getCustomerById(sale.customerId) : null;
        
        // Buscar dados do vendedor
        const seller = await db.getUserById(sale.sellerId);
        
        // Buscar itens da venda
        const items = await db.getSaleItems(input.saleId);
        
        // Preparar dados para o recibo
        const receiptData = {
          saleId: sale.id.toString(),
          saleNumber: sale.id,
          date: sale.createdAt,
          seller: seller?.name || "Vendedor",
          customer: customer ? {
            name: customer.name,
            document: customer.cpf || customer.cnpj || undefined,
            phone: customer.phone || undefined,
          } : undefined,
          products: items.map((item: any) => ({
            name: item.productName,
            sku: item.productSku || "N/A",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            imei: item.imei,
            warranty: "90 dias",
          })),
          subtotal: sale.totalAmount,
          discount: sale.discountAmount,
          total: sale.finalAmount,
          paymentMethod: sale.paymentMethod || "Não informado",
          commission: sale.commission || undefined,
          saleType: sale.saleType,
          savedAmount: sale.appliedDiscount || 0,
        };
        
        // Gerar PDF
        const pdfBuffer = await generateReceipt(receiptData);
        
        // Retornar PDF como base64
        return {
          success: true,
          pdf: pdfBuffer.toString("base64"),
        };
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
      }))
      .query(async ({ input, ctx }) => {
        const notificationsModule = await import("./notifications");
        
        if (input.unreadOnly) {
          return await notificationsModule.getUnreadNotifications(ctx.user.id);
        }
        
        return await notificationsModule.getAllNotifications(ctx.user.id, input.limit);
      }),

    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const notificationsModule = await import("./notifications");
        const unread = await notificationsModule.getUnreadNotifications(ctx.user.id);
        return { count: unread.length };
      }),

    markAsRead: protectedProcedure
      .input(z.object({
        notificationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const notificationsModule = await import("./notifications");
        await notificationsModule.markAsRead(input.notificationId);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const notificationsModule = await import("./notifications");
        await notificationsModule.markAllAsRead(ctx.user.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        notificationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const notificationsModule = await import("./notifications");
        await notificationsModule.deleteNotification(input.notificationId);
        return { success: true };
      }),

    runAlerts: adminProcedure
      .mutation(async () => {
        const notificationsModule = await import("./notifications");
        const results = await notificationsModule.runAutomatedChecks();
        return { success: true, results };
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

      // Métricas e melhorias
      metrics: protectedProcedure
        .input(z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        }).optional())
        .query(async ({ input }) => {
          const apModule = await import("./accounts-payable-improvements");
          return await apModule.getAccountsPayableMetrics(input || {});
        }),

      byStatusCategory: protectedProcedure
        .input(z.object({
          category: z.enum(["overdue", "dueToday", "upcoming", "paid"]),
        }))
        .query(async ({ input }) => {
          const apModule = await import("./accounts-payable-improvements");
          return await apModule.getAccountsByStatusCategory(input.category);
        }),

      bulkPayment: protectedProcedure
        .input(z.object({
          accountIds: z.array(z.number()),
          paymentDate: z.date().optional(),
        }))
        .mutation(async ({ input }) => {
          const apModule = await import("./accounts-payable-improvements");
          return await apModule.payAccountsInBulk(input.accountIds, input.paymentDate);
        }),

      bulkPaymentPreview: protectedProcedure
        .input(z.object({
          accountIds: z.array(z.number()),
        }))
        .query(async ({ input }) => {
          const apModule = await import("./accounts-payable-improvements");
          return await apModule.calculateBulkPaymentTotal(input.accountIds);
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

    // Relatório Avançado de Estoque
    advancedStock: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        supplier: z.string().optional(),
        warehouse: z.string().optional(),
        grade: z.string().optional(),
        readyForSale: z.boolean().optional(),
        hasDefect: z.boolean().optional(),
        minDaysInStock: z.number().optional(),
        maxDaysInStock: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const advancedStockModule = await import("./advanced-stock-report");
        return await advancedStockModule.getAdvancedStockReport(input);
      }),

    stockMetrics: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        supplier: z.string().optional(),
        warehouse: z.string().optional(),
        grade: z.string().optional(),
        readyForSale: z.boolean().optional(),
        hasDefect: z.boolean().optional(),
        minDaysInStock: z.number().optional(),
        maxDaysInStock: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const advancedStockModule = await import("./advanced-stock-report");
        return await advancedStockModule.getStockMetrics(input);
      }),

    filterOptions: protectedProcedure
      .query(async () => {
        const advancedStockModule = await import("./advanced-stock-report");
        return await advancedStockModule.getFilterOptions();
      }),
  }),

  // ============= MOVIMENTAÇÕES DE ESTOQUE =============
  stockMovements: router({
    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        stockItemId: z.number().optional(),
        type: z.enum(["entrada", "saida", "transferencia", "ajuste", "devolucao"]),
        quantity: z.number().positive(),
        fromLocation: z.string().optional(),
        toLocation: z.string().optional(),
        reason: z.string().optional(),
        referenceType: z.string().optional(),
        referenceId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createStockMovement({
          ...input,
          userId: ctx.user.id,
        });
      }),

    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        productId: z.number().optional(),
        type: z.string().optional(),
        userId: z.number().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getStockMovements(input);
      }),

    byIMEI: protectedProcedure
      .input(z.object({
        imei: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getStockMovementsByIMEI(input.imei);
      }),

    inventoryReport: protectedProcedure
      .query(async () => {
        return await db.getInventoryReport();
      }),
  }),

  // ============= PEÇAS EM ORDEM DE SERVIÇO =============
  serviceOrderParts: router({
    add: protectedProcedure
      .input(z.object({
        serviceOrderId: z.number(),
        productId: z.number(),
        stockItemId: z.number().optional(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      }))
      .mutation(async ({ input }) => {
        return await db.addPartToServiceOrder(input);
      }),

    remove: protectedProcedure
      .input(z.object({
        partId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.removePartFromServiceOrder(input.partId);
      }),

    list: protectedProcedure
      .input(z.object({
        serviceOrderId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getServiceOrderParts(input.serviceOrderId);
      }),

    byTechnician: protectedProcedure
      .input(z.object({
        technicianId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPartsByTechnician(input);
      }),

    completeServiceOrder: protectedProcedure
      .input(z.object({
        serviceOrderId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.processServiceOrderCompletion(input.serviceOrderId, ctx.user.id);
      }),
  }),

  // ============= COMISSÕES =============
  commissions: router({
    createRule: protectedProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string(),
        type: z.enum(["percentual_fixo", "meta_progressiva", "bonus_produto"]),
        active: z.boolean().optional(),
        percentage: z.number().optional(),
        minSalesAmount: z.number().optional(),
        maxSalesAmount: z.number().optional(),
        productId: z.number().optional(),
        bonusAmount: z.number().optional(),
        bonusPercentage: z.number().optional(),
        priority: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCommissionRule(input);
      }),

    getRulesByUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getCommissionRulesByUser(input.userId);
      }),

    getByUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getCommissionsByUser(input.userId, input.startDate, input.endDate);
      }),

    getPending: protectedProcedure
      .query(async () => {
        return await db.getPendingCommissions();
      }),

    approve: protectedProcedure
      .input(z.object({
        commissionId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.approveCommission(input.commissionId, ctx.user.id);
      }),

    pay: protectedProcedure
      .input(z.object({
        commissionId: z.number(),
        paymentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.payCommission(input.commissionId, input.paymentId);
      }),

    listRules: protectedProcedure
      .query(async () => {
        return await db.listCommissionRules();
      }),

    updateRule: protectedProcedure
      .input(z.object({
        ruleId: z.number(),
        userId: z.number().optional(),
        name: z.string().optional(),
        type: z.enum(["percentual_fixo", "meta_progressiva", "bonus_produto"]).optional(),
        active: z.boolean().optional(),
        percentage: z.number().optional(),
        minSalesAmount: z.number().optional(),
        maxSalesAmount: z.number().optional(),
        productId: z.number().optional(),
        bonusAmount: z.number().optional(),
        bonusPercentage: z.number().optional(),
        priority: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCommissionRule(input);
      }),

    deleteRule: protectedProcedure
      .input(z.object({
        ruleId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.deleteCommissionRule(input.ruleId);
      }),
  }),

  // ============= NOTA FISCAL ELETRÔNICA (NF-e) =============
  nfe: router({
    getLastNumber: protectedProcedure
      .query(async () => {
        return await db.getLastInvoiceNumber();
      }),

    create: protectedProcedure
      .input(z.object({
        saleId: z.number().optional(),
        series: z.number().default(1),
        model: z.string().default("55"),
        type: z.enum(["saida", "entrada"]).default("saida"),
        emitterCnpj: z.string(),
        emitterName: z.string(),
        emitterFantasyName: z.string().optional(),
        emitterAddress: z.string().optional(),
        emitterCity: z.string().optional(),
        emitterState: z.string().optional(),
        emitterZipCode: z.string().optional(),
        recipientDocument: z.string(),
        recipientName: z.string(),
        recipientAddress: z.string().optional(),
        recipientCity: z.string().optional(),
        recipientState: z.string().optional(),
        recipientZipCode: z.string().optional(),
        recipientPhone: z.string().optional(),
        recipientEmail: z.string().optional(),
        cfop: z.string(),
        natureOperation: z.string(),
        paymentMethod: z.enum(["dinheiro", "cheque", "cartao_credito", "cartao_debito", "credito_loja", "vale_alimentacao", "vale_refeicao", "vale_presente", "vale_combustivel", "boleto", "deposito", "pix", "sem_pagamento", "outros"]),
        paymentIndicator: z.enum(["a_vista", "a_prazo", "outros"]),
        totalProducts: z.number(),
        totalDiscount: z.number().default(0),
        totalFreight: z.number().default(0),
        totalInvoice: z.number(),
        additionalInfo: z.string().optional(),
        items: z.array(z.object({
          productId: z.number().optional(),
          code: z.string().optional(),
          ean: z.string().optional(),
          description: z.string(),
          ncm: z.string(),
          cfop: z.string(),
          unit: z.string().default("UN"),
          quantity: z.number(),
          unitPrice: z.number(),
          totalPrice: z.number(),
          discount: z.number().default(0),
          icmsRate: z.number().optional(),
          ipiRate: z.number().optional(),
          pisRate: z.number().optional(),
          cofinsRate: z.number().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const lastNumber = await db.getLastInvoiceNumber();
        const number = lastNumber + 1;
        
        // Criar a NF-e
        const invoiceId = await db.createInvoice({
          ...input,
          number,
          status: "rascunho",
          issuedBy: ctx.user.id,
        });
        
        // Criar os itens
        for (const item of input.items) {
          await db.createInvoiceItem({
            invoiceId,
            ...item,
            icmsOrigin: "0",
            icmsCst: "102",
            icmsBase: item.totalPrice,
            icmsRate: item.icmsRate || 1800,
            icmsValue: Math.round((item.totalPrice * (item.icmsRate || 1800)) / 10000),
            ipiCst: "99",
            ipiBase: item.totalPrice,
            ipiRate: item.ipiRate || 0,
            ipiValue: Math.round((item.totalPrice * (item.ipiRate || 0)) / 10000),
            pisCst: "99",
            pisBase: item.totalPrice,
            pisRate: item.pisRate || 165,
            pisValue: Math.round((item.totalPrice * (item.pisRate || 165)) / 10000),
            cofinsCst: "99",
            cofinsBase: item.totalPrice,
            cofinsRate: item.cofinsRate || 760,
            cofinsValue: Math.round((item.totalPrice * (item.cofinsRate || 760)) / 10000),
          });
        }
        
        return { invoiceId, number };
      }),

    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) throw new Error("NF-e não encontrada");
        
        const items = await db.getInvoiceItems(input.id);
        return { ...invoice, items };
      }),

    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.listInvoices(input);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.string(),
        accessKey: z.string().optional(),
        protocol: z.string().optional(),
        authorizationDate: z.date().optional(),
        xmlUrl: z.string().optional(),
        danfeUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, status, ...data } = input;
        await db.updateInvoiceStatus(id, status, data);
        return { success: true };
      }),

    cancel: protectedProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string(),
        protocol: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.cancelInvoice(input.id, input.reason, input.protocol);
        return { success: true };
      }),

    stats: protectedProcedure
      .query(async () => {
        return await db.getInvoiceStats();
      }),

    downloadXML: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) throw new Error("NF-e não encontrada");
        
        const items = await db.getInvoiceItems(input.id);
        const nfeData = { ...invoice, items };
        
        const { generateNFeXML } = await import("./nfe-xml");
        const xml = generateNFeXML(nfeData);
        
        return {
          xml,
          filename: `NFe_${String(invoice.number).padStart(9, "0")}_serie_${invoice.series}.xml`,
        };
      }),

    downloadDANFE: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) throw new Error("NF-e não encontrada");
        
        const items = await db.getInvoiceItems(input.id);
        const nfeData = { ...invoice, items };
        
        const { generateDANFE } = await import("./nfe-danfe");
        const pdfBuffer = await generateDANFE(nfeData);
        
        return {
          pdf: pdfBuffer.toString("base64"),
          filename: `DANFE_${String(invoice.number).padStart(9, "0")}_serie_${invoice.series}.pdf`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
