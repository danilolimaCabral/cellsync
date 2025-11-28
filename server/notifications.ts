/**
 * Sistema de Notificações Automáticas
 * Gerencia alertas de estoque baixo, OS vencidas, contas a pagar, etc.
 */

import { getDb } from "./db";
import { notifications, products, serviceOrders, accountsPayable, sales } from "../drizzle/schema";
import { eq, and, lt, lte, gte, sql } from "drizzle-orm";

/**
 * Tipos de notificações suportadas
 */
export type NotificationType =
  | "estoque_baixo"
  | "os_vencida"
  | "conta_pagar_vencendo"
  | "meta_vendas_atingida"
  | "aniversario_cliente"
  | "nfe_emitida";

/**
 * Criar notificação no sistema
 */
export async function createNotification(data: {
  userId?: number;
  customerId?: number;
  type: string;
  title: string;
  message: string;
  channel?: "sistema" | "email" | "sms" | "whatsapp";
  referenceType?: string;
  referenceId?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [notification] = await db.insert(notifications).values({
    ...data,
    channel: data.channel || "sistema",
    status: "pendente",
  });
  return notification;
}

/**
 * Verificar produtos com estoque baixo e criar alertas
 */
export async function checkLowStockAlerts() {
  const db = await getDb();
  if (!db) return [];
  
  const lowStockProducts = await db
    .select()
    .from(products)
    .where(lte(products.currentStock, 15));

  const alerts = [];
  for (const product of lowStockProducts) {
    const notification = await createNotification({
      type: "estoque_baixo",
      title: "⚠️ Estoque Baixo",
      message: `O produto "${product.name}" está com apenas ${product.currentStock} unidades em estoque.`,
      channel: "sistema",
      referenceType: "product",
      referenceId: product.id,
    });
    alerts.push(notification);
  }

  return alerts;
}

/**
 * Verificar OS com prazo vencido
 */
export async function checkOverdueServiceOrders() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const overdueOrders = await db
    .select()
    .from(serviceOrders)
    .where(
      and(
        lt(serviceOrders.openedAt, now),
        sql`${serviceOrders.status} = 'em_reparo'`
      )
    );

  const alerts = [];
  for (const order of overdueOrders) {
    const notification = await createNotification({
      type: "os_vencida",
      title: "🔴 OS Vencida",
      message: `A Ordem de Serviço #${order.id} está em reparo desde ${order.openedAt?.toLocaleDateString("pt-BR")} e precisa de atenção.`,
      channel: "sistema",
      referenceType: "service_order",
      referenceId: order.id,
      customerId: order.customerId,
    });
    alerts.push(notification);
  }

  return alerts;
}

/**
 * Verificar contas a pagar próximas do vencimento (próximos 7 dias)
 */
export async function checkUpcomingPayments() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const upcomingPayments = await db
    .select()
    .from(accountsPayable)
    .where(
      and(
        eq(accountsPayable.status, "pendente"),
        gte(accountsPayable.dueDate, now),
        lte(accountsPayable.dueDate, sevenDaysFromNow)
      )
    );

  const alerts = [];
  for (const payment of upcomingPayments) {
    const daysUntilDue = Math.ceil(
      (payment.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const notification = await createNotification({
      type: "conta_pagar_vencendo",
      title: "💰 Conta a Pagar Vencendo",
      message: `A conta "${payment.description}" no valor de R$ ${(payment.amount / 100).toFixed(2)} vence em ${daysUntilDue} dia(s).`,
      channel: "sistema",
      referenceType: "financial_transaction",
      referenceId: payment.id,
    });
    alerts.push(notification);
  }

  return alerts;
}

/**
 * Verificar se vendedor atingiu meta de vendas do mês
 */
export async function checkSalesGoals(userId: number, monthlyGoal: number) {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = await db
    .select({
      total: sql<number>`SUM(${sales.totalAmount})`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.sellerId, userId),
        gte(sales.createdAt, firstDayOfMonth),
        lte(sales.createdAt, lastDayOfMonth)
      )
    );

  const totalSales = result[0]?.total || 0;

  if (totalSales >= monthlyGoal) {
    const notification = await createNotification({
      userId,
      type: "meta_vendas_atingida",
      title: "🎉 Meta Atingida!",
      message: `Parabéns! Você atingiu sua meta de vendas do mês com R$ ${totalSales.toFixed(2)}.`,
      channel: "sistema",
    });
    return notification;
  }

  return null;
}

/**
 * Executar todas as verificações automáticas
 */
export async function runAutomatedChecks() {
  console.log("[Notifications] Running automated checks...");

  const results = {
    lowStock: await checkLowStockAlerts(),
    overdueOrders: await checkOverdueServiceOrders(),
    upcomingPayments: await checkUpcomingPayments(),
  };

  console.log(`[Notifications] Created ${results.lowStock.length} low stock alerts`);
  console.log(`[Notifications] Created ${results.overdueOrders.length} overdue OS alerts`);
  console.log(`[Notifications] Created ${results.upcomingPayments.length} upcoming payment alerts`);

  return results;
}

/**
 * Marcar notificação como lida
 */
export async function markAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

/**
 * Marcar todas as notificações do usuário como lidas
 */
export async function markAllAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), sql`${notifications.readAt} IS NULL`));
}

/**
 * Buscar notificações não lidas do usuário
 */
export async function getUnreadNotifications(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [sql`${notifications.readAt} IS NULL`];
  if (userId) {
    conditions.push(eq(notifications.userId, userId));
  }

  return await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(sql`${notifications.createdAt} DESC`)
    .limit(50);
}

/**
 * Buscar todas as notificações do usuário
 */
export async function getAllNotifications(userId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = userId ? [eq(notifications.userId, userId)] : [];

  return await db
    .select()
    .from(notifications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${notifications.createdAt} DESC`)
    .limit(limit);
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(notifications).where(eq(notifications.id, notificationId));
}
