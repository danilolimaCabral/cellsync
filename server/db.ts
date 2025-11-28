import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
}) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { products } = await import("../drizzle/schema");
    let query = database.select().from(products);
    
    const results = await query.limit(filters.limit || 50).offset(filters.offset || 0);
    return results.map(p => ({
      ...p,
      price: p.salePrice,
      stockQuantity: 0, // TODO: Calcular do estoque real
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
}) {
  const database = await getDb();
  if (!database) return [];

  try {
    const { customers } = await import("../drizzle/schema");
    const results = await database
      .select()
      .from(customers)
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
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
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    imei?: string;
  }>;
  paymentMethod: string;
  totalAmount: number;
  discount: number;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const { sales, saleItems } = await import("../drizzle/schema");
  
  // Criar venda
  const finalAmount = data.totalAmount - data.discount;
  const [saleResult] = await database.insert(sales).values({
    customerId: data.customerId,
    sellerId: data.sellerId,
    totalAmount: data.totalAmount,
    discountAmount: data.discount,
    finalAmount,
    paymentMethod: data.paymentMethod,
    status: "concluida",
  });

  const saleId = Number(saleResult.insertId);

  // Criar itens da venda
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
  }

  return saleId;
}
