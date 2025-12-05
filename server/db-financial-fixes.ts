// This file contains the fixed versions of all financial database functions
// These fixes ensure proper multi-tenant isolation in the financial module

import { eq, and, or, gte, lte, like } from "drizzle-orm";

export async function listAccountsPayableFixed(
  database: any,
  filters: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    tenantId?: number;
  }
) {
  if (!database) return [];

  try {
    const { accountsPayable } = await import("../drizzle/schema");
    
    let query = database.select().from(accountsPayable);
    
    const conditions = [];
    
    // Always filter by tenantId for multi-tenant isolation
    if (filters.tenantId) {
      conditions.push(eq(accountsPayable.tenantId, filters.tenantId));
    }
    
    if (filters.status) {
      conditions.push(eq(accountsPayable.status, filters.status));
    }
    
    if (filters.startDate) {
      conditions.push(gte(accountsPayable.dueDate, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(accountsPayable.dueDate, filters.endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
    
    return results;
  } catch (error) {
    console.error("[Database] Failed to list accounts payable:", error);
    return [];
  }
}

export async function listAccountsReceivableFixed(
  database: any,
  filters: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    tenantId?: number;
  }
) {
  if (!database) return [];

  try {
    const { accountsReceivable } = await import("../drizzle/schema");
    
    let query = database.select().from(accountsReceivable);
    
    const conditions = [];
    
    // Always filter by tenantId for multi-tenant isolation
    if (filters.tenantId) {
      conditions.push(eq(accountsReceivable.tenantId, filters.tenantId));
    }
    
    if (filters.status) {
      conditions.push(eq(accountsReceivable.status, filters.status));
    }
    
    if (filters.startDate) {
      conditions.push(gte(accountsReceivable.dueDate, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(accountsReceivable.dueDate, filters.endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
    
    return results;
  } catch (error) {
    console.error("[Database] Failed to list accounts receivable:", error);
    return [];
  }
}

export async function createAccountPayableFixed(
  database: any,
  data: {
    description: string;
    category?: string;
    costCenter?: string;
    supplier?: string;
    amount: number;
    dueDate: Date;
    notes?: string;
    createdBy: number;
    tenantId: number; // REQUIRED for multi-tenant isolation
  }
) {
  if (!database) throw new Error("Database not available");

  const { accountsPayable } = await import("../drizzle/schema");
  const result = await database.insert(accountsPayable).values({
    ...data,
    status: "pendente", // Default status
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result;
}

export async function createAccountReceivableFixed(
  database: any,
  data: {
    customerId?: number;
    description: string;
    amount: number;
    dueDate: Date;
    referenceType?: string;
    referenceId?: number;
    notes?: string;
    createdBy: number;
    tenantId: number; // REQUIRED for multi-tenant isolation
  }
) {
  if (!database) throw new Error("Database not available");

  const { accountsReceivable } = await import("../drizzle/schema");
  const result = await database.insert(accountsReceivable).values({
    ...data,
    status: "pendente", // Default status
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result;
}

export async function updateAccountPayableStatusFixed(
  database: any,
  id: number,
  status: "pendente" | "pago" | "atrasado" | "cancelado",
  paymentDate?: Date,
  tenantId?: number
) {
  if (!database) throw new Error("Database not available");

  const { accountsPayable } = await import("../drizzle/schema");
  
  const conditions = [eq(accountsPayable.id, id)];
  
  // Add tenantId filter for security
  if (tenantId) {
    conditions.push(eq(accountsPayable.tenantId, tenantId));
  }
  
  await database
    .update(accountsPayable)
    .set({ status, paymentDate, updatedAt: new Date() })
    .where(and(...conditions));
}

export async function updateAccountReceivableStatusFixed(
  database: any,
  id: number,
  status: "pendente" | "recebido" | "atrasado" | "cancelado",
  paymentDate?: Date,
  tenantId?: number
) {
  if (!database) throw new Error("Database not available");

  const { accountsReceivable } = await import("../drizzle/schema");
  
  const conditions = [eq(accountsReceivable.id, id)];
  
  // Add tenantId filter for security
  if (tenantId) {
    conditions.push(eq(accountsReceivable.tenantId, tenantId));
  }
  
  await database
    .update(accountsReceivable)
    .set({ status, paymentDate, updatedAt: new Date() })
    .where(and(...conditions));
}
