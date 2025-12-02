import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Sistema CellSync - Schema completo do banco de dados
 * Inclui todos os módulos: Usuários, Vendas, Estoque, OS, Financeiro, CRM e BI
 * + Sistema Multi-Tenant com Stripe
 */

// ============= MULTI-TENANT (SaaS) =============
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Nome da empresa cliente
  subdomain: varchar("subdomain", { length: 63 }).notNull().unique(), // cliente.cellsync.com
  customDomain: varchar("customDomain", { length: 255 }), // domínio personalizado
  logo: text("logo"), // URL do logo
  planId: int("plan_id").notNull(), // Referência ao plano
  status: mysqlEnum("status", ["active", "suspended", "cancelled", "trial"]).default("trial").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }), // ID do cliente no Stripe
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }), // ID da assinatura no Stripe
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Básico, Profissional, Empresarial
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  priceMonthly: int("price_monthly").notNull(), // Preço em centavos (9700 = R$ 97,00)
  priceYearly: int("price_yearly"), // Preço anual em centavos (com desconto)
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  maxUsers: int("max_users").default(1).notNull(), // Limite de usuários
  maxProducts: int("max_products").default(500).notNull(), // Limite de produtos
  maxStorage: int("max_storage").default(1024).notNull(), // Limite de armazenamento em MB
  features: json("features"), // Array de features: ["ia", "etiquetas", "relatorios"]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// ============= USUÁRIOS E AUTENTICAÇÃO =============
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Hash bcrypt
  name: text("name").notNull(),
  role: mysqlEnum("role", ["admin", "vendedor", "tecnico", "gerente", "master_admin"]).default("vendedor").notNull(),
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
  fantasyName: varchar("fantasyName", { length: 255 }), // Nome fantasia
  email: varchar("email", { length: 320 }),
  email2: varchar("email2", { length: 320 }), // Email alternativo
  phone: varchar("phone", { length: 20 }),
  phone2: varchar("phone2", { length: 20 }), // Telefone alternativo
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  rg: varchar("rg", { length: 20 }), // RG
  stateRegistration: varchar("stateRegistration", { length: 50 }), // Inscrição Estadual
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
  grade: varchar("grade", { length: 50 }), // Grade (tamanho/memória)
  sku: varchar("sku", { length: 100 }).unique(),
  barcode: varchar("barcode", { length: 100 }),
  costPrice: int("costPrice").notNull(), // Preço em centavos
  salePrice: int("salePrice").notNull(), // Preço em centavos
  wholesalePrice: int("wholesalePrice"), // Preço de atacado em centavos (opcional)
  minWholesaleQty: int("minWholesaleQty").default(5), // Quantidade mínima para atacado
  minStock: int("minStock").default(10).notNull(),
  currentStock: int("currentStock").default(0).notNull(),
  requiresImei: boolean("requiresImei").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  supplier: varchar("supplier", { length: 255 }), // Fornecedor
  warehouse: varchar("warehouse", { length: 100 }), // Almoxarifado
  entryDate: timestamp("entryDate"), // Data de entrada
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
  batteryHealth: int("batteryHealth"), // % de saúde da bateria
  hasDefect: boolean("hasDefect").default(false), // Tem defeito?
  readyForSale: boolean("readyForSale").default(true), // Apto para venda?
  stockType: varchar("stockType", { length: 50 }), // Tipo de estoque
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
  saleType: mysqlEnum("saleType", ["retail", "wholesale"]).default("retail").notNull(), // Tipo de venda
  appliedDiscount: int("appliedDiscount").default(0).notNull(), // Desconto total aplicado em centavos
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
  unitPriceType: mysqlEnum("unitPriceType", ["retail", "wholesale"]).default("retail").notNull(), // Tipo de preço aplicado
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

