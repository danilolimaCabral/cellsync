import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Sistema OkCells - Schema completo do banco de dados
 * Inclui todos os módulos: Usuários, Vendas, Estoque, OS, Financeiro, CRM e BI
 */

// ============= USUÁRIOS E AUTENTICAÇÃO =============
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Hash bcrypt
  name: text("name").notNull(),
  role: mysqlEnum("role", ["admin", "vendedor", "tecnico", "gerente"]).default("vendedor").notNull(),
  active: boolean("active").default(true).notNull(),
  openId: varchar("openId", { length: 64 }), // Mantido para compatibilidade com SDK
  loginMethod: varchar("loginMethod", { length: 64 }), // Mantido para compatibilidade com SDK
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============= CLIENTES (CRM) =============
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  birthDate: timestamp("birthDate"),
  loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
  segment: varchar("segment", { length: 50 }), // Segmentação para marketing
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ============= PRODUTOS =============
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  sku: varchar("sku", { length: 100 }).unique(),
  barcode: varchar("barcode", { length: 100 }),
  costPrice: int("costPrice").notNull(), // Preço em centavos
  salePrice: int("salePrice").notNull(), // Preço em centavos
  minStock: int("minStock").default(10).notNull(),
  currentStock: int("currentStock").default(0).notNull(),
  requiresImei: boolean("requiresImei").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============= ESTOQUE COM IMEI =============
