import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Database,
  Activity,
  TrendingUp,
  DollarSign,
  XCircle,
  Server,
  HardDrive,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminMaster() {
  const { user } = useAuth();

  // Queries
  const { data: systemStats, isLoading } = trpc.system.getStats.useQuery(
    {},
    { enabled: user?.role === "master_admin" }
  );

  const { data: tenantsList, isLoading: isLoadingTenants } = trpc.system.getAllTenants.useQuery(
    undefined,
    { enabled: user?.role === "master_admin" }
  );

  if (user?.role !== "master_admin") {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-slate-600">
              Apenas administradores master podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Admin Master"
        description="Painel de controle do sistema"
      />

      {/* Cards de Estatísticas do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total de Usuários
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {systemStats?.totalUsers || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Usuários cadastrados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Tenants Ativos
              </CardTitle>
              <Database className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {systemStats?.activeTenants || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Clientes ativos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Receita Mensal (MRR)
              </CardTitle>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                R$ {systemStats?.mrr?.toLocaleString("pt-BR") || "0,00"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Receita recorrente
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Taxa de Churn
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {systemStats?.churnRate || "0"}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cancelamentos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monitoramento de Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Monitoramento de Tenants
            </div>
            <Badge variant="outline" className="ml-2">
              {tenantsList?.length || 0} Clientes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">Empresa</th>
                  <th className="p-3 font-medium">Subdomínio</th>
                  <th className="p-3 font-medium">Plano</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Dono (Email)</th>
                  <th className="p-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTenants ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      Carregando clientes...
                    </td>
                  </tr>
                ) : tenantsList?.map((tenant) => (
                  <tr key={tenant.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">#{tenant.id}</td>
                    <td className="p-3">
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">{tenant.cnpj || "Sem CNPJ"}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {tenant.subdomain}
                      </Badge>
                    </td>
                    <td className="p-3">{tenant.planName || "Básico"}</td>
                    <td className="p-3">
                      <Badge 
                        className={
                          tenant.status === "active" ? "bg-green-500" :
                          tenant.status === "trial" ? "bg-blue-500" :
                          "bg-red-500"
                        }
                      >
                        {tenant.status === "active" ? "Ativo" :
                         tenant.status === "trial" ? "Trial" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {tenant.ownerEmail || "N/A"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {!isLoadingTenants && tenantsList?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Métricas do Servidor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-blue-600" />
            Métricas do Servidor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <Cpu className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-sm text-slate-600">Uso de CPU</p>
                <p className="text-2xl font-bold text-slate-900">
                  {systemStats?.serverMetrics?.cpu || "0"}%
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <HardDrive className="h-10 w-10 text-green-500" />
              <div>
                <p className="text-sm text-slate-600">Uso de Memória</p>
                <p className="text-2xl font-bold text-slate-900">
                  {systemStats?.serverMetrics?.memory || "0"}%
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <Activity className="h-10 w-10 text-purple-500" />
              <div>
                <p className="text-sm text-slate-600">Uptime</p>
                <p className="text-2xl font-bold text-slate-900">
                  {systemStats?.serverMetrics?.uptime || "0h"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Database className="h-6 w-6" />
              <span>Executar Backup</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Users className="h-6 w-6" />
              <span>Gerenciar Usuários</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Activity className="h-6 w-6" />
              <span>Logs do Sistema</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Painel Administrativo
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Este painel fornece acesso a funcionalidades avançadas de administração do sistema.
                Use com cuidado e apenas quando necessário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
