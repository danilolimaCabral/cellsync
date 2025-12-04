import { eq, and, or, gte, lte, gt, isNull, desc, sql, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  InsertUser, User, users,
  customers, sales,
  commissionRules, commissions,
  invoices, invoiceItems,
  chatbotConversations,
  chatbotMessages,
  chatbotEvents,
  supportTickets,
  supportTicketMessages,
  type InsertCommissionRule, type InsertCommission,
  type InsertInvoice, type InsertInvoiceItem,
  type InsertChatbotConversation,
  type InsertChatbotMessage,
  type InsertChatbotEvent,
  type InsertSupportTicket,
  type InsertSupportTicketMessage
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connection = await mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        family: 4, // Forçar IPv4 para evitar ECONNREFUSED em alguns ambientes
      });
      _db = drizzle(connection, { mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function createUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    return;
  }

  try {
    await db.insert(users).values(user);
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignIn(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  try {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
  } catch (error) {
    console.error("[Database] Failed to update user last sign in:", error);
    throw error;
  }
}

export async function changeUserPassword(userId: number, newPasswordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot change password: database not available");
    throw new Error("Database not available");
  }

  try {
    await db.update(users).set({ password: newPasswordHash }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to change password:", error);
    throw error;
  }
}

// Funções de compatibilidade com OAuth (não utilizadas no sistema local)
export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  // Função mantida para compatibilidade com sdk.ts
  // Retorna undefined pois não usamos openId no sistema local
  return undefined;
}

export async function upsertUser(user: any) {
  // Função mantida para compatibilidade com sdk.ts
  // Não faz nada pois não usamos OAuth no sistema local
  // Aceita any para evitar conflitos de tipo com o SDK
  return;
}

// TODO: add feature queries here as your schema grows.

// ============= PRODUTOS =============
export async function listProducts(filters: {
  search?: string;
  category?: string;
  lowStock?: boolean;
  limit?: number;
  offset?: number;
  tenantId?: number;
}) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { products, stockItems } = await import("../drizzle/schema");
    
    // Se houver busca, tentar por IMEI primeiro
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      
      // Buscar por IMEI exato ou parcial
      const imeiResults = await database
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          category: products.category,
          brand: products.brand,
          model: products.model,
          sku: products.sku,
          barcode: products.barcode,
          costPrice: products.costPrice,
          salePrice: products.salePrice,
          minStock: products.minStock,
          currentStock: products.currentStock,
          requiresImei: products.requiresImei,
          active: products.active,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          imei: stockItems.imei,
        })
        .from(stockItems)
        .leftJoin(products, eq(stockItems.productId, products.id))
        .where(
          and(
            filters.tenantId ? eq(products.tenantId, filters.tenantId) : undefined,
            or(
              eq(stockItems.imei, searchTerm),
              like(stockItems.imei, `%${searchTerm}%`)
            )
          )
        )
        .limit(filters.limit || 50);
      
      // Se encontrou por IMEI, retornar esses resultados priorizados
      if (imeiResults.length > 0) {
        return imeiResults.map(p => ({
          ...p,
          price: p.salePrice,
          stockQuantity: 1,
        }));
      }
      
      // Se não encontrou por IMEI, buscar por nome/SKU
      const nameResults = await database
        .select()
        .from(products)
        .where(
          and(
            filters.tenantId ? eq(products.tenantId, filters.tenantId) : undefined,
            or(
              like(products.name, `%${searchTerm}%`),
              like(products.sku, `%${searchTerm}%`),
              like(products.barcode, `%${searchTerm}%`)
            )
          )
        )
        .limit(filters.limit || 50);
      
      return nameResults.map(p => ({
        ...p,
        price: p.salePrice,
        stockQuantity: 0,
      }));
    }
    
    // Sem busca, listar todos
    let query = database.select().from(products);
    
    if (filters.tenantId) {
      query.where(eq(products.tenantId, filters.tenantId));
    }
    
    const results = await query.limit(filters.limit || 50).offset(filters.offset || 0);
    return results.map(p => ({
      ...p,
      price: p.salePrice,
      stockQuantity: 0,
    }));
  } catch (error) {
    console.error("[Database] Failed to list products:", error);
    return [];
  }
}

export async function createProduct(data: {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  requiresImei: boolean;
  tenantId?: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { products } = await import("../drizzle/schema");
  const result = await database.insert(products).values(data);
  return result;
}

// ============= CLIENTES =============
export async function listCustomers(filters: {
  search?: string;
  segment?: string;
  limit?: number;
  offset?: number;
  tenantId?: number;
}) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { customers } = await import("../drizzle/schema");
    let query = database.select().from(customers);
    
    if (filters.tenantId) {
      query.where(eq(customers.tenantId, filters.tenantId));
    }
    
    const results = await query.limit(filters.limit || 50).offset(filters.offset || 0);
    return results;
  } catch (error) {
    console.error("[Database] Failed to list customers:", error);
    return [];
  }
}

