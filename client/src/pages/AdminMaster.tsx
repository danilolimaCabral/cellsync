/**
 * Painel Admin Master - Gerenciar todos os tenants (clientes) do sistema SaaS
 * Acesso restrito apenas para usuários com role "master_admin"
 */

import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ban,
  Activity,
  Search,
  Eye,
  RefreshCw,
  Calendar,
  Store,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminMaster() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.tenantManagement.stats.useQuery();
  const { data: tenantsData, isLoading: tenantsLoading, refetch } = trpc.tenantManagement.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter as any,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: tenantDetails } = trpc.tenantManagement.getById.useQuery(
    { id: selectedTenantId! },
    { enabled: !!selectedTenantId }
  );

  // Mutations
  const suspendMutation = trpc.tenantManagement.suspend.useMutation({
    onSuccess: () => {
      toast.success("Tenant suspenso com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao suspender tenant", { description: error.message });
    },
  });

  const reactivateMutation = trpc.tenantManagement.reactivate.useMutation({
    onSuccess: () => {
      toast.success("Tenant reativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao reativar tenant", { description: error.message });
    },
  });

  const updateStatusMutation = trpc.tenantManagement.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status", { description: error.message });
    },
  });

  const handleSuspend = (tenantId: number) => {
    if (confirm("Tem certeza que deseja suspender este tenant?")) {
      suspendMutation.mutate({ id: tenantId });
    }
  };

  const handleReactivate = (tenantId: number) => {
    if (confirm("Tem certeza que deseja reativar este tenant?")) {
      reactivateMutation.mutate({ id: tenantId });
    }
  };

  const getStatusBadge = (status: string, daysUntilTrialEnd?: number | null) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" /> Ativo
          </Badge>
        );
      case "trial":
        const isExpiring = daysUntilTrialEnd !== null && daysUntilTrialEnd !== undefined && daysUntilTrialEnd <= 3;
        return (
          <Badge className={`${isExpiring ? "bg-orange-500" : "bg-blue-500"} text-white`}>
            <Activity className="w-3 h-3 mr-1" /> Trial
            {daysUntilTrialEnd !== null && daysUntilTrialEnd !== undefined && (
              <span className="ml-1">({daysUntilTrialEnd}d)</span>
            )}
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" /> Suspenso
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="w-3 h-3 mr-1" /> Cancelado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (statsLoading || tenantsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando painel admin master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Painel Admin Master
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento completo de todos os clientes (tenants) do sistema
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Tenants</p>
              <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {stats?.byStatus.find(s => s.status === "active")?.count || 0}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Em Trial</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">
                {stats?.byStatus.find(s => s.status === "trial")?.count || 0}
              </p>
            </div>
            <Activity className="w-10 h-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trials Expirando</p>
              <p className="text-3xl font-bold mt-1 text-orange-600">
                {stats?.expiringTrials || 0}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Próximos 7 dias</p>
        </Card>
      </div>

      {/* Distribuição por Plano */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribuição por Plano</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats?.byPlan.map((plan) => (
            <div key={plan.planId} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">{plan.planName}</p>
                <p className="text-2xl font-bold text-purple-600">{plan.count}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          ))}
        </div>
      </Card>

      {/* Filtros e Busca */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome ou subdomínio..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => {
                setStatusFilter(value === "all" ? undefined : value);
                setPage(1);
              }}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter(undefined);
                setPage(1);
              }}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Tenants */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Todos os Tenants ({tenantsData?.pagination.total || 0})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Subdomínio</th>
                <th className="text-left p-3">Plano</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Usuários</th>
                <th className="text-left p-3">Criado em</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenantsData && tenantsData.tenants.length > 0 ? (
                tenantsData.tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{tenant.id}</td>
                    <td className="p-3 font-medium">{tenant.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {tenant.subdomain}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{tenant.planName}</Badge>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(tenant.status, tenant.daysUntilTrialEnd)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{tenant.userCount}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTenantId(tenant.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {tenant.status === "suspended" || tenant.status === "cancelled" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReactivate(tenant.id)}
                            disabled={reactivateMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspend(tenant.id)}
                            disabled={suspendMutation.isPending}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhum tenant encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {tenantsData && tenantsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Página {tenantsData.pagination.page} de {tenantsData.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= tenantsData.pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialog de Detalhes do Tenant */}
      <Dialog open={!!selectedTenantId} onOpenChange={() => setSelectedTenantId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Tenant</DialogTitle>
            <DialogDescription>
              Informações completas sobre o tenant selecionado
            </DialogDescription>
          </DialogHeader>

          {tenantDetails && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-medium">{tenantDetails.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Subdomínio</Label>
                  <p className="font-medium">{tenantDetails.subdomain}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plano</Label>
                  <Badge variant="outline">{tenantDetails.planName}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(tenantDetails.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Criado em</Label>
                  <p>{new Date(tenantDetails.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                {tenantDetails.trialEndsAt && (
                  <div>
                    <Label className="text-muted-foreground">Trial termina em</Label>
                    <p>{new Date(tenantDetails.trialEndsAt).toLocaleString("pt-BR")}</p>
                  </div>
                )}
              </div>

              {/* Usuários */}
              <div>
                <h4 className="font-semibold mb-3">Usuários ({tenantDetails.users.length})</h4>
                <div className="space-y-2">
                  {tenantDetails.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        {user.active ? (
                          <Badge className="bg-green-500">Ativo</Badge>
                        ) : (
                          <Badge className="bg-gray-500">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
