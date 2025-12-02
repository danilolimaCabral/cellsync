import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Package, CheckCircle, XCircle, Settings, Sparkles, Crown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(date));
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};

export default function GerenciarModulos() {
  const { user, loading } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [showInitDialog, setShowInitDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  // Queries
  const { data: tenants, refetch: refetchTenants } = trpc.modules.listTenantsWithModules.useQuery();
  const { data: allModules } = trpc.modules.listAll.useQuery();
  const { data: plans } = trpc.modules.listPlans.useQuery();
  const { data: tenantModules, refetch: refetchTenantModules } = trpc.modules.getTenantModules.useQuery(
    { tenantId: selectedTenant! },
    { enabled: !!selectedTenant }
  );

  // Mutations
  const seedModulesMutation = trpc.modules.seedModules.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setShowInitDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const seedPlansMutation = trpc.modules.seedPlans.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setShowInitDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const activateMutation = trpc.modules.activateModule.useMutation({
    onSuccess: () => {
      toast.success("Módulo ativado com sucesso!");
      refetchTenantModules();
      refetchTenants();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deactivateMutation = trpc.modules.deactivateModule.useMutation({
    onSuccess: () => {
      toast.success("Módulo desativado com sucesso!");
      refetchTenantModules();
      refetchTenants();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const applyPlanMutation = trpc.modules.applyPlan.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setShowPlanDialog(false);
      setSelectedPlan("");
      refetchTenantModules();
      refetchTenants();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || user.role !== "master_admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Acesso negado - Apenas Master Admin</p>
      </div>
    );
  }

  const handleInitialize = async () => {
    await seedModulesMutation.mutateAsync();
    await seedPlansMutation.mutateAsync();
  };

  const handleToggleModule = (tenantId: number, moduleCode: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      deactivateMutation.mutate({ tenantId, moduleCode });
    } else {
      activateMutation.mutate({ tenantId, moduleCode });
    }
  };

  const handleApplyPlan = () => {
    if (!selectedTenant || !selectedPlan) {
      toast.error("Selecione um tenant e um plano");
      return;
    }
    applyPlanMutation.mutate({
      tenantId: selectedTenant,
      planCode: selectedPlan,
    });
  };

  const selectedTenantData = tenants?.find(t => t.id === selectedTenant);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader
        title="Gerenciar Módulos e Permissões"
        description="Configure quais módulos cada cliente tem acesso"
        backTo="/admin-master"
      />

      {/* Ações Rápidas */}
      <div className="flex gap-4 mb-6">
        <Dialog open={showInitDialog} onOpenChange={setShowInitDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Inicializar Sistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inicializar Módulos e Planos</DialogTitle>
              <DialogDescription>
                Isso criará os módulos padrão e planos de assinatura no banco de dados.
                Execute apenas uma vez na primeira configuração.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Módulos que serão criados: PDV, Estoque, OS, Financeiro, Comissões, CRM, Relatórios BI, NF-e
              </p>
              <p className="text-sm text-muted-foreground">
                Planos que serão criados: Básico (R$ 99), Profissional (R$ 199), Enterprise (R$ 399)
              </p>
              <Button
                onClick={handleInitialize}
                disabled={seedModulesMutation.isPending || seedPlansMutation.isPending}
                className="w-full"
              >
                {seedModulesMutation.isPending || seedPlansMutation.isPending ? "Inicializando..." : "Inicializar Agora"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedTenant && (
          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogTrigger asChild>
              <Button>
                <Crown className="h-4 w-4 mr-2" />
                Aplicar Plano
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aplicar Plano ao Cliente</DialogTitle>
                <DialogDescription>
                  Selecione um plano para ativar automaticamente todos os módulos incluídos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cliente:</label>
                  <p className="text-sm text-muted-foreground">{selectedTenantData?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Plano:</label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.code}>
                          {plan.name} - {formatCurrency(plan.monthlyPrice)}/mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPlan && plans && (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm font-medium mb-2">Módulos incluídos:</p>
                    <div className="flex flex-wrap gap-2">
                      {plans.find(p => p.code === selectedPlan)?.modules.map((module: any) => (
                        <Badge key={module.id} variant="secondary">
                          {module.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleApplyPlan}
                  disabled={!selectedPlan || applyPlanMutation.isPending}
                  className="w-full"
                >
                  {applyPlanMutation.isPending ? "Aplicando..." : "Aplicar Plano"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tenants">Clientes e Módulos</TabsTrigger>
          <TabsTrigger value="plans">Planos Disponíveis</TabsTrigger>
          <TabsTrigger value="modules">Todos os Módulos</TabsTrigger>
        </TabsList>

        {/* Tab: Clientes e Módulos */}
        <TabsContent value="tenants">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes</CardTitle>
                <CardDescription>Selecione um cliente para gerenciar módulos</CardDescription>
              </CardHeader>
              <CardContent>
                {!tenants || tenants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum cliente encontrado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTenant === tenant.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedTenant(tenant.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{tenant.name}</h4>
                            <p className="text-sm text-muted-foreground">@{tenant.subdomain}</p>
                          </div>
                          <Badge variant={tenant.modulesCount > 0 ? "default" : "secondary"}>
                            {tenant.modulesCount} módulos
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Criado em {formatDate(tenant.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Módulos do Cliente Selecionado */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTenant ? `Módulos de ${selectedTenantData?.name}` : "Selecione um Cliente"}
                </CardTitle>
                <CardDescription>
                  {selectedTenant
                    ? "Ative ou desative módulos individualmente"
                    : "Escolha um cliente na lista ao lado"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedTenant ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">Selecione um cliente para gerenciar módulos</p>
                  </div>
                ) : !allModules || allModules.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">
                      Nenhum módulo encontrado. Inicialize o sistema primeiro.
                    </p>
                    <Button onClick={() => setShowInitDialog(true)} variant="outline" size="sm">
                      Inicializar Sistema
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allModules.map((module) => {
                      const tenantModule = tenantModules?.find(tm => tm.moduleId === module.id);
                      const isEnabled = tenantModule?.enabled || false;
                      const isExpired = tenantModule?.expiresAt && new Date(tenantModule.expiresAt) < new Date();

                      return (
                        <div
                          key={module.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isEnabled ? "bg-green-100" : "bg-gray-100"}`}>
                              {isEnabled ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium text-sm">{module.name}</h5>
                              <p className="text-xs text-muted-foreground">{module.description}</p>
                              {isExpired && (
                                <Badge variant="destructive" className="mt-1">
                                  Expirado
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isEnabled ? "destructive" : "default"}
                            onClick={() => handleToggleModule(selectedTenant, module.code, isEnabled)}
                            disabled={activateMutation.isPending || deactivateMutation.isPending}
                          >
                            {isEnabled ? "Desativar" : "Ativar"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Planos */}
        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {plan.code === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold">{formatCurrency(plan.monthlyPrice)}</p>
                      <p className="text-sm text-muted-foreground">por mês</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Módulos incluídos:</p>
                      <div className="flex flex-wrap gap-2">
                        {plan.modules.map((module: any) => (
                          <Badge key={module.id} variant="secondary">
                            {module.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Limites:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• {plan.maxUsers ? `${plan.maxUsers} usuários` : "Usuários ilimitados"}</li>
                        <li>• {plan.maxStorage ? `${plan.maxStorage / 1000}GB armazenamento` : "Armazenamento ilimitado"}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Todos os Módulos */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Módulos Disponíveis no Sistema</CardTitle>
              <CardDescription>Todos os módulos que podem ser ativados para clientes</CardDescription>
            </CardHeader>
            <CardContent>
              {!allModules || allModules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum módulo encontrado. Inicialize o sistema primeiro.
                  </p>
                  <Button onClick={() => setShowInitDialog(true)} variant="outline">
                    Inicializar Sistema
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allModules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-mono text-sm">{module.code}</TableCell>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{module.description}</TableCell>
                        <TableCell className="font-mono text-sm">{module.routePath}</TableCell>
                        <TableCell>
                          <Badge variant={module.active ? "default" : "secondary"}>
                            {module.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
