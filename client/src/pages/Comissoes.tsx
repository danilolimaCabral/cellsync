import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Users, Plus, Edit, Trash2, Info, CheckCircle2, Clock, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper para formatação de moeda brasileira
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};

export default function Comissoes() {
  const { user } = useAuth();
  const [showNewRule, setShowNewRule] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null);
  const [ruleType, setRuleType] = useState<string>("percentual_fixo");
  const [previewAmount, setPreviewAmount] = useState<number>(0);
  const [previewPercentage, setPreviewPercentage] = useState<number>(5);

  // Queries
  const utils = trpc.useUtils();
  const { data: users = [] } = trpc.users.list.useQuery({}, {
    enabled: !!user,
  });
  const { data: commissions = [] } = trpc.commissions.getPending.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: rules = [] } = trpc.commissions.listRules.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const createRuleMutation = trpc.commissions.createRule.useMutation({
    onSuccess: () => {
      toast.success("Regra de comissão criada com sucesso!");
      setShowNewRule(false);
      setEditingRule(null);
      utils.commissions.listRules.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });

  const updateRuleMutation = trpc.commissions.updateRule.useMutation({
    onSuccess: () => {
      toast.success("Regra atualizada com sucesso!");
      setEditingRule(null);
      utils.commissions.listRules.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar regra: ${error.message}`);
    },
  });

  const deleteRuleMutation = trpc.commissions.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("Regra excluída com sucesso!");
      setDeletingRuleId(null);
      utils.commissions.listRules.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir regra: ${error.message}`);
    },
  });

  const approveCommissionMutation = trpc.commissions.approve.useMutation({
    onSuccess: () => {
      toast.success("Comissão aprovada com sucesso!");
      utils.commissions.getPending.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Erro ao aprovar comissão: ${error.message}`);
    },
  });

  // Cálculos
  const totalPendente = commissions.reduce((sum, c) => sum + c.amount, 0);
  const totalComissoes = commissions.length;

  // Ranking de vendedores
  const ranking = users
    .map((u: any) => {
      const userCommissions = commissions.filter((c) => c.userId === u.id);
      const total = userCommissions.reduce((sum, c) => sum + c.amount, 0);
      return { id: u.id, name: u.name, totalComissoes: total, qtdComissoes: userCommissions.length };
    })
    .filter((u) => u.totalComissoes > 0)
    .sort((a, b) => b.totalComissoes - a.totalComissoes);

  // Preview de cálculo
  const calculatePreview = () => {
    return (previewAmount * previewPercentage) / 100;
  };

  const handleSubmitRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const ruleData = {
      userId: parseInt(formData.get("userId") as string),
      name: formData.get("name") as string,
      type: ruleType as "percentual_fixo" | "meta_progressiva" | "bonus_produto",
      percentage: parseFloat(formData.get("percentage") as string),
      active: true,
    };

    if (editingRule) {
      updateRuleMutation.mutate({
        ruleId: editingRule.id,
        ...ruleData,
      });
    } else {
      createRuleMutation.mutate(ruleData);
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case "percentual_fixo":
        return "Percentual Fixo";
      case "meta_progressiva":
        return "Meta Progressiva";
      case "bonus_produto":
        return "Bônus por Produto";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Controle de Comissões" 
          description="Gerencie regras, aprove pagamentos e acompanhe o desempenho da equipe"
          backTo="/dashboard"
        />
        <Dialog open={showNewRule || !!editingRule} onOpenChange={(open) => {
          setShowNewRule(open);
          if (!open) setEditingRule(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar" : "Nova"} Regra de Comissão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitRule} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="userId">Vendedor *</Label>
                  <Select name="userId" required defaultValue={editingRule?.userId?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Regra *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editingRule?.name}
                    placeholder="Ex: Comissão Padrão"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Comissão *</Label>
                  <Select 
                    value={ruleType} 
                    onValueChange={setRuleType}
                    defaultValue={editingRule?.type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual_fixo">Percentual Fixo</SelectItem>
                      <SelectItem value="meta_progressiva">Meta Progressiva</SelectItem>
                      <SelectItem value="bonus_produto">Bônus por Produto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentual (%) *</Label>
                  <div className="relative">
                    <Input
                      id="percentage"
                      name="percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      defaultValue={editingRule?.percentage || 5}
                      onChange={(e) => setPreviewPercentage(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 5.00"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Descrição do tipo */}
              <Card className="bg-blue-50/50 border-blue-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                    <Info className="h-4 w-4" />
                    Sobre {getRuleTypeLabel(ruleType)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-600/80">
                  {ruleType === "percentual_fixo" && (
                    <p>Aplica um percentual fixo sobre o valor total de cada venda realizada pelo vendedor.</p>
                  )}
                  {ruleType === "meta_progressiva" && (
                    <p>Percentual aumenta conforme o vendedor atinge metas de vendas mensais. Ideal para incentivar alto desempenho.</p>
                  )}
                  {ruleType === "bonus_produto" && (
                    <p>Comissão especial aplicada a produtos específicos ou categorias. Útil para impulsionar vendas de itens estratégicos.</p>
                  )}
                </CardContent>
              </Card>

              {/* Preview de Cálculo */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Simulador de Ganhos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Valor da Venda (Simulação)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          value={previewAmount}
                          onChange={(e) => setPreviewAmount(parseFloat(e.target.value) || 0)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <p className="text-xs text-green-600 font-medium mb-1">Comissão Estimada</p>
                      <p className="text-xl font-bold text-green-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatePreview())}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowNewRule(false);
                  setEditingRule(null);
                }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createRuleMutation.isPending || updateRuleMutation.isPending}>
                  {createRuleMutation.isPending || updateRuleMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {editingRule ? "Salvar Alterações" : "Criar Regra"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendente</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendente)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalComissoes} comissões aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendedores Ativos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{ranking.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              com comissões pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média por Vendedor</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {ranking.length > 0 
                ? formatCurrency(totalPendente / ranking.length)
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              comissão média
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendentes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-muted/50 p-1">
          <TabsTrigger value="pendentes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Comissões Pendentes
          </TabsTrigger>
          <TabsTrigger value="regras" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Regras de Comissão
          </TabsTrigger>
          <TabsTrigger value="ranking" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Ranking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Comissões Pendentes de Aprovação
              </CardTitle>
              <CardDescription>
                Aprove as comissões para liberar o pagamento aos vendedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-lg border border-dashed">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Tudo em dia!</h3>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Nenhuma comissão pendente de aprovação no momento.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Venda Ref.</TableHead>
                        <TableHead>Valor Base</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium">
                            {format(new Date(commission.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                                {commission.user?.name?.charAt(0).toUpperCase()}
                              </div>
                              {commission.user?.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              #{commission.saleId}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {/* Valor base não disponível na query atual, mas idealmente mostraria */}
                            -
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              {formatCurrency(commission.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => approveCommissionMutation.mutate({ id: commission.id })}
                              disabled={approveCommissionMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                Regras Configuradas
              </CardTitle>
              <CardDescription>
                Gerencie as porcentagens e regras de comissionamento por vendedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-lg border border-dashed">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Info className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Nenhuma regra configurada</h3>
                  <p className="text-sm text-gray-500 max-w-sm mt-1 mb-4">
                    Crie regras para automatizar o cálculo de comissões dos seus vendedores.
                  </p>
                  <Button onClick={() => setShowNewRule(true)} variant="outline">
                    Criar Primeira Regra
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rules.map((rule) => (
                    <Card key={rule.id} className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-semibold">{rule.name}</CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {rule.user?.name}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                            {rule.percentage}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {getRuleTypeLabel(rule.type)}
                          </span>
                          <Badge variant={rule.active ? "default" : "secondary"} className={rule.active ? "bg-green-500 hover:bg-green-600" : ""}>
                            {rule.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setEditingRule(rule)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletingRuleId(rule.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Ranking de Vendas
              </CardTitle>
              <CardDescription>
                Top vendedores por volume de comissões geradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ranking.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">
                      Nenhum dado suficiente para gerar o ranking
                    </p>
                  </div>
                ) : (
                  ranking.map((vendedor, index) => (
                    <div
                      key={vendedor.id}
                      className="flex items-center gap-4 p-4 border rounded-xl bg-white hover:shadow-md transition-all duration-300 group"
                    >
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg shadow-sm
                        ${index === 0 ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-200" : 
                          index === 1 ? "bg-gray-100 text-gray-700 border-2 border-gray-200" :
                          index === 2 ? "bg-orange-100 text-orange-700 border-2 border-orange-200" :
                          "bg-blue-50 text-blue-700 border-2 border-blue-100"}
                      `}>
                        {index + 1}º
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {vendedor.name}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {vendedor.qtdComissoes} {vendedor.qtdComissoes === 1 ? "comissão" : "comissões"}
                          </p>
                          <div className="h-1 w-1 rounded-full bg-gray-300" />
                          <p className="text-sm text-muted-foreground">
                            Ticket Médio: {formatCurrency(vendedor.totalComissoes / vendedor.qtdComissoes)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total Gerado</p>
                        <p className="text-xl font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                          {formatCurrency(vendedor.totalComissoes)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingRuleId} onOpenChange={() => setDeletingRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra de comissão? Esta ação não pode ser desfeita e afetará os cálculos futuros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingRuleId) {
                  deleteRuleMutation.mutate({ ruleId: deletingRuleId });
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700 shadow-sm"
            >
              Excluir Regra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Calculator({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  )
}
