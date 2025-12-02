/**
 * Painel Admin Master - Gerenciar todos os tenants (clientes) do sistema SaaS
 * Acesso restrito apenas para usuários com role "master_admin"
 */

import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ban,
  Activity,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AdminMaster() {
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);

  // Queries
  const { data: metrics, isLoading: metricsLoading } = trpc.adminMaster.getMetrics.useQuery();
  const { data: tenants, isLoading: tenantsLoading, refetch: refetchTenants } = trpc.adminMaster.getTenants.useQuery();
  const { data: clientGrowth } = trpc.adminMaster.getClientGrowth.useQuery();
  const { data: monthlyRevenue } = trpc.adminMaster.getMonthlyRevenue.useQuery();

  // Mutations
  const activateMutation = trpc.adminMaster.activateTenant.useMutation({
    onSuccess: () => {
      refetchTenants();
      alert("Tenant ativado com sucesso!");
    },
  });

  const deactivateMutation = trpc.adminMaster.deactivateTenant.useMutation({
    onSuccess: () => {
      refetchTenants();
      alert("Tenant desativado com sucesso!");
    },
  });

  const cancelMutation = trpc.adminMaster.cancelTenant.useMutation({
    onSuccess: () => {
      refetchTenants();
      alert("Tenant cancelado com sucesso!");
    },
  });

  const handleActivate = (tenantId: number) => {
    if (confirm("Tem certeza que deseja ativar este tenant?")) {
      activateMutation.mutate({ tenantId });
    }
  };

  const handleDeactivate = (tenantId: number) => {
    if (confirm("Tem certeza que deseja suspender este tenant?")) {
      deactivateMutation.mutate({ tenantId });
    }
  };

  const handleCancel = (tenantId: number) => {
    if (confirm("Tem certeza que deseja cancelar este tenant? Esta ação não pode ser desfeita.")) {
      cancelMutation.mutate({ tenantId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Ativo</Badge>;
      case "trial":
        return <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" /> Trial</Badge>;
      case "suspended":
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" /> Suspenso</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (metricsLoading || tenantsLoading) {
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
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-3xl font-bold mt-1">{metrics?.totalClients || 0}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{metrics?.activeClients || 0}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">MRR (Receita Mensal)</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600">
                R$ {metrics?.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Novos este Mês</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">{metrics?.newThisMonth || 0}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crescimento de Clientes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Crescimento de Clientes (Últimos 6 Meses)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={clientGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Receita Mensal */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Receita Mensal (Últimos 6 Meses)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Lista de Tenants */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Todos os Clientes (Tenants)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Subdomínio</th>
                <th className="text-left p-3">Plano</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Criado em</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants && tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{tenant.id}</td>
                    <td className="p-3 font-medium">{tenant.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {tenant.subdomain}.cellsync.com
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{tenant.planName}</Badge>
                    </td>
                    <td className="p-3">{getStatusBadge(tenant.status)}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        {tenant.status === "suspended" || tenant.status === "cancelled" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivate(tenant.id)}
                            disabled={activateMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Ativar
                          </Button>
                        ) : null}
                        
                        {tenant.status === "active" || tenant.status === "trial" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivate(tenant.id)}
                            disabled={deactivateMutation.isPending}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspender
                          </Button>
                        ) : null}
                        
                        {tenant.status !== "cancelled" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancel(tenant.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h4 className="font-semibold mb-2">ARR (Receita Anual)</h4>
          <p className="text-2xl font-bold text-green-600">
            R$ {metrics?.arr.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
          </p>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-2">Taxa de Churn</h4>
          <p className="text-2xl font-bold text-red-600">{metrics?.churnRate || 0}%</p>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-2">Ticket Médio</h4>
          <p className="text-2xl font-bold text-blue-600">
            R${" "}
            {metrics && metrics.activeClients > 0
              ? (metrics.mrr / metrics.activeClients).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })
              : "0,00"}
          </p>
        </Card>
      </div>
    </div>
  );
}