export async function createCustomer(data: {
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  tenantId?: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { customers } = await import("../drizzle/schema");
  const result = await database.insert(customers).values(data);
  return result;
}

// ============= VENDAS =============
export async function createSale(data: {
  customerId: number;
  sellerId: number;
  totalAmount: number;
  discount: number;
  paymentMethod: string;
  saleType?: "retail" | "wholesale";
  appliedDiscount?: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
  tenantId?: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { sales, saleItems, products, stockMovements, accountsReceivable } = await import("../drizzle/schema");
  
  // Criar venda
  const finalAmount = data.totalAmount - data.discount;
  const [saleResult] = await database.insert(sales).values({
    tenantId: data.tenantId || 1,
    customerId: data.customerId,
    sellerId: data.sellerId,
    totalAmount: data.totalAmount,
    discountAmount: data.discount,
    finalAmount,
    paymentMethod: data.paymentMethod,
    status: "concluida",
    saleType: data.saleType || "retail",
    appliedDiscount: data.appliedDiscount || 0,
  });

  const saleId = Number(saleResult.insertId);

  // Criar itens da venda e baixar estoque
  for (const item of data.items) {
    const totalPrice = item.unitPrice * item.quantity;
    await database.insert(saleItems).values({
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: 0,
      totalPrice,
    });

    // Baixar estoque
    await database
      .update(products)
      .set({
        currentStock: sql`${products.currentStock} - ${item.quantity}`,
      })
      .where(eq(products.id, item.productId));

    // Registrar movimentação de estoque
    await database.insert(stockMovements).values({
      productId: item.productId,
      type: "saida",
      quantity: item.quantity,
      reason: "Venda",
      referenceType: "sale",
      referenceId: saleId,
      userId: data.sellerId,
    });
  }

  // Calcular e criar comissão
  const commissionData = await calculateCommission(saleId, data.sellerId, finalAmount);
  if (commissionData.totalCommission > 0) {
    for (const rule of commissionData.appliedRules) {
      await createCommission({
        userId: data.sellerId,
        saleId,
        amount: rule.amount,
        baseAmount: finalAmount,
        percentage: rule.percentage,
        ruleId: rule.ruleId,
        status: "pendente",
      });
    }
  }

  // Criar conta a receber se não for pagamento à vista
  if (data.paymentMethod !== "dinheiro" && data.paymentMethod !== "pix") {
    await database.insert(accountsReceivable).values({
      description: `Venda #${saleId}`,
      customerId: data.customerId,
      amount: finalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      status: "pendente",
      createdBy: data.sellerId,
    });
  }

  return saleId;
}

// ============= FINANCEIRO - CONTAS A PAGAR =============
export async function listAccountsPayable(filters: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { accountsPayable } = await import("../drizzle/schema");
    const results = await database
      .select()
      .from(accountsPayable)
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
    return results;
  } catch (error) {
    console.error("[Database] Failed to list accounts payable:", error);
    return [];
  }
}

export async function createAccountPayable(data: {
  description: string;
  category?: string;
  costCenter?: string;
  supplier?: string;
  amount: number;
  dueDate: Date;
  notes?: string;
  createdBy: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { accountsPayable } = await import("../drizzle/schema");
  const result = await database.insert(accountsPayable).values(data);
  return result;
}

export async function updateAccountPayableStatus(id: number, status: "pendente" | "pago" | "atrasado" | "cancelado", paymentDate?: Date) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { accountsPayable } = await import("../drizzle/schema");
  await database
    .update(accountsPayable)
    .set({ status, paymentDate })
    .where(eq(accountsPayable.id, id));
}

// ============= FINANCEIRO - CONTAS A RECEBER =============
export async function listAccountsReceivable(filters: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { accountsReceivable } = await import("../drizzle/schema");
    const results = await database
      .select()
      .from(accountsReceivable)
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
    return results;
  } catch (error) {
    console.error("[Database] Failed to list accounts receivable:", error);
    return [];
  }
}

export async function createAccountReceivable(data: {
  customerId?: number;
  description: string;
  amount: number;
  dueDate: Date;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdBy: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { accountsReceivable } = await import("../drizzle/schema");
  const result = await database.insert(accountsReceivable).values(data);
  return result;
}

export async function updateAccountReceivableStatus(id: number, status: "pendente" | "recebido" | "atrasado" | "cancelado", paymentDate?: Date) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { accountsReceivable } = await import("../drizzle/schema");
  await database
    .update(accountsReceivable)
    .set({ status, paymentDate })
    .where(eq(accountsReceivable.id, id));
}

// ============= FINANCEIRO - FLUXO DE CAIXA =============
export async function getCashFlow(startDate: Date, endDate: Date) {
  const database = await getDb();
  if (!database) return { totalIncome: 0, totalExpenses: 0, balance: 0, transactions: [] };

  try {
    const { accountsPayable, accountsReceivable } = await import("../drizzle/schema");
    
    // Buscar receitas
    const income = await database
      .select()
      .from(accountsReceivable)
      .where(eq(accountsReceivable.status, "recebido"));
    
    // Buscar despesas
    const expenses = await database
      .select()
      .from(accountsPayable)
      .where(eq(accountsPayable.status, "pago"));

    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactions: [
        ...income.map(i => ({ ...i, type: "receita" as const })),
        ...expenses.map(e => ({ ...e, type: "despesa" as const })),
      ],
    };
  } catch (error) {
    console.error("[Database] Failed to get cash flow:", error);
    return { totalIncome: 0, totalExpenses: 0, balance: 0, transactions: [] };
  }
}


