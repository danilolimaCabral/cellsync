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
  // Permissão total para o email mestre
  if (ctx.user.email === "cellsync.hub@gmail.com") {
    return next({ ctx });
  }

  // Verifica roles de admin
  if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  aiAssistant: aiAssistantRouter,

  // Endpoint temporário para diagnóstico de tenants
  listTenants: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { error: "Database not connected" };
    
    const allTenants = await db.select({
      id: tenants.id,
      name: tenants.name,
      subdomain: tenants.subdomain,
      cnpj: tenants.cnpj,
      status: tenants.status
    }).from(tenants);
    
    return allTenants;
  }),
  
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
    // Dashboard executivo para usuário master
    executive: adminProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) {
        return {
          salesMetrics: {},
          topProducts: [],
          topSellers: [],
          vipCustomers: [],
          kpis: {},
        };
      }

      const { sales, products, customers, users, salesItems } = await import("../drizzle/schema");
      const { sql, desc, eq } = await import("drizzle-orm");

      try {
        // Métricas de vendas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        // Vendas do mês atual
        const currentMonthSalesResult = await database
          .select({
            count: sql<number>`COUNT(*)`,
            total: sql<number>`SUM(${sales.finalAmount})`,
          })
          .from(sales)
          .where(sql`${sales.createdAt} >= ${firstDayOfMonth}`);

        const currentMonthSales = Number(currentMonthSalesResult[0]?.count) || 0;
        const currentMonthRevenue = Number(currentMonthSalesResult[0]?.total) || 0;

        // Vendas do mês anterior
        const lastMonthSalesResult = await database
          .select({
            count: sql<number>`COUNT(*)`,
            total: sql<number>`SUM(${sales.finalAmount})`,
          })
          .from(sales)
          .where(
            sql`${sales.createdAt} >= ${firstDayOfLastMonth} AND ${sales.createdAt} <= ${lastDayOfLastMonth}`
          );

        const lastMonthSales = Number(lastMonthSalesResult[0]?.count) || 0;
        const lastMonthRevenue = Number(lastMonthSalesResult[0]?.total) || 0;

        // Calcular crescimento
        const salesGrowth = lastMonthSales > 0
          ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100
          : 0;
        const revenueGrowth = lastMonthRevenue > 0
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

        // Ticket médio
        const averageTicket = currentMonthSales > 0
          ? currentMonthRevenue / currentMonthSales
          : 0;

        // Top 10 produtos mais vendidos
        const topProductsResult = await database
          .select({
            productId: salesItems.productId,
            productName: products.name,
            quantity: sql<number>`SUM(${salesItems.quantity})`,
            revenue: sql<number>`SUM(${salesItems.subtotal})`,
          })
          .from(salesItems)
          .innerJoin(products, eq(salesItems.productId, products.id))
          .innerJoin(sales, eq(salesItems.saleId, sales.id))
          .where(sql`${sales.createdAt} >= ${firstDayOfMonth}`)
          .groupBy(salesItems.productId, products.name)
          .orderBy(desc(sql`SUM(${salesItems.quantity})`));

        const topProducts = topProductsResult.slice(0, 10).map((p) => ({
          id: p.productId,
          name: p.productName,
          quantity: Number(p.quantity),
          revenue: Number(p.revenue),
        }));

        // Top vendedores
        const topSellersResult = await database
          .select({
            sellerId: sales.sellerId,
            sellerName: users.name,
            salesCount: sql<number>`COUNT(*)`,
            revenue: sql<number>`SUM(${sales.finalAmount})`,
          })
          .from(sales)
          .innerJoin(users, eq(sales.sellerId, users.id))
          .where(sql`${sales.createdAt} >= ${firstDayOfMonth}`)
          .groupBy(sales.sellerId, users.name)
          .orderBy(desc(sql`SUM(${sales.finalAmount})`));

        const topSellers = topSellersResult.slice(0, 10).map((s) => ({
          id: s.sellerId,
          name: s.sellerName,
          salesCount: Number(s.salesCount),
          revenue: Number(s.revenue),
        }));

        // Clientes VIP (top 10 por valor de compra)
        const vipCustomersResult = await database
          .select({
            customerId: sales.customerId,
            customerName: customers.name,
            purchaseCount: sql<number>`COUNT(*)`,
            totalSpent: sql<number>`SUM(${sales.finalAmount})`,
          })
          .from(sales)
          .innerJoin(customers, eq(sales.customerId, customers.id))
          .groupBy(sales.customerId, customers.name)
          .orderBy(desc(sql`SUM(${sales.finalAmount})`));

        const vipCustomers = vipCustomersResult.slice(0, 10).map((c) => ({
          id: c.customerId,
          name: c.customerName,
          purchaseCount: Number(c.purchaseCount),
          totalSpent: Number(c.totalSpent),
        }));

        return {
          salesMetrics: {
            currentMonth: {
              sales: currentMonthSales,
              revenue: currentMonthRevenue,
            },
            lastMonth: {
              sales: lastMonthSales,
              revenue: lastMonthRevenue,
            },
            growth: {
              sales: salesGrowth,
              revenue: revenueGrowth,
            },
            averageTicket,
          },
          topProducts,
          topSellers,
          vipCustomers,
          kpis: {
            salesGrowth,
            revenueGrowth,
            averageTicket,
          },
        };
      } catch (error) {
        console.error("[Dashboard Executive] Error fetching data:", error);
        return {
          salesMetrics: {},
          topProducts: [],
          topSellers: [],
          vipCustomers: [],
          kpis: {},
        };
      }
    }),

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
      .query(async ({ input, ctx }) => {
        const customers = await db.listCustomers({
          ...(input || {}),
          tenantId: ctx.user.tenantId,
        });
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
      .mutation(async ({ input, ctx }) => {
        try {
          console.log('[Customers] Criando cliente:', input.name);
          const result = await db.createCustomer({
            ...input,
            tenantId: ctx.user.tenantId,
          });
          console.log('[Customers] Cliente criado com sucesso:', result);
          
          // Criar notificação para o usuário
          const notificationsModule = await import("./notifications");
          await notificationsModule.createNotification({
            userId: ctx.user.id,
            type: "info",
            title: "Cliente cadastrado",
            message: `Cliente "${input.name}" foi cadastrado com sucesso!`,
          }).catch((err: any) => console.error('[Customers] Erro ao criar notificação:', err));
          
          return { success: true, customer: result };
        } catch (error) {
          console.error('[Customers] Erro ao criar cliente:', error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Erro ao cadastrar cliente. Por favor, tente novamente." 
          });
        }
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
      .query(async ({ input, ctx }) => {
        const products = await db.listProducts({
          ...(input || {}),
          tenantId: ctx.user.tenantId,
        });
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
          tenantId: ctx.user.tenantId,
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
        const { chatbotConversations, chatbotMessages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Gerar ou recuperar ID da sessão (simples, baseado no cookie ou input)
        // Como o input não tem sessionId, vamos assumir uma sessão nova a cada reload por enquanto
        // Idealmente o frontend deveria mandar um sessionId
        
        const systemPrompt = `Você é a **Ana**, a Assistente Virtual Inteligente da **CellSync**.
Sua função é ser uma especialista completa no sistema, atuando tanto como **Consultora de Vendas** quanto como **Suporte Técnico Avançado**.

**SUA PERSONALIDADE:**
- Nome: Ana
- Tom: Profissional, amigável, paciente e resolutiva.
- Estilo: Use emojis moderadamente para suavizar a conversa (👋, 🚀, ✅, 💡).
- Formatação: Use Markdown (negrito, listas) para facilitar a leitura.

**SEUS OBJETIVOS:**
1. **Suporte Técnico:** Explicar COMO usar o sistema passo-a-passo.
2. **Vendas:** Apresentar benefícios e diferenciais quando o usuário for um visitante.
3. **Resolução:** Diagnosticar dúvidas e oferecer soluções diretas.

---

**CONHECIMENTO DO SISTEMA (MANUAL RÁPIDO):**

**1. Vendas e PDV:**
- Para vender: Acesse o menu "Vendas" > "Nova Venda" ou use o PDV.
- Fluxo: Selecione o cliente -> Adicione produtos (bipando ou buscando) -> Escolha pagamento -> Finalize.
- Cupom Fiscal: É emitido automaticamente ao finalizar se configurado, ou clique em "Emitir NFC-e".

**2. Estoque e Produtos:**
- Cadastro: Menu "Estoque" > "Novo Produto".
- IMEI: Para celulares, marque "Controlar por IMEI". Cada unidade terá um serial único.
- Importação: Use o "Assistente de Importação" para trazer dados de XML ou Excel.

**3. Notas Fiscais (NF-e):**
- Emissão: Menu "Notas Fiscais" > "Emitir NF-e".
- Requisitos: Certificado A1 configurado em "Configurações" > "Certificado".
- Automático: O sistema calcula impostos (ICMS, IPI, PIS/COFINS) baseado no NCM do produto.

**4. Financeiro:**
- Contas: Menu "Financeiro". Registre contas a pagar e receber.
- Fluxo de Caixa: Visualização diária/mensal das entradas e saídas.
- Comissões: Calculadas automaticamente no fechamento da venda (configurável por vendedor).

**5. Ordens de Serviço (OS):**
- Abertura: Menu "Ordens de Serviço" > "Nova OS".
- Diagnóstico IA: Use o botão "Diagnóstico IA" para sugerir defeitos e peças baseado no relato do cliente.
- Status: Acompanhe (Aberto -> Em Análise -> Aguardando Peça -> Pronto -> Entregue).

**6. Configurações:**
- Usuários: Menu "Configurações" > "Usuários" (crie vendedores, técnicos, gerentes).
- Permissões: O "Master Admin" tem acesso total.

---

**DIFERENCIAIS (PARA VENDAS):**
- **vs Bling/Tiny:** Temos controle nativo de IMEI e OS (eles não têm ou é adaptação).
- **vs Omie/Conta Azul:** Somos especialistas em celulares, não um ERP genérico.
- **Preço:** Planos a partir de R$ 97/mês com teste grátis de 14 dias.

**INSTRUÇÕES DE RESPOSTA:**
- Se o usuário perguntar "Como faço X?", dê o passo-a-passo numerado.
- Se o usuário relatar erro, peça detalhes ou sugira verificar conexão/permissões.
- Se for sobre preços/planos, venda o valor do sistema.
- Seja concisa. Máximo 3 parágrafos, exceto para tutoriais passo-a-passo.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.message },
            ],
          });

          const assistantMessage = response.choices[0]?.message?.content || "Desculpe, não consegui processar sua mensagem. Pode tentar novamente?";

          // --- SALVAR NO BANCO DE DADOS PARA ANALYTICS ---
          try {
            const database = await db.getDb();
            if (database) {
              // 1. Tentar encontrar uma sessão ativa recente (últimos 30 min) para este usuário
              // Como não temos sessionId vindo do front, vamos criar uma nova conversa sempre por segurança
              // TODO: Frontend deve enviar sessionId para agrupar mensagens
              
              const sessionId = ctx.user ? `user-${ctx.user.id}-${Date.now()}` : `anon-${Date.now()}`;
              
              // Criar nova conversa
              const [conversationResult] = await database.insert(chatbotConversations).values({
                tenantId: ctx.user?.tenantId || 1, // Default to 1 for anonymous
                sessionId: sessionId,
                userId: ctx.user?.id || null,
                startedAt: new Date(),
                messageCount: 2, // 1 user + 1 assistant
                userAgent: ctx.req.headers["user-agent"] || "unknown",
              });
              
              const conversationId = conversationResult.insertId;

              // Salvar mensagem do usuário
              await database.insert(chatbotMessages).values({
                conversationId: conversationId,
                role: "user",
                content: input.message,
                createdAt: new Date(),
              });

              // Salvar resposta da Ana
              await database.insert(chatbotMessages).values({
                conversationId: conversationId,
                role: "assistant",
                content: assistantMessage,
                createdAt: new Date(),
              });
            }
          } catch (dbError) {
            console.error("Erro ao salvar analytics do chatbot:", dbError);
            // Não falhar a resposta se o analytics falhar
          }
          // ------------------------------------------------

          return {
            response: assistantMessage,
          };
        } catch (error: any) {
          console.error("Erro no chatbot:", error);
          return {
            response: `[ERRO GOOGLE] ${error.message || JSON.stringify(error)}`,
          };
        }
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
      .mutation(async ({ input }) => {
        const { userId, ...data } = input;
        await db.updateUser(userId, data);
        return { success: true };
      }),

    create: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        role: z.enum(["admin", "vendedor", "tecnico", "gerente"]).default("vendedor"),
      }))
      .mutation(async ({ input, ctx }) => {
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

        // Criar usuário vinculado ao tenant do usuário atual
        await db.createUser({
          tenantId: ctx.user.tenantId,
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: input.role,
          active: true,
        });

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

    importXml: protectedProcedure
      .input(z.object({
        xmlContent: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { parseNFeXML } = await import("./nfe-xml");
        
        try {
          // Parsear o XML
          const nfeData = parseNFeXML(input.xmlContent);
          
          // Verificar se já existe nota com este número e série
          const existingInvoice = await db.getInvoiceByNumberAndSeries(
            parseInt(nfeData.number),
            parseInt(nfeData.series)
          );
          
          if (existingInvoice) {
            throw new Error(`Nota fiscal ${nfeData.number} série ${nfeData.series} já existe no sistema.`);
          }
          
          // Criar a NF-e no banco
          const invoiceId = await db.createInvoice({
            series: parseInt(nfeData.series),
            model: nfeData.model,
            type: "entrada", // Assumindo entrada ao importar, mas poderia ser saída dependendo do emitente
            emitterCnpj: nfeData.emitter.cnpj,
            emitterName: nfeData.emitter.name,
            emitterFantasyName: nfeData.emitter.fantasyName,
            emitterAddress: nfeData.emitter.address,
            emitterCity: nfeData.emitter.city,
            emitterState: nfeData.emitter.state,
            emitterZipCode: nfeData.emitter.zipCode,
            emitterIE: nfeData.emitter.ie,
            recipientDocument: nfeData.recipient.document,
            recipientName: nfeData.recipient.name,
            recipientAddress: nfeData.recipient.address,
            recipientCity: nfeData.recipient.city,
            recipientState: nfeData.recipient.state,
            recipientZipCode: nfeData.recipient.zipCode,
            recipientPhone: nfeData.recipient.phone,
            recipientEmail: nfeData.recipient.email,
            cfop: nfeData.items[0]?.cfop || "5102", // Pega do primeiro item ou padrão
            natureOperation: nfeData.natureOperation,
            paymentMethod: "outros", // Simplificação, ideal seria mapear do XML
            paymentIndicator: "outros",
            totalProducts: nfeData.totals.products,
            totalDiscount: nfeData.totals.discount,
            totalFreight: nfeData.totals.freight,
            totalInvoice: nfeData.totals.invoice,
            additionalInfo: nfeData.additionalInfo,
            number: parseInt(nfeData.number),
            status: "emitida", // Já vem emitida do XML
            accessKey: nfeData.accessKey,
            protocol: nfeData.protocol,
            authorizationDate: nfeData.authorizationDate ? new Date(nfeData.authorizationDate) : new Date(),
            issuedBy: ctx.user.id,
          });
          
          // Criar os itens
          for (const item of nfeData.items) {
            await db.createInvoiceItem({
              invoiceId,
              code: item.code,
              ean: item.ean,
              description: item.description,
              ncm: item.ncm,
              cfop: item.cfop,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              discount: item.discount,
              icmsOrigin: "0",
              icmsCst: "102",
              icmsBase: item.totalPrice,
              icmsRate: 0, // Simplificado
              icmsValue: 0,
              ipiCst: "99",
              ipiBase: item.totalPrice,
              ipiRate: 0,
              ipiValue: 0,
              pisCst: "99",
              pisBase: item.totalPrice,
              pisRate: 0,
              pisValue: 0,
              cofinsCst: "99",
              cofinsBase: item.totalPrice,
              cofinsRate: 0,
              cofinsValue: 0,
            });
          }
          
          return {
            success: true,
            invoiceId,
            number: nfeData.number,
            series: nfeData.series,
            accessKey: nfeData.accessKey,
            emitterName: nfeData.emitter.name,
            emitterCnpj: nfeData.emitter.cnpj,
            totalValue: nfeData.totals.invoice,
            issueDate: nfeData.issueDate
          };
        } catch (error: any) {
          console.error("Erro ao importar XML:", error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "Erro ao processar o arquivo XML"
          });
        }
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

    // Criar checkout do Stripe (PÚBLICO - sem autenticação)
    createCheckout: publicProcedure
      .input(z.object({
        planSlug: z.string(),
        billingPeriod: z.enum(["monthly", "yearly"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createCheckoutSession } = await import("./stripe-integration");
        
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        
        // Se usuário está logado, usar seus dados
        const customerEmail = ctx.user?.email || undefined;
        const customerName = ctx.user?.name || undefined;
        const userId = ctx.user?.id || undefined;
        
        const session = await createCheckoutSession({
          planSlug: input.planSlug,
          billingPeriod: input.billingPeriod,
          customerEmail,
          customerName,
          userId,
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
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao conectar ao banco" });
      }

      const { tenants } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Buscar tenant do usuário
      const [tenant] = await database
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.user.tenantId))
        .limit(1);

      if (!tenant) {
        return null;
      }

      // Buscar plano
      const { getPlanById } = await import("./db-plans");
      const plan = await getPlanById(tenant.planId);

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          status: tenant.status,
          trialEndsAt: tenant.trialEndsAt,
          stripeCustomerId: tenant.stripeCustomerId,
          stripeSubscriptionId: tenant.stripeSubscriptionId,
        },
        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
              description: plan.description,
              priceMonthly: plan.priceMonthly,
              priceYearly: plan.priceYearly,
              maxUsers: plan.maxUsers,
              maxProducts: plan.maxProducts,
              features: plan.features as string[],
            }
          : null,
      };
    }),

    // Criar portal de gerenciamento de assinatura
    createBillingPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao conectar ao banco" });
      }

      const { tenants } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Buscar tenant do usuário
      const [tenant] = await database
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.user.tenantId))
        .limit(1);

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado" });
      }

      if (!tenant.stripeCustomerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma assinatura ativa encontrada" });
      }

      // Criar sessão do portal
      const { createCustomerPortalSession } = await import("./stripe-integration");
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      
      const session = await createCustomerPortalSession({
        stripeCustomerId: tenant.stripeCustomerId,
        returnUrl: `${origin}/assinatura`,
      });

      return {
        portalUrl: session.url,
      };
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
        description: z.string().min(10),
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
        description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
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
          cnpj: z.string().optional(),
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

        // Limpar CNPJ (apenas números)
        const cleanCnpj = tenantData.cnpj ? tenantData.cnpj.replace(/\D/g, "").substring(0, 14) : null;

        // Verificar se email ou CNPJ já existem e limpar dados antigos (solicitação do usuário)
        const existingUser = await getUserByEmail(userData.email);
        if (existingUser) {
          console.log("[Tenant] Email já existe, removendo usuário antigo:", userData.email);
          await db.delete(users).where(eq(users.id, existingUser.id));
          // Se o usuário era dono de um tenant, deveríamos limpar o tenant também, mas por segurança vamos focar no email/cnpj
        }

        if (cleanCnpj) {
          const existingTenant = await db.select().from(tenants).where(eq(tenants.cnpj, cleanCnpj)).limit(1);
          if (existingTenant.length > 0) {
             console.log("[Tenant] CNPJ já existe, removendo tenant antigo:", cleanCnpj);
             // Remover usuários desse tenant primeiro para evitar erro de FK
             await db.delete(users).where(eq(users.tenantId, existingTenant[0].id));
             await db.delete(tenants).where(eq(tenants.id, existingTenant[0].id));
          }
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
          cnpj: cleanCnpj,
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
  
  // ============= TENANTS (MULTI-LOJA) =============
  tenants: router({
    // Criar tenant após pagamento bem-sucedido no Stripe
    createFromCheckout: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        storeName: z.string().min(3),
        cnpj: z.string().length(14), // Apenas números
        ownerName: z.string().min(3),
        stripeSessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao conectar ao banco" });
        }
        
        // 1. Verificar se email já existe
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Email já cadastrado" });
        }
        
        // 2. Verificar se CNPJ já existe (usando Drizzle)
        const existingTenant = await database
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.cnpj, input.cnpj))
          .limit(1);
        
        if (existingTenant.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CNPJ já cadastrado" });
        }
        
        // 3. Criar tenant (usando Drizzle)
        const [newTenant] = await database.insert(tenants).values({
          name: input.storeName,
          subdomain: `loja-${Date.now()}`, // Gerar subdomain único
          cnpj: input.cnpj,
          planId: 1, // Plano básico por padrão
          status: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        });
        
        const tenantId = newTenant.insertId;
        if (!tenantId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar loja" });
        }
        
        // 4. Criar usuário admin (usando Drizzle)
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const [newUser] = await database.insert(users).values({
          tenantId: Number(tenantId),
          name: input.ownerName,
          email: input.email,
          password: hashedPassword,
          role: "admin",
          active: true,
        });
        
        const userId = newUser.insertId;
        if (!userId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });
        }
        
        // 5. Salvar session_id para vincular com webhook (usando Drizzle)
        const { stripePendingSessions } = await import("../drizzle/schema");
        await database.insert(stripePendingSessions).values({
          sessionId: input.stripeSessionId,
          tenantId: Number(tenantId),
          userId: Number(userId),
          processed: false,
        });
        
        console.log("[Tenant] Criado com sucesso:", {
          tenantId,
          userId,
          email: input.email,
          storeName: input.storeName,
        });
        
        return {
          success: true,
          message: "Conta criada com sucesso! Faça login para acessar.",
          tenantId: Number(tenantId),
          userId: Number(userId),
        };
      }),
  }),
});
export type AppRouter = typeof appRouter;
