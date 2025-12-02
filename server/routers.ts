import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sql, eq } from "drizzle-orm";
import { tenants, users, plans } from "../drizzle/schema";
import { getDb } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getUserByEmail } from "./db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import { analyzeProductWithAI } from "./ai-product-assistant";
import { diagnoseServiceOrder } from "./ai-os-assistant";
import { analyzeTicketWithAI } from "./ai-ticket-assistant";
import { generateLabel, generateBarcode, generateQRCode } from "./label-generator";
import { tenantSwitchingRouter } from "./routers/tenantSwitching";
import { tenantManagementRouter } from "./routers/tenantManagement";
import { aiAssistantRouter } from "./routers/aiAssistant";
import { notifyOwner } from "./_core/notification";

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
  aiAssistant: aiAssistantRouter,
  
  // ============= AUTENTICAÇÃO LOCAL =============
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log('[Login] Tentativa de login:', input.email);
        const user = await db.getUserByEmail(input.email);
        console.log('[Login] Usuário encontrado:', user ? `ID ${user.id}` : 'NÃO ENCONTRADO');
        
        if (!user || !user.active) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Email ou senha inválidos" 
          });
        }

        console.log('[Login] Verificando senha...');
        const isValidPassword = await bcrypt.compare(input.password, user.password);
        console.log('[Login] Senha válida:', isValidPassword);
        
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

        // Criar usuário (com tenantId padrão 1 para registro direto)
        // TODO: Criar tenant automático ou remover registro direto
        await db.createUser({
          tenantId: 1, // Tenant padrão para registros diretos
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: input.role || "vendedor",
          active: true,
        });

        return { success: true };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, "A senha deve conter pelo menos 8 caracteres, incluindo letras e números"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
        }

        // Buscar usuário atual
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
        }

        // Verificar senha atual
        const isValidPassword = await bcrypt.compare(input.currentPassword, user.password);
        if (!isValidPassword) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Senha atual incorreta" 
          });
        }

        // Hash da nova senha
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

        // Atualizar senha
        await db.changeUserPassword(ctx.user.id, newPasswordHash);

        return { success: true, message: "Senha alterada com sucesso" };
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
      const database = await db.getDb();
      if (!database) {
        return {
          totalSales: 0,
          totalRevenue: 0,
          totalCustomers: 0,
          totalProducts: 0,
          openServiceOrders: 0,
          pendingPayments: 0,
        };
      }

      const { sales, customers, products, serviceOrders, accountsReceivable } = await import("../drizzle/schema");
      const { sql, eq } = await import("drizzle-orm");

      try {
        // Vendas de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const salesTodayResult = await database
          .select({ count: sql<number>`COUNT(*)` })
          .from(sales)
          .where(sql`${sales.createdAt} >= ${today} AND ${sales.createdAt} < ${tomorrow}`);
        const totalSales = Number(salesTodayResult[0]?.count) || 0;

        // Receita total (todas as vendas)
        const revenueResult = await database
          .select({ total: sql<number>`SUM(${sales.finalAmount})` })
          .from(sales);
        const totalRevenue = Number(revenueResult[0]?.total) || 0;

        // Total de clientes
        const customersResult = await database
          .select({ count: sql<number>`COUNT(*)` })
          .from(customers);
        const totalCustomers = Number(customersResult[0]?.count) || 0;

        // Total de produtos
        const productsResult = await database
          .select({ count: sql<number>`COUNT(*)` })
          .from(products);
        const totalProducts = Number(productsResult[0]?.count) || 0;

        // OS abertas (status diferente de concluída e cancelada)
        const openOSResult = await database
          .select({ count: sql<number>`COUNT(*)` })
          .from(serviceOrders)
          .where(sql`${serviceOrders.status} NOT IN ('concluida', 'cancelada')`);
        const openServiceOrders = Number(openOSResult[0]?.count) || 0;

        // Pagamentos pendentes (contas a receber pendentes)
        const pendingPaymentsResult = await database
          .select({ count: sql<number>`COUNT(*)` })
          .from(accountsReceivable)
          .where(eq(accountsReceivable.status, "pendente"));
        const pendingPayments = Number(pendingPaymentsResult[0]?.count) || 0;

        return {
          totalSales,
          totalRevenue,
          totalCustomers,
          totalProducts,
          openServiceOrders,
          pendingPayments,
        };
      } catch (error) {
        console.error("[Dashboard] Error fetching overview:", error);
        return {
          totalSales: 0,
          totalRevenue: 0,
          totalCustomers: 0,
          totalProducts: 0,
          openServiceOrders: 0,
          pendingPayments: 0,
        };
      }
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
      .mutation(async ({ input }) => {
        const product = await db.createProduct(input);
        return product;
      }),

    importBulk: protectedProcedure
      .input(z.object({
        products: z.array(z.object({
          name: z.string().min(1),
          category: z.string().optional(),
          brand: z.string().optional(),
          model: z.string().optional(),
          sku: z.string().optional(),
          barcode: z.string().optional(),
          costPrice: z.number().min(0),
          salePrice: z.number().min(0),
          minStock: z.number().min(0).default(10),
          requiresImei: z.boolean().default(false),
        })),
      }))
      .mutation(async ({ input }) => {
        const results = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        for (const productData of input.products) {
          try {
            await db.createProduct(productData);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Erro ao importar "${productData.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }

        return results;
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
            brand: item.brand,
            model: item.model,
            category: item.category,
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

    // Chatbot de vendas com Gemini AI
    chat: publicProcedure
      .input(z.object({
        message: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        const systemPrompt = `Você é um assistente de vendas especializado da **CellSync**, uma plataforma completa de gestão para lojas de celular, assistências técnicas e importadoras.

Sua missão é:
1. Apresentar os benefícios da CellSync de forma convincente
2. Comparar com concorrentes (Bling, Tiny ERP, Omie, Conta Azul)
3. Destacar diferenciais exclusivos
4. Incentivar o fechamento do negócio

**Principais funcionalidades da CellSync:**
- 📱 PDV completo com controle de IMEI individual
- 📦 Gestão de estoque inteligente com alertas automáticos
- 🔧 Sistema de Ordem de Serviço (OS) com diagnóstico por IA
- 💰 Módulo financeiro integrado (contas a pagar/receber, fluxo de caixa)
- 👥 CRM avançado com histórico completo de clientes
- 📊 Business Intelligence (BI) com dashboards em tempo real
- 🏷️ Geração automática de etiquetas e códigos de barras
- 📄 Emissão de NF-e integrada
- 💳 Sistema de comissões automático para vendedores
- 🎯 Controle de vendas atacado e varejo
- 📱 Sistema multi-tenant (gestão de múltiplas lojas)
- 🔐 Controle de permissões e liberação de módulos por cliente
- 🤖 Assistentes de IA para análise de produtos e diagnóstico de OS

**Diferenciais vs Concorrentes:**

**vs Bling:**
- ✅ Controle individual de IMEI (Bling não tem)
- ✅ Sistema de OS integrado com IA (Bling não tem)
- ✅ Multi-tenant nativo (Bling cobra extra)
- ✅ Preço mais competitivo

**vs Tiny ERP:**
- ✅ Interface mais moderna e intuitiva
- ✅ BI em tempo real (Tiny tem relatórios básicos)
- ✅ Assistentes de IA integrados (Tiny não tem)
- ✅ Sistema de comissões automático

**vs Omie:**
- ✅ Especialização em lojas de celular (Omie é genérico)
- ✅ Controle de IMEI individual
- ✅ Sistema de OS completo
- ✅ Preço até 40% mais baixo

**vs Conta Azul:**
- ✅ Gestão completa (Conta Azul é só financeiro)
- ✅ PDV integrado (Conta Azul não tem)
- ✅ Controle de estoque por IMEI
- ✅ Sistema de OS

**Preços:**
- Teste grátis por 14 dias
- Planos a partir de R$ 97/mês
- Sem taxa de setup
- Cancelamento quando quiser

**Tom de conversa:**
- Seja amigável, consultivo e entusiasmado
- Use emojis moderadamente
- Faça perguntas para entender a necessidade
- Destaque ROI e economia de tempo
- Crie senso de urgência (teste grátis, promoção)
- Seja honesto sobre limitações, mas sempre mostre soluções

Responda de forma objetiva (máximo 3-4 parágrafos), use markdown para formatação e sempre termine incentivando o próximo passo (teste grátis, agendar demo, etc).`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.message },
          ],
        });

        const assistantMessage = response.choices[0]?.message?.content || "Desculpe, não consegui processar sua mensagem. Pode tentar novamente?";

        return {
          response: assistantMessage,
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

    emit: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) throw new Error("NF-e não encontrada");
        
        if (invoice.status === "emitida") {
          throw new Error("NF-e já foi emitida");
        }
        
        const items = await db.getInvoiceItems(input.id);
        const nfeData = { ...invoice, items };
        
        // Gerar XML
        const { generateNFeXML } = await import("./nfe-xml");
        const xml = generateNFeXML(nfeData);
        
        // Salvar XML no S3
        const { storagePut } = await import("./storage");
        const filename = `nfe/NFe_${String(invoice.number).padStart(9, "0")}_serie_${invoice.series}_${Date.now()}.xml`;
        const { url: xmlUrl } = await storagePut(
          filename,
          xml,
          "application/xml"
        );
        
        // Gerar chave de acesso (simplificado - em produção viria da SEFAZ)
        const accessKey = `${invoice.emitterState || "52"}${new Date().toISOString().slice(2, 7).replace("-", "")}${invoice.emitterCnpj.replace(/\D/g, "").padStart(14, "0")}55${String(invoice.series).padStart(3, "0")}${String(invoice.number).padStart(9, "0")}${Math.random().toString().slice(2, 11)}`;
        
        // Atualizar status para emitida
        await db.updateInvoiceStatus(input.id, "emitida", {
          accessKey,
          xmlUrl,
          authorizationDate: new Date(),
          protocol: `PROT${Date.now()}`,
        });
        
        return {
          success: true,
          accessKey,
          xmlUrl,
          number: invoice.number,
          series: invoice.series,
        };
       }),
  }),

  // ============= IA ASSISTENTE =============
  ai: router({
    // Analisar produto com IA
    analyzeProduct: protectedProcedure
      .input(z.object({
        productName: z.string().min(1, "Nome do produto é obrigatório"),
      }))
      .mutation(async ({ input }) => {
        const result = await analyzeProductWithAI(input.productName);
        return result;
      }),

    // Diagnosticar OS com IA
    diagnoseServiceOrder: protectedProcedure
      .input(z.object({
        problem: z.string().min(5, "Descreva o problema com mais detalhes"),
        deviceInfo: z.string().optional(),
        imageUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await diagnoseServiceOrder(input.problem, input.deviceInfo, input.imageUrl);
        return result;
      }),
  }),

  // Labels (Etiquetas)
  labels: router({
    // Gerar etiqueta completa
    generate: protectedProcedure
      .input(z.object({
        productName: z.string(),
        price: z.number(),
        sku: z.string(),
        brand: z.string().optional(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const label = await generateLabel(input);
        return label;
      }),

    // Gerar apenas código de barras
    generateBarcode: protectedProcedure
      .input(z.object({
        text: z.string(),
        type: z.enum(['code128', 'ean13']).optional(),
      }))
      .mutation(async ({ input }) => {
        const barcode = await generateBarcode(input.text, input.type);
        return { barcode };
      }),

    // Gerar apenas QR code
    generateQRCode: protectedProcedure
      .input(z.object({
        data: z.string(),
      }))
      .mutation(async ({ input }) => {
        const qrcode = await generateQRCode(input.data);
        return { qrcode };
      }),
  }),

  // ============= PLANOS E ASSINATURAS (MULTI-TENANT) =============
  plans: router({
    // Listar todos os planos ativos
    list: publicProcedure.query(async () => {
      const { getPlans } = await import("./db-plans");
      const allPlans = await getPlans();
      return allPlans;
    }),

    // Criar checkout do Stripe
    createCheckout: protectedProcedure
      .input(z.object({
        planSlug: z.string(),
        billingPeriod: z.enum(["monthly", "yearly"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createCheckoutSession } = await import("./stripe-integration");
        
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        
        const session = await createCheckoutSession({
          planSlug: input.planSlug,
          billingPeriod: input.billingPeriod,
          customerEmail: ctx.user.email,
          customerName: ctx.user.name,
          userId: ctx.user.id,
          successUrl: `${origin}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/planos`,
        });

        return {
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      }),

    // Obter assinatura atual do usuário
    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      // TODO: Implementar lógica de buscar assinatura do tenant do usuário
      return null;
    }),
  }),

  // ============= TENANT SWITCHING (MANUTENÇÃO REMOTA) =============
  tenantSwitching: tenantSwitchingRouter,
  
  // ============= TENANT MANAGEMENT (GERENCIAMENTO DE CLIENTES) =============
  tenantManagement: tenantManagementRouter,

  // ============= ANALYTICS DO CHATBOT =============
  chatAnalytics: router({
    // Iniciar nova conversa
    startConversation: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        userId: z.number().optional(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const conversationId = await db.createChatbotConversation({
          sessionId: input.sessionId,
          userId: input.userId,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        });
        return { conversationId };
      }),

    // Registrar mensagem
    trackMessage: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        responseTime: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Buscar conversationId pelo sessionId
        const messageId = await db.createChatbotMessage({
          conversationId: 0, // Será atualizado via sessionId
          role: input.role,
          content: input.content,
          responseTime: input.responseTime,
        });

        // Atualizar contador de mensagens
        await db.updateChatbotConversation(input.sessionId, {
          messageCount: sql`message_count + 1` as any,
        });

        return { messageId };
      }),

    // Registrar evento (conversão, clique em CTA)
    trackEvent: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        eventType: z.string(),
        eventData: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const eventId = await db.createChatbotEvent({
          conversationId: 0, // Será atualizado via sessionId
          eventType: input.eventType,
          eventData: input.eventData,
        });

        // Se for conversão, atualizar flag
        if (input.eventType.startsWith("conversion_")) {
          await db.updateChatbotConversation(input.sessionId, {
            converted: true,
            conversionType: input.eventType.replace("conversion_", ""),
          });
        }

        return { eventId };
      }),

    // Finalizar conversa
    endConversation: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        duration: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateChatbotConversation(input.sessionId, {
          endedAt: new Date(),
          duration: input.duration,
        });
        return { success: true };
      }),

    // Obter métricas gerais
    getMetrics: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const metrics = await db.getChatbotMetrics(input.startDate, input.endDate);
        const avgResponseTime = await db.getAverageResponseTime();
        return { ...metrics, avgResponseTime };
      }),

    // Obter perguntas mais frequentes
    getFrequentQuestions: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ input }) => {
        return await db.getFrequentQuestions(input.limit);
      }),

    // Obter conversas por data
    getConversationsByDate: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(30),
      }))
      .query(async ({ input }) => {
        return await db.getChatbotConversationsByDate(input.days);
      }),

    // Obter conversões por tipo
    getConversionsByType: protectedProcedure
      .query(async () => {
        return await db.getConversionsByType();
      }),
  }),

  // ============= SISTEMA DE CHAMADOS/TICKETS DE SUPORTE =============
  supportTickets: router({
    // Analisar ticket com IA antes de criar
    analyzeWithAI: protectedProcedure
      .input(z.object({
        subject: z.string().min(5),
        description: z.string().min(20),
      }))
      .mutation(async ({ input }) => {
        const analysis = await analyzeTicketWithAI(input.subject, input.description);
        return analysis;
      }),

    // Criar novo ticket (qualquer usuário autenticado)
    create: protectedProcedure
      .input(z.object({
        subject: z.string().min(5, "Assunto deve ter pelo menos 5 caracteres"),
        category: z.enum(["duvida", "problema_tecnico", "solicitacao_recurso", "bug"]),
        priority: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
        description: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const ticketId = await db.createSupportTicket({
          userId: ctx.user.id,
          tenantId: null, // Pode ser preenchido se houver contexto de tenant
          subject: input.subject,
          category: input.category,
          priority: input.priority,
          description: input.description,
        });
        
        // Notificar owner sobre novo chamado
        const categoryLabels: Record<string, string> = {
          duvida: "Dúvida",
          problema_tecnico: "Problema Técnico",
          solicitacao_recurso: "Solicitação de Recurso",
          bug: "Bug"
        };
        
        await notifyOwner({
          title: `Novo Chamado #${ticketId}: ${input.subject}`,
          content: `**Usuário:** ${ctx.user.name} (${ctx.user.email})\n**Categoria:** ${categoryLabels[input.category]}\n**Prioridade:** ${input.priority.toUpperCase()}\n\n**Descrição:**\n${input.description}`
        }).catch((err: any) => console.error("Erro ao notificar owner:", err));
        
        return { ticketId };
      }),

    // Listar tickets do usuário
    myTickets: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.listSupportTicketsByUser(ctx.user.id);
      }),

    // Listar todos os tickets (apenas master_admin)
    listAll: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        category: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return await db.listAllSupportTickets(input);
      }),

    // Obter detalhes de um ticket
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.id);
        
        // Verificar permissão: usuário pode ver apenas seus próprios tickets, admin vê todos
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin" && ticket.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        return ticket;
      }),

    // Obter mensagens de um ticket
    getMessages: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.ticketId);
        
         // Verificar permissão
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin" && ticket.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        return await db.getSupportTicketMessages(input.ticketId);
      }),

    // Adicionar mensagem a um ticket
    addMessage: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string().min(1, "Mensagem não pode estar vazia"),
        isInternal: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.ticketId);
        
        // Verificar permissão
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin" && ticket.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        // Apenas admins podem criar mensagens internas
        if (input.isInternal && ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar mensagens internas" });
        }
        
        const messageId = await db.createSupportTicketMessage({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isInternal: input.isInternal,
        });
        
        return { messageId };
      }),

    // Atualizar status do ticket (apenas admin)
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["aberto", "em_andamento", "resolvido", "fechado"]),
        assignedTo: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        await db.updateSupportTicketStatus(input.id, input.status, input.assignedTo);
        return { success: true };
      }),

    // Obter estatísticas (apenas admin)
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        return await db.getSupportTicketStats();
      }),
  }),

  // ============= BACKUP DO SISTEMA =============
  backup: router({
    list: protectedProcedure
      .input(z.object({}).optional())
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "master_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        // Mock data - implementar com S3 futuramente
        return [];
      }),

    runNow: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "master_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        // Mock - implementar backup real futuramente
        return { success: true, message: "Backup agendado com sucesso" };
      }),
  }),

  // ============= CNPJ LOOKUP =============
  cnpj: router({
    lookup: publicProcedure
      .input(z.object({
        cnpj: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { lookupCNPJ } = await import('./cnpj-lookup');
        try {
          const data = await lookupCNPJ(input.cnpj);
          return { success: true, data };
        } catch (error) {
          if (error instanceof Error) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao consultar CNPJ" });
        }
      }),
  }),

  // ============= TENANT (ONBOARDING) =============
  tenant: router({
    // Criar tenant + usuário (sem autenticação - pós onboarding)
    createWithUser: publicProcedure
      .input(z.object({
        tenantData: z.object({
          cnpj: z.string(),
          razaoSocial: z.string(),
          nomeFantasia: z.string(),
          cep: z.string(),
          logradouro: z.string(),
          numero: z.string(),
          complemento: z.string().optional(),
          bairro: z.string(),
          cidade: z.string(),
          estado: z.string(),
          telefone: z.string(),
          email: z.string().email(),
          whatsapp: z.string().optional(),
          planSlug: z.string(),
        }),
        userData: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      }))
      .mutation(async ({ input }) => {
        const { tenantData, userData } = input;
        const db = await getDb();
        
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados não disponível",
          });
        }

        // Buscar plano pelo slug
        const plansResult = await db.select().from(plans).where(eq(plans.slug, tenantData.planSlug)).limit(1);
        const plan = plansResult[0];

        if (!plan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plano não encontrado",
          });
        }

        // Verificar se email já existe
        const existingUser = await getUserByEmail(userData.email);

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email já cadastrado",
          });
        }

        // Criar tenant
        const subdomain = tenantData.nomeFantasia
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 63);

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 dias de trial

        const [newTenant] = await db.insert(tenants).values({
          name: tenantData.nomeFantasia,
          subdomain,
          planId: plan.id,
          status: "trial",
          trialEndsAt,
        });

        // Criar usuário
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const [newUser] = await db.insert(users).values({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          tenantId: newTenant.insertId,
          role: "admin", // Primeiro usuário é admin
        });

        console.log("[Tenant] Criado:", {
          tenantId: newTenant.insertId,
          userId: newUser.insertId,
          nomeFantasia: tenantData.nomeFantasia,
          email: userData.email,
        });

        return {
          success: true,
          tenantId: newTenant.insertId,
          userId: newUser.insertId,
        };
      }),

    completeOnboarding: protectedProcedure
      .input(z.object({
        cnpj: z.string(),
        razaoSocial: z.string(),
        nomeFantasia: z.string(),
        cep: z.string(),
        logradouro: z.string(),
        numero: z.string(),
        complemento: z.string().optional(),
        bairro: z.string(),
        cidade: z.string(),
        estado: z.string(),
        telefone: z.string(),
        email: z.string().email(),
        whatsapp: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Por enquanto, apenas retornar sucesso
        // TODO: Implementar persistência dos dados do tenant no banco
        
        console.log("[Onboarding] Dados recebidos:", {
          userId: ctx.user.id,
          nomeFantasia: input.nomeFantasia,
          cnpj: input.cnpj,
        });

        return { success: true, message: "Onboarding concluído com sucesso!" };
      }),
  }),
});
export type AppRouter = typeof appRouter;
