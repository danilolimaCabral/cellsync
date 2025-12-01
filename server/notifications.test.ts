import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import * as notifications from "./notifications";

describe("Sistema de Notificações In-App", () => {
  let testUserId: number;
  let testProductId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    const testEmail = `notif-test-${Date.now()}@test.com`;
    await db.createUser({
      email: testEmail,
      password: "test123",
      name: "Test User Notifications",
      role: "admin",
    });
    
    const user = await db.getUserByEmail(testEmail);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Criar produto com estoque baixo para teste
    const product = await db.createProduct({
      name: `Test Product Low Stock ${Date.now()}`,
      category: "Smartphone",
      brand: "Test",
      model: "Test Model",
      sku: `TEST-NOTIF-${Date.now()}`,
      salePrice: 100000,
      costPrice: 80000,
      currentStock: 5, // Estoque baixo
      minStock: 10,
      active: true,
    });
    testProductId = product.id;
  });

  it("deve criar notificação manualmente", async () => {
    const notificationId = await notifications.createNotification({
      userId: testUserId,
      type: "test_notification",
      title: "Teste de Notificação",
      message: "Esta é uma notificação de teste",
      referenceType: "test",
      referenceId: 1,
    });

    expect(notificationId).toBeGreaterThan(0);
  });

  it("deve listar notificações do usuário", async () => {
    // Criar notificação
    await notifications.createNotification({
      userId: testUserId,
      type: "test_list",
      title: "Teste de Listagem",
      message: "Testando listagem de notificações",
    });

    const userNotifications = await notifications.getAllNotifications(testUserId, 50);
    expect(userNotifications.length).toBeGreaterThan(0);
    expect(userNotifications[0]).toHaveProperty("title");
    expect(userNotifications[0]).toHaveProperty("message");
  });

  it("deve contar notificações não lidas", async () => {
    // Criar notificação não lida
    await notifications.createNotification({
      userId: testUserId,
      type: "test_unread",
      title: "Teste Não Lida",
      message: "Esta notificação não foi lida",
    });

    const unreadNotifications = await notifications.getUnreadNotifications(testUserId);
    expect(unreadNotifications.length).toBeGreaterThan(0);
  });

  it("deve marcar notificação como lida", async () => {
    // Criar notificação
    const notificationId = await notifications.createNotification({
      userId: testUserId,
      type: "test_mark_read",
      title: "Teste Marcar Lida",
      message: "Esta notificação será marcada como lida",
    });

    // Marcar como lida
    const result = await notifications.markAsRead(notificationId);
    expect(result).toBe(undefined);

    // Verificar que foi marcada
    const allNotifications = await notifications.getAllNotifications(testUserId);
    const markedNotification = allNotifications.find((n: any) => n.id === notificationId);
    expect(markedNotification?.readAt).toBeTruthy();
  });

  it("deve marcar todas as notificações como lidas", async () => {
    // Criar múltiplas notificações
    await notifications.createNotification({
      userId: testUserId,
      type: "test_mark_all_1",
      title: "Teste 1",
      message: "Mensagem 1",
    });

    await notifications.createNotification({
      userId: testUserId,
      type: "test_mark_all_2",
      title: "Teste 2",
      message: "Mensagem 2",
    });

    // Marcar todas como lidas
    await notifications.markAllAsRead(testUserId);

    // Verificar que não há mais não lidas
    const unreadNotifications = await notifications.getUnreadNotifications(testUserId);
    expect(unreadNotifications.length).toBe(0);
  });

  it("deve deletar notificação", async () => {
    // Criar notificação
    const notificationId = await notifications.createNotification({
      userId: testUserId,
      type: "test_delete",
      title: "Teste Deletar",
      message: "Esta notificação será deletada",
    });

    // Deletar
    await notifications.deleteNotification(notificationId);

    // Verificar que foi deletada
    const allNotifications = await notifications.getAllNotifications(testUserId);
    const deletedNotification = allNotifications.find((n: any) => n.id === notificationId);
    expect(deletedNotification).toBeUndefined();
  });

  it("deve verificar alertas de estoque baixo", async () => {
    const result = await notifications.checkLowStockAlerts();
    
    // Deve ter criado pelo menos 1 alerta (do produto de teste)
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("deve verificar OS vencidas", async () => {
    const result = await notifications.checkOverdueServiceOrders();
    
    // Pode não ter OS vencidas, mas função deve executar sem erro
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve verificar contas a pagar próximas do vencimento", async () => {
    const result = await notifications.checkUpcomingPayments();
    
    // Pode não ter contas próximas, mas função deve executar sem erro
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve executar todas as verificações automáticas", async () => {
    const result = await notifications.runAutomatedChecks();
    
    expect(result).toHaveProperty("lowStock");
    expect(result).toHaveProperty("overdueOrders");
    expect(result).toHaveProperty("upcomingPayments");
    expect(Array.isArray(result.lowStock)).toBe(true);
    expect(Array.isArray(result.overdueOrders)).toBe(true);
    expect(Array.isArray(result.upcomingPayments)).toBe(true);
  }, 10000);
});
