import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Notificacoes() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const utils = trpc.useUtils();
  const { user } = useAuth();

  // Query para buscar notificações
  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery({
    unreadOnly: filter === "unread",
    limit: 100,
  }, {
    enabled: !!user,
  });

  // Query para contador de não lidas
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
  });
  const unreadCount = unreadData?.count || 0;

  // Mutation para marcar como lida
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Todas as notificações foram marcadas como lidas");
    },
  });

  // Mutation para deletar
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Notificação removida");
    },
  });

  // Mutation para executar alertas (admin)
  const runAlertsMutation = trpc.notifications.runAlerts.useMutation({
    onSuccess: (data) => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      const total =
        data.results.lowStock.length +
        data.results.overdueOrders.length +
        data.results.upcomingPayments.length;
      toast.success(`${total} novos alertas criados`);
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: number) => {
    deleteMutation.mutate({ notificationId });
  };

  const handleRunAlerts = () => {
    runAlertsMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "estoque_baixo":
      case "low_stock":
        return "⚠️";
      case "os_vencida":
      case "overdue_os":
      case "overdue_os_summary":
        return "🔴";
      case "conta_pagar_vencendo":
      case "upcoming_payment":
        return "💰";
      case "meta_vendas_atingida":
        return "🎉";
      case "aniversario_cliente":
        return "🎂";
      case "nfe_emitida":
        return "📄";
      default:
        return "🔔";
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "estoque_baixo":
      case "low_stock":
        return "bg-yellow-100 text-yellow-800";
      case "os_vencida":
      case "overdue_os":
      case "overdue_os_summary":
        return "bg-red-100 text-red-800";
      case "conta_pagar_vencendo":
      case "upcoming_payment":
        return "bg-orange-100 text-orange-800";
      case "meta_vendas_atingida":
        return "bg-green-100 text-green-800";
      case "aniversario_cliente":
        return "bg-purple-100 text-purple-800";
      case "nfe_emitida":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("pt-BR");
  };

  const filteredNotifications = notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Central de Notificações</h1>
            <p className="text-muted-foreground">
              Gerencie todos os alertas e notificações do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRunAlerts}
            disabled={runAlertsMutation.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${runAlertsMutation.isPending ? "animate-spin" : ""}`}
            />
            Executar Alertas
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Não Lidas ({unreadCount})
        </Button>
      </div>

      {/* Lista de Notificações */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-16 w-16 mx-auto mb-4 opacity-20 animate-pulse" />
          <p>Carregando notificações...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma notificação</p>
            <p className="text-sm">
              {filter === "unread"
                ? "Você não tem notificações não lidas"
                : "Você não tem notificações"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification: any) => (
            <Card
              key={notification.id}
              className={`transition-all ${!notification.readAt ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        {!notification.readAt && (
                          <Badge variant="secondary" className="bg-blue-500 text-white">
                            Nova
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={getNotificationBadgeColor(notification.type)}
                      >
                        {notification.type.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.readAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Marcar como lida
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{notification.message}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>📅 {formatDate(notification.createdAt)}</span>
                  {notification.readAt && (
                    <span className="text-xs">
                      ✓ Lida em {formatDate(notification.readAt)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
