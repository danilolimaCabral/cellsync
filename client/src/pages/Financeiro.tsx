import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState("pagar");
  const [showNewPayable, setShowNewPayable] = useState(false);
  const [showNewReceivable, setShowNewReceivable] = useState(false);

  // Estados para Contas a Pagar
  const [newPayable, setNewPayable] = useState({
    description: "",
    category: "opex",
    costCenter: "",
    supplier: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  // Estados para Contas a Receber
  const [newReceivable, setNewReceivable] = useState({
    description: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  // Queries
  const { data: accountsPayable, refetch: refetchPayable } = trpc.financial.accountsPayable.list.useQuery({});
  const { data: accountsReceivable, refetch: refetchReceivable } = trpc.financial.accountsReceivable.list.useQuery({});
  const { data: cashFlow } = trpc.financial.cashFlow.get.useQuery({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  // Mutations
  const createPayableMutation = trpc.financial.accountsPayable.create.useMutation({
    onSuccess: () => {
      toast.success("Conta a pagar criada com sucesso!");
      setShowNewPayable(false);
      setNewPayable({
        description: "",
        category: "opex",
        costCenter: "",
        supplier: "",
        amount: "",
        dueDate: "",
        notes: "",
      });
      refetchPayable();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta a pagar");
    },
  });

  const createReceivableMutation = trpc.financial.accountsReceivable.create.useMutation({
    onSuccess: () => {
      toast.success("Conta a receber criada com sucesso!");
      setShowNewReceivable(false);
      setNewReceivable({
        description: "",
        amount: "",
        dueDate: "",
        notes: "",
      });
      refetchReceivable();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta a receber");
    },
  });

  const updatePayableStatusMutation = trpc.financial.accountsPayable.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetchPayable();
    },
  });

  const updateReceivableStatusMutation = trpc.financial.accountsReceivable.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetchReceivable();
    },
  });

  // Handlers
  const handleSubmitPayable = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPayable.description || !newPayable.amount || !newPayable.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createPayableMutation.mutate({
      description: newPayable.description,
      category: newPayable.category,
      costCenter: newPayable.costCenter || undefined,
      supplier: newPayable.supplier || undefined,
      amount: Math.round(parseFloat(newPayable.amount) * 100),
      dueDate: new Date(newPayable.dueDate),
      notes: newPayable.notes || undefined,
    });
  };

  const handleSubmitReceivable = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReceivable.description || !newReceivable.amount || !newReceivable.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createReceivableMutation.mutate({
      description: newReceivable.description,
      amount: Math.round(parseFloat(newReceivable.amount) * 100),
      dueDate: new Date(newReceivable.dueDate),
      notes: newReceivable.notes || undefined,
    });
  };

  const handleMarkAsPaid = (id: number) => {
    updatePayableStatusMutation.mutate({
      id,
      status: "pago",
      paymentDate: new Date(),
    });
  };

  const handleMarkAsReceived = (id: number) => {
    updateReceivableStatusMutation.mutate({
      id,
      status: "recebido",
      paymentDate: new Date(),
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Pendente", icon: Clock },
      pago: { color: "bg-green-50 text-green-700 border-green-200", label: "Pago", icon: CheckCircle },
      recebido: { color: "bg-green-50 text-green-700 border-green-200", label: "Recebido", icon: CheckCircle },
      atrasado: { color: "bg-red-50 text-red-700 border-red-200", label: "Atrasado", icon: XCircle },
      cancelado: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Cancelado", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const stats = {
    totalPayable: accountsPayable?.filter((a: any) => a.status === "pendente").reduce((sum: number, a: any) => sum + a.amount, 0) || 0,
    totalReceivable: accountsReceivable?.filter((a: any) => a.status === "pendente").reduce((sum: number, a: any) => sum + a.amount, 0) || 0,
    balance: (cashFlow?.balance || 0),
    totalIncome: (cashFlow?.totalIncome || 0),
    totalExpenses: (cashFlow?.totalExpenses || 0),
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 mt-1">Gestão completa de contas e fluxo de caixa</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              A Pagar (Pendente)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalPayable)}</div>
            <p className="text-xs text-gray-500 mt-1">Contas pendentes de pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              A Receber (Pendente)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceivable)}</div>
            <p className="text-xs text-gray-500 mt-1">Contas pendentes de recebimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.balance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Receitas - Despesas (mês atual)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalIncome)}</div>
            <p className="text-xs text-gray-500 mt-1">Total recebido no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Contas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        {/* Contas a Pagar */}
        <TabsContent value="pagar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contas a Pagar</CardTitle>
                <Dialog open={showNewPayable} onOpenChange={setShowNewPayable}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Conta a Pagar</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitPayable} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Descrição *</Label>
                          <Input
                            value={newPayable.description}
                            onChange={(e) => setNewPayable({ ...newPayable, description: e.target.value })}
                            placeholder="Ex: Aluguel, Fornecedor, etc"
                            required
                          />
                        </div>

                        <div>
                          <Label>Categoria *</Label>
                          <Select
                            value={newPayable.category}
                            onValueChange={(value) => setNewPayable({ ...newPayable, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="opex">OPEX (Despesas Operacionais)</SelectItem>
                              <SelectItem value="custo_fixo">Custo Fixo</SelectItem>
                              <SelectItem value="custo_variavel">Custo Variável</SelectItem>
                              <SelectItem value="investimento">Investimento</SelectItem>
                              <SelectItem value="impostos">Impostos</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Centro de Custo</Label>
                          <Input
                            value={newPayable.costCenter}
                            onChange={(e) => setNewPayable({ ...newPayable, costCenter: e.target.value })}
                            placeholder="Ex: Loja 1, Administrativo"
                          />
                        </div>

                        <div>
                          <Label>Fornecedor</Label>
                          <Input
                            value={newPayable.supplier}
                            onChange={(e) => setNewPayable({ ...newPayable, supplier: e.target.value })}
                            placeholder="Nome do fornecedor"
                          />
                        </div>

                        <div>
                          <Label>Valor (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newPayable.amount}
                            onChange={(e) => setNewPayable({ ...newPayable, amount: e.target.value })}
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Data de Vencimento *</Label>
                          <Input
                            type="date"
                            value={newPayable.dueDate}
                            onChange={(e) => setNewPayable({ ...newPayable, dueDate: e.target.value })}
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Observações</Label>
                          <textarea
                            value={newPayable.notes}
                            onChange={(e) => setNewPayable({ ...newPayable, notes: e.target.value })}
                            placeholder="Informações adicionais..."
                            className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewPayable(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createPayableMutation.isPending}>
                          {createPayableMutation.isPending ? "Criando..." : "Criar Conta"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {accountsPayable && accountsPayable.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsPayable.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.category || "-"}</Badge>
                        </TableCell>
                        <TableCell>{account.supplier || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(account.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(account.dueDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(account.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          {account.status === "pendente" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsPaid(account.id)}
                            >
                              Marcar como Pago
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma conta a pagar cadastrada</p>
                  <p className="text-sm">Clique em "Nova Conta" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contas a Receber */}
        <TabsContent value="receber" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contas a Receber</CardTitle>
                <Dialog open={showNewReceivable} onOpenChange={setShowNewReceivable}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Conta a Receber</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitReceivable} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Descrição *</Label>
                          <Input
                            value={newReceivable.description}
                            onChange={(e) => setNewReceivable({ ...newReceivable, description: e.target.value })}
                            placeholder="Ex: Venda, Serviço prestado, etc"
                            required
                          />
                        </div>

                        <div>
                          <Label>Valor (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newReceivable.amount}
                            onChange={(e) => setNewReceivable({ ...newReceivable, amount: e.target.value })}
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div>
                          <Label>Data de Vencimento *</Label>
                          <Input
                            type="date"
                            value={newReceivable.dueDate}
                            onChange={(e) => setNewReceivable({ ...newReceivable, dueDate: e.target.value })}
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Observações</Label>
                          <textarea
                            value={newReceivable.notes}
                            onChange={(e) => setNewReceivable({ ...newReceivable, notes: e.target.value })}
                            placeholder="Informações adicionais..."
                            className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewReceivable(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createReceivableMutation.isPending}>
                          {createReceivableMutation.isPending ? "Criando..." : "Criar Conta"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {accountsReceivable && accountsReceivable.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsReceivable.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.description}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(account.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(account.dueDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(account.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          {account.status === "pendente" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsReceived(account.id)}
                            >
                              Marcar como Recebido
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma conta a receber cadastrada</p>
                  <p className="text-sm">Clique em "Nova Conta" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fluxo de Caixa */}
        <TabsContent value="fluxo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa - Mês Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium mb-1">Receitas</div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(stats.totalIncome)}
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-600 font-medium mb-1">Despesas</div>
                    <div className="text-2xl font-bold text-red-700">
                      {formatCurrency(stats.totalExpenses)}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${stats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <div className={`text-sm font-medium mb-1 ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      Saldo
                    </div>
                    <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {formatCurrency(stats.balance)}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Cálculo:</strong> Saldo = Receitas Recebidas - Despesas Pagas (mês atual)
                  </p>
                  <p className="text-xs text-gray-500">
                    Este valor representa o fluxo de caixa real do mês, considerando apenas transações já efetivadas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