// ============= RELATÓRIOS E BI =============
export async function getSalesStats(startDate: Date, endDate: Date) {
  const database = await getDb();
  if (!database) return { totalSales: 0, totalRevenue: 0, averageTicket: 0, salesByPeriod: [] };

  try {
    const { sales } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    // Total de vendas e receita
    const result = await database
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<number>`SUM(${sales.totalAmount})`,
      })
      .from(sales)
      .where(sql`${sales.createdAt} BETWEEN ${startDate} AND ${endDate}`);

    const stats = result[0] || { count: 0, total: 0 };
    const totalSales = Number(stats.count) || 0;
    const totalRevenue = Number(stats.total) || 0;
    const averageTicket = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

    // Vendas por dia
    const salesByDay = await database
      .select({
        date: sql<string>`DATE(${sales.createdAt}) as sale_date`,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`SUM(${sales.totalAmount})`,
      })
      .from(sales)
      .where(sql`${sales.createdAt} BETWEEN ${startDate} AND ${endDate}`)
      .groupBy(sql`sale_date`)
      .orderBy(sql`sale_date`);

    return {
      totalSales,
      totalRevenue,
      averageTicket,
      salesByPeriod: salesByDay.map((s: any) => ({
        date: s.date,
        count: Number(s.count),
        total: Number(s.total),
      })),
    };
  } catch (error) {
    console.error("Error getting sales stats:", error);
    return { totalSales: 0, totalRevenue: 0, averageTicket: 0, salesByPeriod: [] };
  }
}

export async function getTopProducts(startDate: Date, endDate: Date, limit: number = 10) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { saleItems, products, sales } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    const result = await database
      .select({
        productId: saleItems.productId,
        productName: products.name,
        quantity: sql<number>`SUM(${saleItems.quantity})`,
        revenue: sql<number>`SUM(${saleItems.totalPrice})`,
      })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(sql`${sales.createdAt} BETWEEN ${startDate} AND ${endDate}`)
      .groupBy(saleItems.productId, products.name)
      .orderBy(sql`SUM(${saleItems.quantity}) DESC`)
      .limit(limit);

    return result.map((r: any) => ({
      productId: r.productId,
      productName: r.productName,
      quantity: Number(r.quantity),
      revenue: Number(r.revenue),
    }));
  } catch (error) {
    console.error("Error getting top products:", error);
    return [];
  }
}