export const stockItems = mysqlTable("stockItems", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  imei: varchar("imei", { length: 20 }).unique(),
  serialNumber: varchar("serialNumber", { length: 100 }),
  status: mysqlEnum("status", ["disponivel", "vendido", "reservado", "defeito", "em_reparo"]).default("disponivel").notNull(),
  location: varchar("location", { length: 100 }), // Filial ou localização física
  purchaseDate: timestamp("purchaseDate"),
  warrantyExpiry: timestamp("warrantyExpiry"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = typeof stockItems.$inferInsert;

// ============= MOVIMENTAÇÕES DE ESTOQUE =============
export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  stockItemId: int("stockItemId"), // Opcional, para produtos com IMEI
  type: mysqlEnum("type", ["entrada", "saida", "transferencia", "ajuste", "devolucao"]).notNull(),
  quantity: int("quantity").notNull(),
  fromLocation: varchar("fromLocation", { length: 100 }),
  toLocation: varchar("toLocation", { length: 100 }),
  userId: int("userId").notNull(), // Quem fez a movimentação
  reason: text("reason"),
  referenceType: varchar("referenceType", { length: 50 }), // venda, os, compra, etc
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

// ============= VENDAS =============
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId"),
  sellerId: int("sellerId").notNull(), // Vendedor
  totalAmount: int("totalAmount").notNull(), // Total em centavos
  discountAmount: int("discountAmount").default(0).notNull(),
  finalAmount: int("finalAmount").notNull(),
  status: mysqlEnum("status", ["pendente", "concluida", "cancelada"]).default("concluida").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  nfeNumber: varchar("nfeNumber", { length: 100 }),
  nfeIssued: boolean("nfeIssued").default(false).notNull(),
  commission: int("commission").default(0).notNull(), // Comissão em centavos
  notes: text("notes"),
  saleDate: timestamp("saleDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

// ============= ITENS DA VENDA =============
export const saleItems = mysqlTable("saleItems", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId").notNull(),
  productId: int("productId").notNull(),
  stockItemId: int("stockItemId"), // Para produtos com IMEI
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(), // Preço unitário em centavos
  discount: int("discount").default(0).notNull(),
  totalPrice: int("totalPrice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = typeof saleItems.$inferInsert;

// ============= ORDENS DE SERVIÇO =============
export const serviceOrders = mysqlTable("serviceOrders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  technicianId: int("technicianId"), // Técnico responsável
  deviceType: varchar("deviceType", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  imei: varchar("imei", { length: 20 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  defect: text("defect").notNull(), // Defeito relatado
  diagnosis: text("diagnosis"), // Diagnóstico técnico
  solution: text("solution"), // Solução aplicada
  status: mysqlEnum("status", ["aberta", "em_diagnostico", "aguardando_aprovacao", "em_reparo", "concluida", "cancelada", "aguardando_retirada"]).default("aberta").notNull(),
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
  estimatedCost: int("estimatedCost"), // Orçamento em centavos
  finalCost: int("finalCost"), // Custo final em centavos
  approved: boolean("approved").default(false).notNull(),
  approvedAt: timestamp("approvedAt"),
  warrantyDays: int("warrantyDays").default(90).notNull(),
  warrantyExpiry: timestamp("warrantyExpiry"),
  notes: text("notes"),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = typeof serviceOrders.$inferInsert;

// ============= PEÇAS UTILIZADAS NA OS =============
export const serviceOrderParts = mysqlTable("serviceOrderParts", {
  id: int("id").autoincrement().primaryKey(),
  serviceOrderId: int("serviceOrderId").notNull(),
  productId: int("productId").notNull(),
  stockItemId: int("stockItemId"),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
  totalPrice: int("totalPrice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceOrderPart = typeof serviceOrderParts.$inferSelect;
export type InsertServiceOrderPart = typeof serviceOrderParts.$inferInsert;

// ============= FINANCEIRO - CONTAS A PAGAR =============
export const accountsPayable = mysqlTable("accountsPayable", {
  id: int("id").autoincrement().primaryKey(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }), // Categoria de despesa
  costCenter: varchar("costCenter", { length: 100 }), // Centro de custo
  supplier: varchar("supplier", { length: 255 }),
  amount: int("amount").notNull(), // Valor em centavos
  dueDate: timestamp("dueDate").notNull(),
  paymentDate: timestamp("paymentDate"),
  status: mysqlEnum("status", ["pendente", "pago", "atrasado", "cancelado"]).default("pendente").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountPayable = typeof accountsPayable.$inferInsert;

// ============= FINANCEIRO - CONTAS A RECEBER =============
export const accountsReceivable = mysqlTable("accountsReceivable", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId"),
  description: text("description").notNull(),
  amount: int("amount").notNull(), // Valor em centavos
  dueDate: timestamp("dueDate").notNull(),
  paymentDate: timestamp("paymentDate"),
  status: mysqlEnum("status", ["pendente", "recebido", "atrasado", "cancelado"]).default("pendente").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  referenceType: varchar("referenceType", { length: 50 }), // venda, os
  referenceId: int("referenceId"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountReceivable = typeof accountsReceivable.$inferInsert;

// ============= TRANSAÇÕES DE CAIXA =============
export const cashTransactions = mysqlTable("cashTransactions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["entrada", "saida"]).notNull(),
  category: varchar("category", { length: 100 }),
  amount: int("amount").notNull(), // Valor em centavos
  description: text("description").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  userId: int("userId").notNull(),
  transactionDate: timestamp("transactionDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CashTransaction = typeof cashTransactions.$inferSelect;
export type InsertCashTransaction = typeof cashTransactions.$inferInsert;

// ============= CAMPANHAS DE MARKETING =============
export const marketingCampaigns = mysqlTable("marketingCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["email", "sms", "whatsapp", "push"]).notNull(),
  targetSegment: varchar("targetSegment", { length: 100 }), // Segmento alvo
  message: text("message").notNull(),
  status: mysqlEnum("status", ["rascunho", "agendada", "enviada", "cancelada"]).default("rascunho").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  recipientsCount: int("recipientsCount").default(0).notNull(),
  openedCount: int("openedCount").default(0).notNull(),
  clickedCount: int("clickedCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;

// ============= NOTIFICAÇÕES =============
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  customerId: int("customerId"),
  type: varchar("type", { length: 50 }).notNull(), // os_status, payment_reminder, etc
  title: text("title").notNull(),
  message: text("message").notNull(),
  channel: mysqlEnum("channel", ["sistema", "email", "sms", "whatsapp"]).notNull(),
  status: mysqlEnum("status", ["pendente", "enviada", "falha"]).default("pendente").notNull(),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============= CONFIGURAÇÕES DO SISTEMA =============
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// ============= LOGS DE AUDITORIA =============
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // create, update, delete
  entity: varchar("entity", { length: 100 }).notNull(), // sale, product, customer, etc
  entityId: int("entityId"),
  changes: text("changes"), // JSON com as mudanças
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