// ============= COMISSÕES DE VENDEDORES =============
export const commissionRules = mysqlTable("commissionRules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Vendedor
  name: text("name").notNull(), // Nome da regra
  type: mysqlEnum("type", ["percentual_fixo", "meta_progressiva", "bonus_produto"]).notNull(),
  active: boolean("active").default(true).notNull(),
  
  // Para percentual fixo
  percentage: int("percentage"), // Percentual em centésimos (ex: 500 = 5%)
  
  // Para meta progressiva
  minSalesAmount: int("minSalesAmount"), // Valor mínimo de vendas em centavos
  maxSalesAmount: int("maxSalesAmount"), // Valor máximo de vendas em centavos
  
  // Para bônus por produto
  productId: int("productId"), // Produto específico
  bonusAmount: int("bonusAmount"), // Valor fixo de bônus em centavos
  bonusPercentage: int("bonusPercentage"), // Ou percentual adicional
  
  priority: int("priority").default(0).notNull(), // Ordem de aplicação das regras
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommissionRule = typeof commissionRules.$inferSelect;
export type InsertCommissionRule = typeof commissionRules.$inferInsert;

export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Vendedor
  saleId: int("saleId"), // Venda relacionada (opcional para comissões manuais)
  amount: int("amount").notNull(), // Valor da comissão em centavos
  baseAmount: int("baseAmount").notNull(), // Valor base para cálculo (valor da venda)
  percentage: int("percentage"), // Percentual aplicado
  ruleId: int("ruleId"), // Regra que gerou a comissão
  status: mysqlEnum("status", ["pendente", "aprovada", "paga", "cancelada"]).default("pendente").notNull(),
  approvedBy: int("approvedBy"), // Gerente que aprovou
  approvedAt: timestamp("approvedAt"),
  paidAt: timestamp("paidAt"),
  paymentId: int("paymentId"), // Referência ao pagamento no financeiro
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

// Tabela de Notas Fiscais Eletrônicas
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId"), // Venda relacionada (opcional para NF-e avulsa)
  number: int("number").notNull(), // Número da NF-e
  series: int("series").notNull().default(1), // Série da NF-e
  model: varchar("model", { length: 2 }).notNull().default("55"), // Modelo (55=NF-e, 65=NFC-e)
  type: mysqlEnum("type", ["saida", "entrada"]).default("saida").notNull(),
  status: mysqlEnum("status", ["rascunho", "emitida", "cancelada", "inutilizada", "erro"]).default("rascunho").notNull(),
  
  // Dados do Emitente (sua empresa)
  emitterCnpj: varchar("emitterCnpj", { length: 18 }).notNull(),
  emitterName: varchar("emitterName", { length: 255 }).notNull(),
  emitterFantasyName: varchar("emitterFantasyName", { length: 255 }),
  emitterAddress: text("emitterAddress"),
  emitterCity: varchar("emitterCity", { length: 100 }),
  emitterState: varchar("emitterState", { length: 2 }),
  emitterZipCode: varchar("emitterZipCode", { length: 10 }),
  
  // Dados do Destinatário (cliente)
  recipientDocument: varchar("recipientDocument", { length: 18 }).notNull(), // CPF ou CNPJ
  recipientName: varchar("recipientName", { length: 255 }).notNull(),
  recipientAddress: text("recipientAddress"),
  recipientCity: varchar("recipientCity", { length: 100 }),
  recipientState: varchar("recipientState", { length: 2 }),
  recipientZipCode: varchar("recipientZipCode", { length: 10 }),
  recipientPhone: varchar("recipientPhone", { length: 20 }),
  recipientEmail: varchar("recipientEmail", { length: 255 }),
  
  // Valores Totais (em centavos)
  totalProducts: int("totalProducts").notNull().default(0), // Total dos produtos
  totalDiscount: int("totalDiscount").notNull().default(0), // Total de descontos
  totalFreight: int("totalFreight").notNull().default(0), // Valor do frete
  totalInsurance: int("totalInsurance").notNull().default(0), // Valor do seguro
  totalOtherExpenses: int("totalOtherExpenses").notNull().default(0), // Outras despesas
  totalIcms: int("totalIcms").notNull().default(0), // Total de ICMS
  totalIpi: int("totalIpi").notNull().default(0), // Total de IPI
  totalPis: int("totalPis").notNull().default(0), // Total de PIS
  totalCofins: int("totalCofins").notNull().default(0), // Total de COFINS
  totalInvoice: int("totalInvoice").notNull().default(0), // Valor total da NF-e
  
  // Dados Fiscais
  cfop: varchar("cfop", { length: 4 }).notNull(), // CFOP (ex: 5102)
  natureOperation: varchar("natureOperation", { length: 60 }).notNull(), // Natureza da operação
  paymentMethod: mysqlEnum("paymentMethod", ["dinheiro", "cheque", "cartao_credito", "cartao_debito", "credito_loja", "vale_alimentacao", "vale_refeicao", "vale_presente", "vale_combustivel", "boleto", "deposito", "pix", "sem_pagamento", "outros"]).notNull(),
  paymentIndicator: mysqlEnum("paymentIndicator", ["a_vista", "a_prazo", "outros"]).notNull(),
  
  // Dados da SEFAZ
  accessKey: varchar("accessKey", { length: 44 }), // Chave de acesso da NF-e
  protocol: varchar("protocol", { length: 20 }), // Protocolo de autorização
  authorizationDate: timestamp("authorizationDate"), // Data de autorização
  xmlUrl: text("xmlUrl"), // URL do XML no S3
  danfeUrl: text("danfeUrl"), // URL do DANFE (PDF) no S3
  
  // Cancelamento
  cancelReason: text("cancelReason"),
  canceledAt: timestamp("canceledAt"),
  cancelProtocol: varchar("cancelProtocol", { length: 20 }),
  
  // Observações
  additionalInfo: text("additionalInfo"),
  internalNotes: text("internalNotes"),
  
  // Auditoria
  issuedBy: int("issuedBy").notNull(), // Usuário que emitiu
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// Tabela de Itens da Nota Fiscal
export const invoiceItems = mysqlTable("invoiceItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  productId: int("productId"),
  
  // Dados do Produto
  code: varchar("code", { length: 50 }), // Código do produto
  ean: varchar("ean", { length: 14 }), // Código de barras EAN
  description: varchar("description", { length: 255 }).notNull(),
  ncm: varchar("ncm", { length: 8 }).notNull(), // NCM (Nomenclatura Comum do Mercosul)
  cest: varchar("cest", { length: 7 }), // CEST (Código Especificador da Substituição Tributária)
  cfop: varchar("cfop", { length: 4 }).notNull(),
  unit: varchar("unit", { length: 10 }).notNull().default("UN"), // Unidade (UN, PC, KG, etc)
  quantity: int("quantity").notNull(), // Quantidade em centésimos (ex: 150 = 1.5)
  unitPrice: int("unitPrice").notNull(), // Preço unitário em centavos
  totalPrice: int("totalPrice").notNull(), // Preço total em centavos
  discount: int("discount").notNull().default(0), // Desconto em centavos
  
  // Impostos
  icmsOrigin: varchar("icmsOrigin", { length: 1 }).notNull().default("0"), // Origem da mercadoria
  icmsCst: varchar("icmsCst", { length: 3 }).notNull(), // CST do ICMS
  icmsBase: int("icmsBase").notNull().default(0), // Base de cálculo do ICMS
  icmsRate: int("icmsRate").notNull().default(0), // Alíquota do ICMS (em centésimos de %)
  icmsValue: int("icmsValue").notNull().default(0), // Valor do ICMS
  
  ipiCst: varchar("ipiCst", { length: 2 }), // CST do IPI
  ipiBase: int("ipiBase").notNull().default(0),
  ipiRate: int("ipiRate").notNull().default(0),
  ipiValue: int("ipiValue").notNull().default(0),
  
  pisCst: varchar("pisCst", { length: 2 }).notNull(), // CST do PIS
  pisBase: int("pisBase").notNull().default(0),
  pisRate: int("pisRate").notNull().default(0),
  pisValue: int("pisValue").notNull().default(0),
  
  cofinsCst: varchar("cofinsCst", { length: 2 }).notNull(), // CST do COFINS
  cofinsBase: int("cofinsBase").notNull().default(0),
  cofinsRate: int("cofinsRate").notNull().default(0),
  cofinsValue: int("cofinsValue").notNull().default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

// ============= ANALYTICS DO CHATBOT =============
export const chatbotConversations = mysqlTable("chatbot_conversations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(), // UUID da sessão
  userId: int("user_id"), // Null se visitante anônimo
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  messageCount: int("message_count").default(0).notNull(),
  duration: int("duration").default(0), // Duração em segundos
  converted: boolean("converted").default(false).notNull(), // Se houve conversão (clique em CTA)
  conversionType: varchar("conversion_type", { length: 50 }), // "trial", "demo", "contact"
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = typeof chatbotConversations.$inferInsert;

export const chatbotMessages = mysqlTable("chatbot_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversation_id").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  responseTime: int("response_time"), // Tempo de resposta em ms (apenas para assistant)
  sentimentScore: int("sentiment_score"), // -100 a 100 (negativo a positivo)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = typeof chatbotMessages.$inferInsert;

export const chatbotEvents = mysqlTable("chatbot_events", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversation_id").notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // "cta_click", "link_click", "chat_closed"
  eventData: json("event_data"), // Dados adicionais do evento
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChatbotEvent = typeof chatbotEvents.$inferSelect;
export type InsertChatbotEvent = typeof chatbotEvents.$inferInsert;