export async function getSellerPerformance(startDate: Date, endDate: Date) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { sales, users } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    const result = await database
      .select({
        sellerId: sales.sellerId,
        sellerName: users.name,
        salesCount: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(${sales.totalAmount})`,
      })
      .from(sales)
      .innerJoin(users, eq(sales.sellerId, users.id))
      .where(sql`${sales.createdAt} BETWEEN ${startDate} AND ${endDate}`)
      .groupBy(sales.sellerId, users.name)
      .orderBy(sql`SUM(${sales.totalAmount}) DESC`);

    return result.map((r: any) => ({
      sellerId: r.sellerId,
      sellerName: r.sellerName || "Sem nome",
      salesCount: Number(r.salesCount),
      totalRevenue: Number(r.totalRevenue),
    }));
  } catch (error) {
    console.error("Error getting seller performance:", error);
    return [];
  }
}

export async function getServiceOrderStats(startDate: Date, endDate: Date) {
  const database = await getDb();
  if (!database) return { total: 0, byStatus: [] };

  try {
    const { serviceOrders } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    // Total de OS
    const totalResult = await database
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(serviceOrders)
      .where(sql`${serviceOrders.createdAt} BETWEEN ${startDate} AND ${endDate}`);

    const total = Number(totalResult[0]?.count) || 0;

    // OS por status
    const byStatusResult = await database
      .select({
        status: serviceOrders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(serviceOrders)
      .where(sql`${serviceOrders.createdAt} BETWEEN ${startDate} AND ${endDate}`)
      .groupBy(serviceOrders.status);

    return {
      total,
      byStatus: byStatusResult.map((r: any) => ({
        status: r.status,
        count: Number(r.count),
      })),
    };
  } catch (error) {
    console.error("Error getting service order stats:", error);
    return { total: 0, byStatus: [] };
  }
}

export async function getFinancialKPIs(startDate: Date, endDate: Date) {
  const database = await getDb();
  if (!database) return {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  };

  try {
    const { accountsReceivable, accountsPayable } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    // Receitas recebidas
    const revenueResult = await database
      .select({
        total: sql<number>`SUM(${accountsReceivable.amount})`,
      })
      .from(accountsReceivable)
      .where(sql`${accountsReceivable.status} = 'recebido' AND ${accountsReceivable.paymentDate} BETWEEN ${startDate} AND ${endDate}`);

    const totalRevenue = Number(revenueResult[0]?.total) || 0;

    // Despesas pagas
    const expensesResult = await database
      .select({
        total: sql<number>`SUM(${accountsPayable.amount})`,
      })
      .from(accountsPayable)
      .where(sql`${accountsPayable.status} = 'pago' AND ${accountsPayable.paymentDate} BETWEEN ${startDate} AND ${endDate}`);

    const totalExpenses = Number(expensesResult[0]?.total) || 0;

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
    };
  } catch (error) {
    console.error("Error getting financial KPIs:", error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
    };
  }
}

export async function getInventoryStats() {
  const database = await getDb();
  if (!database) return { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };

  try {
    const { products } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    const result = await database
      .select({
        total: sql<number>`COUNT(*)`,
        lowStock: sql<number>`SUM(CASE WHEN ${products.currentStock} <= ${products.minStock} AND ${products.currentStock} > 0 THEN 1 ELSE 0 END)`,
        outOfStock: sql<number>`SUM(CASE WHEN ${products.currentStock} = 0 THEN 1 ELSE 0 END)`,
        totalValue: sql<number>`SUM(${products.currentStock} * ${products.salePrice})`,
      })
      .from(products);

    const stats = result[0] || { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };

    return {
      totalProducts: Number(stats.total),
      lowStock: Number(stats.lowStock),
      outOfStock: Number(stats.outOfStock),
      totalValue: Number(stats.totalValue),
    };
  } catch (error) {
    console.error("Error getting inventory stats:", error);
    return { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
  }
}


// ============= HISTÓRICO DE VENDAS =============
export async function getSalesHistory(filters: {
  startDate?: Date;
  endDate?: Date;
  sellerId?: number;
  customerId?: number;
  status?: string;
  paymentMethod?: string;
  limit?: number;
  offset?: number;
}) {
  const database = await getDb();
  if (!database) return { sales: [], total: 0 };

  try {
    const { sales, users, customers } = await import("../drizzle/schema");
    const { sql, and } = await import("drizzle-orm");
    
    const conditions: any[] = [];

    if (filters.startDate) {
      conditions.push(sql`${sales.createdAt} >= ${filters.startDate}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${sales.createdAt} <= ${filters.endDate}`);
    }
    if (filters.sellerId) {
      conditions.push(eq(sales.sellerId, filters.sellerId));
    }
    if (filters.customerId) {
      conditions.push(eq(sales.customerId, filters.customerId));
    }
    if (filters.status) {
      conditions.push(eq(sales.status, filters.status as any));
    }
    if (filters.paymentMethod) {
      conditions.push(eq(sales.paymentMethod, filters.paymentMethod));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Contar total
    const countResult = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales)
      .where(whereClause);

    const total = Number(countResult[0]?.count) || 0;

    // Buscar vendas
    let query = database
      .select({
        id: sales.id,
        customerId: sales.customerId,
        customerName: customers.name,
        sellerId: sales.sellerId,
        sellerName: users.name,
        totalAmount: sales.totalAmount,
        discountAmount: sales.discountAmount,
        finalAmount: sales.finalAmount,
        status: sales.status,
        paymentMethod: sales.paymentMethod,
        nfeNumber: sales.nfeNumber,
        nfeIssued: sales.nfeIssued,
        commission: sales.commission,
        notes: sales.notes,
        saleDate: sales.saleDate,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(users, eq(sales.sellerId, users.id))
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(whereClause)
      .orderBy(sql`${sales.createdAt} DESC`);

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters.offset) {
      query = query.offset(filters.offset) as any;
    }

    const result = await query;

    return {
      sales: result,
      total,
    };
  } catch (error) {
    console.error("Error getting sales history:", error);
    return { sales: [], total: 0 };
  }
}


// ============= MOVIMENTAÇÕES DE ESTOQUE =============
export async function createStockMovement(movement: {
  productId: number;
  stockItemId?: number;
  type: "entrada" | "saida" | "transferencia" | "ajuste" | "devolucao";
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  userId: number;
  reason?: string;
  referenceType?: string;
  referenceId?: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  try {
    const { stockMovements, products } = await import("../drizzle/schema");
    
    // Registrar movimentação
    const [result] = await database.insert(stockMovements).values(movement);

    // Atualizar estoque do produto
    if (movement.type === "entrada" || movement.type === "devolucao") {
      await database
        .update(products)
        .set({
          currentStock: sql`${products.currentStock} + ${movement.quantity}`,
        })
        .where(eq(products.id, movement.productId));
    } else if (movement.type === "saida" || movement.type === "ajuste") {
      await database
        .update(products)
        .set({
          currentStock: sql`${products.currentStock} - ${movement.quantity}`,
        })
        .where(eq(products.id, movement.productId));
    }

    return { id: result.insertId, success: true };
  } catch (error) {
    console.error("Error creating stock movement:", error);
    throw error;
  }
}

export async function getStockMovements(filters: {
  startDate?: Date;
  endDate?: Date;
  productId?: number;
  type?: string;
  userId?: number;
  limit?: number;
  offset?: number;
}) {
  const database = await getDb();
  if (!database) return { movements: [], total: 0 };

  try {
    const { stockMovements, products, users, stockItems } = await import("../drizzle/schema");
    const { sql, and } = await import("drizzle-orm");
    
    const conditions: any[] = [];

    if (filters.startDate) {
      conditions.push(sql`${stockMovements.createdAt} >= ${filters.startDate}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${stockMovements.createdAt} <= ${filters.endDate}`);
    }
    if (filters.productId) {
      conditions.push(eq(stockMovements.productId, filters.productId));
    }
    if (filters.type) {
      conditions.push(eq(stockMovements.type, filters.type as any));
    }
    if (filters.userId) {
      conditions.push(eq(stockMovements.userId, filters.userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Contar total
    const countResult = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockMovements)
      .where(whereClause);

    const total = Number(countResult[0]?.count) || 0;

    // Buscar movimentações
    let query = database
      .select({
        id: stockMovements.id,
        productId: stockMovements.productId,
        productName: products.name,
        stockItemId: stockMovements.stockItemId,
        imei: stockItems.imei,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        fromLocation: stockMovements.fromLocation,
        toLocation: stockMovements.toLocation,
        userId: stockMovements.userId,
        userName: users.name,
        reason: stockMovements.reason,
        referenceType: stockMovements.referenceType,
        referenceId: stockMovements.referenceId,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(users, eq(stockMovements.userId, users.id))
      .leftJoin(stockItems, eq(stockMovements.stockItemId, stockItems.id))
      .where(whereClause)
      .orderBy(sql`${stockMovements.createdAt} DESC`);

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters.offset) {
      query = query.offset(filters.offset) as any;
    }

    const result = await query;

    return {
      movements: result,
      total,
    };
  } catch (error) {
    console.error("Error getting stock movements:", error);
    return { movements: [], total: 0 };
  }
}

export async function getInventoryReport() {
  const database = await getDb();
  if (!database) return [];

  try {
    const { products, stockMovements } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");

    // Buscar produtos com estoque calculado vs estoque registrado
    const result = await database
      .select({
        productId: products.id,
        productName: products.name,
        sku: products.sku,
        currentStock: products.currentStock,
        minStock: products.minStock,
        costPrice: products.costPrice,
        salePrice: products.salePrice,
        // Calcular estoque baseado em movimentações
        calculatedStock: sql<number>`(
          SELECT COALESCE(SUM(
            CASE 
              WHEN ${stockMovements.type} IN ('entrada', 'devolucao') THEN ${stockMovements.quantity}
              WHEN ${stockMovements.type} IN ('saida', 'ajuste') THEN -${stockMovements.quantity}
              ELSE 0
            END
          ), 0)
          FROM ${stockMovements}
          WHERE ${stockMovements.productId} = ${products.id}
        )`,
      })
      .from(products);

    return result.map((item) => ({
      ...item,
      divergence: item.currentStock - (item.calculatedStock || 0),
      status:
        item.currentStock <= 0
          ? "sem_estoque"
          : item.currentStock <= item.minStock
          ? "baixo"
          : "normal",
    }));
  } catch (error) {
    console.error("Error getting inventory report:", error);
    return [];
  }
}

export async function getStockMovementsByIMEI(imei: string) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { stockMovements, products, users, stockItems } = await import("../drizzle/schema");

    const result = await database
      .select({
        id: stockMovements.id,
        productName: products.name,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        fromLocation: stockMovements.fromLocation,
        toLocation: stockMovements.toLocation,
        userName: users.name,
        reason: stockMovements.reason,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(users, eq(stockMovements.userId, users.id))
      .leftJoin(stockItems, eq(stockMovements.stockItemId, stockItems.id))
      .where(eq(stockItems.imei, imei))
      .orderBy(sql`${stockMovements.createdAt} DESC`);

    return result;
  } catch (error) {
    console.error("Error getting stock movements by IMEI:", error);
    return [];
  }
}


// ============= PEÇAS EM ORDEM DE SERVIÇO =============
export async function addPartToServiceOrder(part: {
  serviceOrderId: number;
  productId: number;
  stockItemId?: number;
  quantity: number;
  unitPrice: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  try {
    const { serviceOrderParts } = await import("../drizzle/schema");
    
    const totalPrice = part.unitPrice * part.quantity;

    const [result] = await database.insert(serviceOrderParts).values({
      ...part,
      totalPrice,
    });

    return { id: result.insertId, success: true };
  } catch (error) {
    console.error("Error adding part to service order:", error);
    throw error;
  }
}

export async function removePartFromServiceOrder(partId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  try {
    const { serviceOrderParts } = await import("../drizzle/schema");
    
    await database.delete(serviceOrderParts).where(eq(serviceOrderParts.id, partId));

    return { success: true };
  } catch (error) {
    console.error("Error removing part from service order:", error);
    throw error;
  }
}

export async function getServiceOrderParts(serviceOrderId: number) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { serviceOrderParts, products, stockItems } = await import("../drizzle/schema");

    const result = await database
      .select({
        id: serviceOrderParts.id,
        serviceOrderId: serviceOrderParts.serviceOrderId,
        productId: serviceOrderParts.productId,
        productName: products.name,
        productSku: products.sku,
        stockItemId: serviceOrderParts.stockItemId,
        imei: stockItems.imei,
        quantity: serviceOrderParts.quantity,
        unitPrice: serviceOrderParts.unitPrice,
        totalPrice: serviceOrderParts.totalPrice,
        createdAt: serviceOrderParts.createdAt,
      })
      .from(serviceOrderParts)
      .leftJoin(products, eq(serviceOrderParts.productId, products.id))
      .leftJoin(stockItems, eq(serviceOrderParts.stockItemId, stockItems.id))
      .where(eq(serviceOrderParts.serviceOrderId, serviceOrderId));

    return result;
  } catch (error) {
    console.error("Error getting service order parts:", error);
    return [];
  }
}

export async function getPartsByTechnician(filters: {
  technicianId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { serviceOrderParts, products, serviceOrders, users } = await import("../drizzle/schema");
    const { and } = await import("drizzle-orm");

    const conditions: any[] = [];

    if (filters.technicianId) {
      conditions.push(eq(serviceOrders.technicianId, filters.technicianId));
    }
    if (filters.startDate) {
      conditions.push(sql`${serviceOrderParts.createdAt} >= ${filters.startDate}`);
    }
    if (filters.endDate) {
      conditions.push(sql`${serviceOrderParts.createdAt} <= ${filters.endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await database
      .select({
        id: serviceOrderParts.id,
        serviceOrderId: serviceOrderParts.serviceOrderId,
        productId: serviceOrderParts.productId,
        productName: products.name,
        quantity: serviceOrderParts.quantity,
        unitPrice: serviceOrderParts.unitPrice,
        totalPrice: serviceOrderParts.totalPrice,
        technicianId: serviceOrders.technicianId,
        technicianName: users.name,
        createdAt: serviceOrderParts.createdAt,
      })
      .from(serviceOrderParts)
      .leftJoin(products, eq(serviceOrderParts.productId, products.id))
      .leftJoin(serviceOrders, eq(serviceOrderParts.serviceOrderId, serviceOrders.id))
      .leftJoin(users, eq(serviceOrders.technicianId, users.id))
      .where(whereClause)
      .orderBy(sql`${serviceOrderParts.createdAt} DESC`);

    return result;
  } catch (error) {
    console.error("Error getting parts by technician:", error);
    return [];
  }
}

export async function processServiceOrderCompletion(serviceOrderId: number, userId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  try {
    const { serviceOrderParts, products, stockMovements, serviceOrders } = await import("../drizzle/schema");

    // Buscar todas as peças da OS
    const parts = await database
      .select()
      .from(serviceOrderParts)
      .where(eq(serviceOrderParts.serviceOrderId, serviceOrderId));

    // Para cada peça, criar movimentação de saída e atualizar estoque
    for (const part of parts) {
      // Criar movimentação de saída
      await database.insert(stockMovements).values({
        productId: part.productId,
        stockItemId: part.stockItemId,
        type: "saida",
        quantity: part.quantity,
        userId,
        reason: `Utilizado na OS #${serviceOrderId}`,
        referenceType: "service_order",
        referenceId: serviceOrderId,
      });

      // Atualizar estoque do produto
      await database
        .update(products)
        .set({
          currentStock: sql`${products.currentStock} - ${part.quantity}`,
        })
        .where(eq(products.id, part.productId));
    }

    // Atualizar status da OS para concluída
    await database
      .update(serviceOrders)
      .set({
        status: "concluida",
        completedAt: new Date(),
      })
      .where(eq(serviceOrders.id, serviceOrderId));

    return { success: true };
  } catch (error) {
    console.error("Error processing service order completion:", error);
    throw error;
  }
}


// ============= COMISSÕES =============

export async function createCommissionRule(rule: InsertCommissionRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(commissionRules).values(rule);
  return { id: result[0].insertId, success: true };
}

export async function getCommissionRulesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(commissionRules)
    .where(eq(commissionRules.userId, userId))
    .orderBy(desc(commissionRules.priority));
}

