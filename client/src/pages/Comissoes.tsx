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
import { DollarSign, TrendingUp, Users, Plus, Edit, Trash2, Info } from "lucide-react";
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
  const { data: users = [] } = trpc.users.list.useQuery({});
  const { data: commissions = [] } = trpc.commissions.getPending.useQuery();
  const { data: rules = [] } = trpc.commissions.listRules.useQuery();

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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <PageHeader 
          title="Gestão de Comissões" 
          description="Configuração de regras e aprovação de comissões"
          backTo="/dashboard"
        />
        <Dialog open={showNewRule || !!editingRule} onOpenChange={(open) => {
          setShowNewRule(open);
          if (!open) setEditingRule(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar" : "Nova"} Regra de Comissão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
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

                <div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
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

                <div>
                  <Label htmlFor="percentage">Percentual (%) *</Label>
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
                  />
                </div>
              </div>

              {/* Descrição do tipo */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Sobre {getRuleTypeLabel(ruleType)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Preview de Cálculo</CardTitle>
                  <CardDescription>Simule o cálculo da comissão</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="previewAmount">Valor da Venda (R$)</Label>
                    <Input
                      id="previewAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={previewAmount}
                      onChange={(e) => setPreviewAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 1000.00"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Comissão Calculada</p>
                      <p className="text-2xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatePreview())}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {previewPercentage.toFixed(2)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={createRuleMutation.isPending || updateRuleMutation.isPending}>
                  {(createRuleMutation.isPending || updateRuleMutation.isPending) ? "Salvando..." : editingRule ? "Atualizar" : "Criar Regra"}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowNewRule(false);
                  setEditingRule(null);
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendente)}</div>
            <p className="text-xs text-muted-foreground">{totalComissoes} comissões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ranking.length}</div>
            <p className="text-xs text-muted-foreground">com comissões pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Vendedor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ranking.length > 0 ? formatCurrency(totalPendente / ranking.length) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">comissão média</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comissoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comissoes">Comissões Pendentes</TabsTrigger>
          <TabsTrigger value="regras">Regras de Comissão</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Aba de Comissões */}
        <TabsContent value="comissoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comissões Pendentes de Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma comissão pendente
                  </p>
                ) : (
                  commissions.map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{commission.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          Venda #{commission.saleId} • Cliente: {commission.customerName || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(commission.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-lg font-bold">{formatCurrency(commission.amount)}</p>
                        {commission.percentage && (
                          <p className="text-sm text-muted-foreground">
                            {commission.percentage.toFixed(2)}% de {formatCurrency(commission.baseAmount)}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-1">
                          Pendente
                        </Badge>
                      </div>
                      {user?.role === "admin" && (
                        <Button
                          size="sm"
                          onClick={() => approveCommissionMutation.mutate({ 
                            commissionId: commission.id 
                          })}
                          disabled={approveCommissionMutation.isPending}
                        >
                          Aprovar
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Regras */}
        <TabsContent value="regras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Comissão Ativas</CardTitle>
              <CardDescription>
                Configure percentuais e tipos de comissão por vendedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma regra cadastrada. Clique em "Nova Regra" para começar.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Nome da Regra</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Percentual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule: any) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.userName}</TableCell>
                          <TableCell>{rule.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getRuleTypeLabel(rule.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {rule.percentage.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.active ? "default" : "secondary"}>
                              {rule.active ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingRule(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingRuleId(rule.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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

        {/* Aba de Ranking */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ranking de Vendedores (Comissões Pendentes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum vendedor com comissões pendentes
                  </p>
                ) : (
                  ranking.map((vendedor, index) => (
                    <div
                      key={vendedor.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{vendedor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {vendedor.qtdComissoes} {vendedor.qtdComissoes === 1 ? "comissão" : "comissões"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
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
              Tem certeza que deseja excluir esta regra de comissão? Esta ação não pode ser desfeita.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
