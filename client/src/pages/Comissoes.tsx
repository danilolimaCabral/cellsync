import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Users, CheckCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper para formatação de moeda brasileira
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};

export default function Comissoes() {
  const { user } = useAuth();
  const [showNewRule, setShowNewRule] = useState(false);

  // Queries
  const { data: users = [] } = trpc.users.list.useQuery({});
  const { data: commissions = [] } = trpc.commissions.getPending.useQuery();

  // Mutations
  const createRuleMutation = trpc.commissions.createRule.useMutation({
    onSuccess: () => {
      toast.success("Regra de comissão criada com sucesso!");
      setShowNewRule(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });

  const approveCommissionMutation = trpc.commissions.approve.useMutation({
    onSuccess: () => {
      toast.success("Comissão aprovada com sucesso!");
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Comissões</h1>
          <p className="text-muted-foreground">Configuração de regras e aprovação de comissões</p>
        </div>
        <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Regra de Comissão</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const type = formData.get("type") as string;
                
                createRuleMutation.mutate({
                  userId: parseInt(formData.get("userId") as string),
                  name: `Regra ${type}`,
                  type: type === "percentual" ? "percentual_fixo" : type === "meta" ? "meta_progressiva" : "bonus_produto",
                  percentage: parseFloat(formData.get("value") as string),
                  active: true,
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="userId">Vendedor *</Label>
                <Select name="userId" required>
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
                <Label htmlFor="type">Tipo de Comissão *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual Fixo</SelectItem>
                    <SelectItem value="meta">Meta Progressiva</SelectItem>
                    <SelectItem value="bonus">Bônus por Produto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Valor (%) *</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="Ex: 5.00"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={createRuleMutation.isPending}>
                  {createRuleMutation.isPending ? "Criando..." : "Criar Regra"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewRule(false)}>
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
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Aba de Comissões */}
        <TabsContent value="comissoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Comissões Pendentes de Aprovação</CardTitle>

              </div>
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
    </div>
  );
}