export async function getActiveCommissionRules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  return await db
    .select()
    .from(commissionRules)
    .where(
      and(
        eq(commissionRules.userId, userId),
        eq(commissionRules.active, true),
        or(
          isNull(commissionRules.startDate),
          lte(commissionRules.startDate, now)
        ),
        or(
          isNull(commissionRules.endDate),
          gte(commissionRules.endDate, now)
        )
      )
    )
    .orderBy(desc(commissionRules.priority));
}

export async function calculateCommission(saleId: number, userId: number, saleAmount: number) {
  const rules = await getActiveCommissionRules(userId);
  let totalCommission = 0;
  const appliedRules: any[] = [];

  for (const rule of rules) {
    let commissionAmount = 0;

    if (rule.type === "percentual_fixo" && rule.percentage) {
      commissionAmount = Math.floor((saleAmount * rule.percentage) / 10000);
    } else if (rule.type === "meta_progressiva") {
      if (
        (!rule.minSalesAmount || saleAmount >= rule.minSalesAmount) &&
        (!rule.maxSalesAmount || saleAmount <= rule.maxSalesAmount) &&
        rule.percentage
      ) {
        commissionAmount = Math.floor((saleAmount * rule.percentage) / 10000);
      }
    }

    if (commissionAmount > 0) {
      totalCommission += commissionAmount;
      appliedRules.push({
        ruleId: rule.id,
        amount: commissionAmount,
        percentage: rule.percentage,
      });
    }
  }

  return { totalCommission, appliedRules };
}

