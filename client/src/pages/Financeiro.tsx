import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
  DialogDescription,
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
import { useAuth } from "@/hooks/useAuth";
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
  AlertCircle,
  Check,
} from "lucide-react";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState("pagar");
  const [showNewPayable, setShowNewPayable] = useState(false);
  const [showNewReceivable, setShowNewReceivable] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [showBulkPaymentDialog, setShowBulkPaymentDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"overdue" | "dueToday" | "upcoming" | "paid" | "all">("all");

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

  const { user } = useAuth();

  // Queries
  const { data: accountsPayable, refetch: refetchPayable } = trpc.financial.accountsPayable.list.useQuery({}, {
    enabled: !!user,
  });
  const { data: metrics } = trpc.financial.accountsPayable.metrics.useQuery({}, {
    enabled: !!user,
  });
  const { data: accountsReceivable, refetch: refetchReceivable } = trpc.financial.accountsReceivable.list.useQuery({}, {
    enabled: !!user,
  });
  const { data: cashFlow } = trpc.financial.cashFlow.get.useQuery({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  // Query para preview de pagamento em massa
  const { data: bulkPaymentPreview } = trpc.financial.accountsPayable.bulkPaymentPreview.useQuery(
    { accountIds: selectedAccountIds },
    { enabled: selectedAccountIds.length > 0 }
  );

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
      toast.success("Status atualizado com sucesso!");
      refetchPayable();
    },
  });

  const updateReceivableStatusMutation = trpc.financial.accountsReceivable.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetchReceivable();
    },
  });

  const bulkPaymentMutation = trpc.financial.accountsPayable.bulkPayment.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} contas pagas com sucesso!`);
      setSelectedAccountIds([]);
      setShowBulkPaymentDialog(false);
      refetchPayable();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao realizar pagamento em massa");
    },
  });

  const handleCreatePayable = () => {
    const amountInCents = Math.round(parseFloat(newPayable.amount) * 100);
    createPayableMutation.mutate({
      description: newPayable.description,
      category: newPayable.category,
      costCenter: newPayable.costCenter,
      supplier: newPayable.supplier,
      amount: amountInCents,
      dueDate: new Date(newPayable.dueDate),
      notes: newPayable.notes,
    });
  };

  const handleCreateReceivable = () => {
    const amountInCents = Math.round(parseFloat(newReceivable.amount) * 100);
    createReceivableMutation.mutate({
      description: newReceivable.description,
      amount: amountInCents,
      dueDate: new Date(newReceivable.dueDate),
      notes: newReceivable.notes,
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

  const handleToggleAccount = (accountId: number) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    if (!accountsPayable) return;
    const pendingAccounts = accountsPayable.filter((acc: any) => acc.status === "pendente");
    const allIds = pendingAccounts.map((acc: any) => acc.id);
    setSelectedAccountIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedAccountIds([]);
  };

  const handleBulkPayment = () => {
    bulkPaymentMutation.mutate({
      accountIds: selectedAccountIds,
      paymentDate: new Date(),
    });
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
      case "recebido":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "atrasado":
        return <Badge className="bg-red-100 text-red-800">Atrasado</Badge>;
      case "cancelado":
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filtrar contas baseado no filtro de status
  const filteredAccountsPayable = accountsPayable?.filter((acc: any) => {
    if (statusFilter === "all") return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dueDate = new Date(acc.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (statusFilter === "overdue") {
      return acc.status === "pendente" && dueDate < today;
    } else if (statusFilter === "dueToday") {
      return acc.status === "pendente" && dueDate.getTime() === today.getTime();
    } else if (statusFilter === "upcoming") {
      return acc.status === "pendente" && dueDate >= tomorrow && dueDate < sevenDaysFromNow;
    } else if (statusFilter === "paid") {
      return acc.status === "pago";
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Financeiro" 
        description="Gerencie contas a pagar, receber e fluxo de caixa"
        backTo="/dashboard"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        {/* CONTAS A PAGAR */}
        <TabsContent value="pagar" className="space-y-6">
          {/* Cartões de Status */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-500"
                onClick={() => setStatusFilter("overdue")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Vencidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.overdueCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(metrics.overdueAmount)}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
                onClick={() => setStatusFilter("dueToday")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Vencendo Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {metrics.dueTodayCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(metrics.dueTodayAmount)}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                onClick={() => setStatusFilter("upcoming")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    A Vencer (7 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.upcomingCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(metrics.upcomingAmount)}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                onClick={() => setStatusFilter("paid")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Pagas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.paidCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(metrics.paidAmount)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Painel de Totais */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Custo Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Pago</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo em Aberto</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.pendingAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações e Filtros */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Lista de Contas</CardTitle>
                  {statusFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      Limpar filtro
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedAccountIds.length > 0 && (
                    <>
                      <Badge variant="secondary">
                        {selectedAccountIds.length} selecionada(s)
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                      >
                        Desmarcar Todas
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowBulkPaymentDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Pagar Selecionadas
                      </Button>
                    </>
                  )}
                  {selectedAccountIds.length === 0 && filteredAccountsPayable.filter((acc: any) => acc.status === "pendente").length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      Selecionar Todas Pendentes
                    </Button>
                  )}
                  <Dialog open={showNewPayable} onOpenChange={setShowNewPayable}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Conta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Conta a Pagar</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Descrição *</Label>
                          <Input
                            value={newPayable.description}
                            onChange={(e) =>
                              setNewPayable({ ...newPayable, description: e.target.value })
                            }
                            placeholder="Ex: Aluguel, Fornecedor X"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Categoria</Label>
                            <Select
                              value={newPayable.category}
                              onValueChange={(value) =>
                                setNewPayable({ ...newPayable, category: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="opex">Operacional</SelectItem>
                                <SelectItem value="capex">Investimento</SelectItem>
                                <SelectItem value="salario">Salário</SelectItem>
                                <SelectItem value="imposto">Imposto</SelectItem>
                                <SelectItem value="fornecedor">Fornecedor</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fornecedor</Label>
                            <Input
                              value={newPayable.supplier}
                              onChange={(e) =>
                                setNewPayable({ ...newPayable, supplier: e.target.value })
                              }
                              placeholder="Nome do fornecedor"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Valor (R$) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newPayable.amount}
                              onChange={(e) =>
                                setNewPayable({ ...newPayable, amount: e.target.value })
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Data de Vencimento *</Label>
                            <Input
                              type="date"
                              value={newPayable.dueDate}
                              onChange={(e) =>
                                setNewPayable({ ...newPayable, dueDate: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Centro de Custo</Label>
                          <Input
                            value={newPayable.costCenter}
                            onChange={(e) =>
                              setNewPayable({ ...newPayable, costCenter: e.target.value })
                            }
                            placeholder="Ex: Loja 1, Administrativo"
                          />
                        </div>
                        <div>
                          <Label>Observações</Label>
                          <Input
                            value={newPayable.notes}
                            onChange={(e) =>
                              setNewPayable({ ...newPayable, notes: e.target.value })
                            }
                            placeholder="Notas adicionais"
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleCreatePayable}
                          disabled={
                            !newPayable.description ||
                            !newPayable.amount ||
                            !newPayable.dueDate
                          }
                        >
                          Criar Conta
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAccountIds.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSelectAll();
                          } else {
                            handleDeselectAll();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccountsPayable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Nenhuma conta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccountsPayable.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          {account.status === "pendente" && (
                            <Checkbox
                              checked={selectedAccountIds.includes(account.id)}
                              onCheckedChange={() => handleToggleAccount(account.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{account.description}</TableCell>
                        <TableCell>{account.supplier || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.category || "Outros"}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(account.amount)}</TableCell>
                        <TableCell>{formatDate(account.dueDate)}</TableCell>
                        <TableCell>{getStatusBadge(account.status)}</TableCell>
                        <TableCell>
                          {account.status === "pendente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(account.id)}
                            >
                              Marcar como Pago
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTAS A RECEBER */}
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
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Conta a Receber</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Descrição *</Label>
                        <Input
                          value={newReceivable.description}
                          onChange={(e) =>
                            setNewReceivable({ ...newReceivable, description: e.target.value })
                          }
                          placeholder="Ex: Venda a prazo, Serviço prestado"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Valor (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newReceivable.amount}
                            onChange={(e) =>
                              setNewReceivable({ ...newReceivable, amount: e.target.value })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Data de Vencimento *</Label>
                          <Input
                            type="date"
                            value={newReceivable.dueDate}
                            onChange={(e) =>
                              setNewReceivable({ ...newReceivable, dueDate: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Observações</Label>
                        <Input
                          value={newReceivable.notes}
                          onChange={(e) =>
                            setNewReceivable({ ...newReceivable, notes: e.target.value })
                          }
                          placeholder="Notas adicionais"
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleCreateReceivable}
                        disabled={
                          !newReceivable.description ||
                          !newReceivable.amount ||
                          !newReceivable.dueDate
                        }
                      >
                        Criar Conta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!accountsReceivable || accountsReceivable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma conta a receber
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountsReceivable.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.description}</TableCell>
                        <TableCell>{formatCurrency(account.amount)}</TableCell>
                        <TableCell>{formatDate(account.dueDate)}</TableCell>
                        <TableCell>{getStatusBadge(account.status)}</TableCell>
                        <TableCell>
                          {account.status === "pendente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsReceived(account.id)}
                            >
                              Marcar como Recebido
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FLUXO DE CAIXA */}
        <TabsContent value="fluxo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(cashFlow?.totalIncome || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Receitas do período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saídas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(cashFlow?.totalExpenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Despesas do período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(cashFlow?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(cashFlow?.balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo do período
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Pagamento em Massa */}
      <Dialog open={showBulkPaymentDialog} onOpenChange={setShowBulkPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento em Massa</DialogTitle>
            <DialogDescription>
              Você está prestes a marcar {selectedAccountIds.length} conta(s) como pagas.
            </DialogDescription>
          </DialogHeader>
          {bulkPaymentPreview && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total de Contas:</span>
                  <span className="text-lg font-bold">{bulkPaymentPreview.count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(bulkPaymentPreview.total)}
                  </span>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {bulkPaymentPreview.accounts.map((acc: any) => (
                  <div key={acc.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{acc.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {acc.supplier || "Sem fornecedor"} • Venc: {formatDate(acc.dueDate)}
                      </p>
                    </div>
                    <span className="text-sm font-bold">{formatCurrency(acc.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBulkPayment}
              disabled={bulkPaymentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkPaymentMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