export async function createCommission(commission: InsertCommission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(commissions).values(commission);
  return { id: result[0].insertId, success: true };
}

export async function getCommissionsByUser(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(commissions.userId, userId)];
  
  if (startDate && endDate) {
    conditions.push(gte(commissions.createdAt, startDate));
    conditions.push(lte(commissions.createdAt, endDate));
  }

  return await db
    .select({
      id: commissions.id,
      saleId: commissions.saleId,
      amount: commissions.amount,
      baseAmount: commissions.baseAmount,
      percentage: commissions.percentage,
      status: commissions.status,
      approvedAt: commissions.approvedAt,
      paidAt: commissions.paidAt,
      createdAt: commissions.createdAt,
      saleDate: sales.createdAt,
      customerName: customers.name,
    })
    .from(commissions)
    .leftJoin(sales, eq(commissions.saleId, sales.id))
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(commissions.createdAt));
}

export async function getPendingCommissions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: commissions.id,
      userId: commissions.userId,
      userName: users.name,
      saleId: commissions.saleId,
      amount: commissions.amount,
      baseAmount: commissions.baseAmount,
      percentage: commissions.percentage,
      createdAt: commissions.createdAt,
      customerName: customers.name,
    })
    .from(commissions)
    .leftJoin(users, eq(commissions.userId, users.id))
    .leftJoin(sales, eq(commissions.saleId, sales.id))
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(eq(commissions.status, "pendente"))
    .orderBy(desc(commissions.createdAt));
}

export async function approveCommission(commissionId: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(commissions)
    .set({
      status: "aprovada",
      approvedBy,
      approvedAt: new Date(),
    })
    .where(eq(commissions.id, commissionId));
  
  return { success: true };
}

export async function payCommission(commissionId: number, paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(commissions)
    .set({
      status: "paga",
      paymentId,
      paidAt: new Date(),
    })
    .where(eq(commissions.id, commissionId));
  
  return { success: true };
}

export async function listCommissionRules() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: commissionRules.id,
      userId: commissionRules.userId,
      userName: users.name,
      name: commissionRules.name,
      type: commissionRules.type,
      active: commissionRules.active,
      percentage: commissionRules.percentage,
      minSalesAmount: commissionRules.minSalesAmount,
      maxSalesAmount: commissionRules.maxSalesAmount,
      productId: commissionRules.productId,
      bonusAmount: commissionRules.bonusAmount,
      bonusPercentage: commissionRules.bonusPercentage,
      priority: commissionRules.priority,
      startDate: commissionRules.startDate,
      endDate: commissionRules.endDate,
      createdAt: commissionRules.createdAt,
    })
    .from(commissionRules)
    .leftJoin(users, eq(commissionRules.userId, users.id))
    .orderBy(desc(commissionRules.createdAt));
}

export async function updateCommissionRule(data: { ruleId: number; [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { ruleId, ...updateData } = data;
  
  await db
    .update(commissionRules)
    .set(updateData)
    .where(eq(commissionRules.id, ruleId));
  
  return { success: true };
}

export async function deleteCommissionRule(ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(commissionRules)
    .where(eq(commissionRules.id, ruleId));
  
  return { success: true };
}


// ============================================
// FUNÇÕES DE NOTA FISCAL ELETRÔNICA (NF-e)
// ============================================

export async function getLastInvoiceNumber(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ maxNumber: sql<number>`MAX(${invoices.number})` })
    .from(invoices);
  
  return result[0]?.maxNumber || 0;
}

export async function createInvoice(data: InsertInvoice): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoices).values(data);
  return Number(result[0].insertId);
}

export async function createInvoiceItem(data: InsertInvoiceItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoiceItems).values(data);
  return Number(result[0].insertId);
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0] || null;
}

export async function getInvoiceItems(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
}

export async function listInvoices(filters: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(invoices);
  
  const conditions = [];
  if (filters.status) {
    conditions.push(eq(invoices.status, filters.status as any));
  }
  if (filters.startDate) {
    conditions.push(sql`${invoices.createdAt} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${invoices.createdAt} <= ${filters.endDate}`);
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(invoices.createdAt)) as any;
  
  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return query;
}

export async function updateInvoiceStatus(
  id: number,
  status: string,
  data?: {
    accessKey?: string;
    protocol?: string;
    authorizationDate?: Date;
    xmlUrl?: string;
    danfeUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (data) {
    Object.assign(updateData, data);
  }
  
  await db.update(invoices).set(updateData).where(eq(invoices.id, id));
}

export async function cancelInvoice(
  id: number,
  reason: string,
  protocol?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(invoices).set({
    status: "cancelada",
    cancelReason: reason,
    canceledAt: new Date(),
    cancelProtocol: protocol,
  }).where(eq(invoices.id, id));
}

export async function getInvoiceStats() {
  const db = await getDb();
  if (!db) return {
    total: 0,
    emitidas: 0,
    canceladas: 0,
    totalValue: 0,
  };
  
  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
      emitidas: sql<number>`SUM(CASE WHEN ${invoices.status} = 'emitida' THEN 1 ELSE 0 END)`,
      canceladas: sql<number>`SUM(CASE WHEN ${invoices.status} = 'cancelada' THEN 1 ELSE 0 END)`,
      totalValue: sql<number>`SUM(CASE WHEN ${invoices.status} = 'emitida' THEN ${invoices.totalInvoice} ELSE 0 END)`,
    })
    .from(invoices);
  
  return result[0] || { total: 0, emitidas: 0, canceladas: 0, totalValue: 0 };
}

// ============= FUNÇÕES PARA RECIBO =============

export async function getSaleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { sales } = await import("../drizzle/schema");
  const result = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  return result[0] || null;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { customers } = await import("../drizzle/schema");
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0] || null;
}

export async function getSaleItems(saleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { saleItems, products, stockItems } = await import("../drizzle/schema");
  
  const items = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
      productName: products.name,
      productSku: products.sku,
      brand: products.brand,
      model: products.model,
      category: products.category,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      imei: stockItems.imei,
    })
    .from(saleItems)
    .leftJoin(products, eq(saleItems.productId, products.id))
    .leftJoin(stockItems, eq(saleItems.stockItemId, stockItems.id))
    .where(eq(saleItems.saleId, saleId));
  
  return items;
}

// ============= ANALYTICS DO CHATBOT =============
export async function createChatbotConversation(data: InsertChatbotConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatbotConversations).values(data);
  return Number(result[0].insertId);
}

export async function updateChatbotConversation(
  sessionId: string,
  data: Partial<InsertChatbotConversation>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(chatbotConversations)
    .set(data)
    .where(eq(chatbotConversations.sessionId, sessionId));
}

export async function createChatbotMessage(data: InsertChatbotMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatbotMessages).values(data);
  return Number(result[0].insertId);
}

export async function createChatbotEvent(data: InsertChatbotEvent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatbotEvents).values(data);
  return Number(result[0].insertId);
}

export async function getChatbotMetrics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Métricas gerais
  const totalConversations = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatbotConversations);
  
  const conversionsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatbotConversations)
    .where(eq(chatbotConversations.converted, true));
  
  const avgDuration = await db
    .select({ avg: sql<number>`avg(duration)` })
    .from(chatbotConversations)
    .where(gt(chatbotConversations.duration, 0));
  
  const avgMessagesPerConversation = await db
    .select({ avg: sql<number>`avg(message_count)` })
    .from(chatbotConversations);
  
  return {
    totalConversations: totalConversations[0]?.count || 0,
    conversions: conversionsCount[0]?.count || 0,
    conversionRate: totalConversations[0]?.count 
      ? ((conversionsCount[0]?.count || 0) / totalConversations[0].count) * 100 
      : 0,
    avgDuration: Math.round(avgDuration[0]?.avg || 0),
    avgMessagesPerConversation: Math.round(avgMessagesPerConversation[0]?.avg || 0),
  };
}

export async function getFrequentQuestions(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar mensagens de usuários agrupadas por similaridade de conteúdo
  const questions = await db
    .select({
      content: chatbotMessages.content,
      count: sql<number>`count(*)`,
    })
    .from(chatbotMessages)
    .where(eq(chatbotMessages.role, "user"))
    .groupBy(chatbotMessages.content)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);
  
  return questions;
}

export async function getChatbotConversationsByDate(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conversations = await db
    .select({
      date: sql<string>`DATE(started_at)`,
      count: sql<number>`count(*)`,
      conversions: sql<number>`sum(CASE WHEN converted = 1 THEN 1 ELSE 0 END)`,
    })
    .from(chatbotConversations)
    .where(sql`started_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`)
    .groupBy(sql`DATE(started_at)`)
    .orderBy(sql`DATE(started_at) ASC`);
  
  return conversations;
}

export async function getConversionsByType() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conversions = await db
    .select({
      type: chatbotConversations.conversionType,
      count: sql<number>`count(*)`,
    })
    .from(chatbotConversations)
    .where(eq(chatbotConversations.converted, true))
    .groupBy(chatbotConversations.conversionType);
  
  return conversions;
}

export async function getAverageResponseTime() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const avgTime = await db
    .select({ avg: sql<number>`avg(response_time)` })
    .from(chatbotMessages)
    .where(
      and(
        eq(chatbotMessages.role, "assistant"),
        gt(chatbotMessages.responseTime, 0)
      )
    );
  
  return Math.round(avgTime[0]?.avg || 0);
}

// ============= SISTEMA DE CHAMADOS/TICKETS DE SUPORTE =============
export async function createSupportTicket(data: InsertSupportTicket): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(supportTickets).values(data);
  return Number(result[0].insertId);
}

export async function getSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return result[0];
}

export async function listSupportTicketsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
}

export async function listAllSupportTickets(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(supportTickets);
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(supportTickets.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(supportTickets.priority, filters.priority as any));
  }
  if (filters?.category) {
    conditions.push(eq(supportTickets.category, filters.category as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(supportTickets.createdAt));
}

export async function updateSupportTicketStatus(
  id: number,
  status: string,
  assignedTo?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  
  if (assignedTo !== undefined) {
    updateData.assignedTo = assignedTo;
  }
  
  if (status === "resolvido") {
    updateData.resolvedAt = new Date();
  }
  
  if (status === "fechado") {
    updateData.closedAt = new Date();
  }
  
  await db
    .update(supportTickets)
    .set(updateData)
    .where(eq(supportTickets.id, id));
}

export async function createSupportTicketMessage(data: InsertSupportTicketMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(supportTicketMessages).values(data);
  
  // Atualizar updatedAt do ticket
  await db
    .update(supportTickets)
    .set({ updatedAt: new Date() })
    .where(eq(supportTickets.id, data.ticketId));
  
  return Number(result[0].insertId);
}

export async function getSupportTicketMessages(ticketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      id: supportTicketMessages.id,
      ticketId: supportTicketMessages.ticketId,
      userId: supportTicketMessages.userId,
      userName: users.name,
      userEmail: users.email,
      message: supportTicketMessages.message,
      isInternal: supportTicketMessages.isInternal,
      attachments: supportTicketMessages.attachments,
      createdAt: supportTicketMessages.createdAt,
    })
    .from(supportTicketMessages)
    .leftJoin(users, eq(supportTicketMessages.userId, users.id))
    .where(eq(supportTicketMessages.ticketId, ticketId))
    .orderBy(supportTicketMessages.createdAt);
}

export async function getSupportTicketStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportTickets);
  
  const abertos = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportTickets)
    .where(eq(supportTickets.status, "aberto"));
  
  const emAndamento = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportTickets)
    .where(eq(supportTickets.status, "em_andamento"));
  
  const resolvidos = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportTickets)
    .where(eq(supportTickets.status, "resolvido"));
  
  return {
    total: total[0]?.count || 0,
    abertos: abertos[0]?.count || 0,
    emAndamento: emAndamento[0]?.count || 0,
    resolvidos: resolvidos[0]?.count || 0,
  };
}
