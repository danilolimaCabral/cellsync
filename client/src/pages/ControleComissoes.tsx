import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { DollarSign, CheckCircle, XCircle, Clock, TrendingUp, Users, Wallet } from "lucide-react";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
};

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
  aprovada: { label: "Aprovada", color: "bg-blue-500", icon: CheckCircle },
  paga: { label: "Paga", color: "bg-green-500", icon: DollarSign },
  cancelada: { label: "Cancelada", color: "bg-red-500", icon: XCircle },
};

export default function ControleComissoes() {
  const { user, loading } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("pendente");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCommissions, setSelectedCommissions] = useState<number[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.commissionsManagement.stats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    userId: selectedVendor !== "all" ? parseInt(selectedVendor) : undefined,
  });

  const { data: commissions, refetch: refetchCommissions } = trpc.commissionsManagement.list.useQuery({
    status: selectedStatus as any,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    userId: selectedVendor !== "all" ? parseInt(selectedVendor) : undefined,
  });

  const { data: vendors } = trpc.commissionsManagement.byVendor.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Mutations
  const approveMutation = trpc.commissionsManagement.approve.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.approvedCount} comissão(ões) aprovada(s) com sucesso!`);
      setSelectedCommissions([]);
      setShowApproveDialog(false);
      setApprovalNotes("");
      refetchCommissions();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar comissões: ${error.message}`);
    },
  });

  const payMutation = trpc.commissionsManagement.pay.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.paidCount} comissão(ões) paga(s)! Total: ${formatCurrency(result.totalAmount)}`);
      setSelectedCommissions([]);
      setShowPayDialog(false);
      setPaymentNotes("");
      refetchCommissions();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  // Verificar permissão
  if (user.role !== "gerente" && user.role !== "admin" && user.role !== "master_admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Apenas gerentes e administradores podem acessar esta página</p>
      </div>
    );
  }

  const handleSelectCommission = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedCommissions([...selectedCommissions, id]);
    } else {
      setSelectedCommissions(selectedCommissions.filter(cid => cid !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && commissions) {
      setSelectedCommissions(commissions.map(c => c.id));
    } else {
      setSelectedCommissions([]);
    }
  };

  const handleApprove = () => {
    if (selectedCommissions.length === 0) {
      toast.error("Selecione pelo menos uma comissão");
      return;
    }
    approveMutation.mutate({
      commissionIds: selectedCommissions,
      notes: approvalNotes || undefined,
    });
  };

  const handlePay = () => {
    if (selectedCommissions.length === 0) {
      toast.error("Selecione pelo menos uma comissão");
      return;
    }
    payMutation.mutate({
      commissionIds: selectedCommissions,
      paymentMethod,
      notes: paymentNotes || undefined,
    });
  };

  const totalSelected = commissions
    ?.filter(c => selectedCommissions.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0) || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader
        title="Controle de Comissões"
        description="Gerencie aprovação e pagamento de comissões de vendedores"
        backTo="/dashboard"
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalPendente || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.countPendente || 0} comissões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalAprovada || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.countAprovada || 0} comissões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalPaga || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.countPaga || 0} comissões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((stats?.totalPendente || 0) + (stats?.totalAprovada || 0) + (stats?.totalPaga || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats?.countPendente || 0) + (stats?.countAprovada || 0) + (stats?.countPaga || 0)} comissões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Vendedor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.userId} value={vendor.userId.toString()}>
                      {vendor.userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSelectedVendor("all");
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Status */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
          <TabsTrigger value="paga">Pagas</TabsTrigger>
          <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Comissões {statusConfig[selectedStatus as keyof typeof statusConfig].label}s</CardTitle>
                <div className="flex gap-2">
                  {selectedCommissions.length > 0 && (
                    <Badge variant="secondary">
                      {selectedCommissions.length} selecionada(s) - {formatCurrency(totalSelected)}
                    </Badge>
                  )}
                  {selectedStatus === "pendente" && selectedCommissions.length > 0 && (
                    <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar Selecionadas
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aprovar Comissões</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Você está prestes a aprovar {selectedCommissions.length} comissão(ões) no valor total de {formatCurrency(totalSelected)}.</p>
                          <div>
                            <Label>Observações (opcional)</Label>
                            <Input
                              value={approvalNotes}
                              onChange={(e) => setApprovalNotes(e.target.value)}
                              placeholder="Digite observações sobre a aprovação"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleApprove} disabled={approveMutation.isPending} className="flex-1">
                              {approveMutation.isPending ? "Aprovando..." : "Confirmar Aprovação"}
                            </Button>
                            <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="flex-1">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {selectedStatus === "aprovada" && selectedCommissions.length > 0 && (
                    <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Wallet className="h-4 w-4 mr-2" />
                          Registrar Pagamento
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Pagamento de Comissões</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Você está prestes a registrar o pagamento de {selectedCommissions.length} comissão(ões) no valor total de {formatCurrency(totalSelected)}.</p>
                          <div>
                            <Label>Forma de Pagamento</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Observações (opcional)</Label>
                            <Input
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              placeholder="Digite observações sobre o pagamento"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handlePay} disabled={payMutation.isPending} className="flex-1">
                              {payMutation.isPending ? "Registrando..." : "Confirmar Pagamento"}
                            </Button>
                            <Button variant="outline" onClick={() => setShowPayDialog(false)} className="flex-1">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!commissions || commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma comissão encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {(selectedStatus === "pendente" || selectedStatus === "aprovada") && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCommissions.length === commissions.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Venda</TableHead>
                      <TableHead>Valor Base</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Data</TableHead>
                      {selectedStatus === "aprovada" && <TableHead>Aprovado Por</TableHead>}
                      {selectedStatus === "paga" && <TableHead>Pago Em</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        {(selectedStatus === "pendente" || selectedStatus === "aprovada") && (
                          <TableCell>
                            <Checkbox
                              checked={selectedCommissions.includes(commission.id)}
                              onCheckedChange={(checked) => handleSelectCommission(commission.id, checked as boolean)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{commission.userName}</TableCell>
                        <TableCell>#{commission.saleId}</TableCell>
                        <TableCell>{formatCurrency(commission.baseAmount)}</TableCell>
                        <TableCell>{commission.percentage}%</TableCell>
                        <TableCell className="font-bold">{formatCurrency(commission.amount)}</TableCell>
                        <TableCell>{formatDate(commission.createdAt)}</TableCell>
                        {selectedStatus === "aprovada" && commission.approvedAt && (
                          <TableCell>{formatDate(commission.approvedAt)}</TableCell>
                        )}
                        {selectedStatus === "paga" && commission.paidAt && (
                          <TableCell>{formatDate(commission.paidAt)}</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dashboard de Vendedores */}
      {vendors && vendors.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Comissões por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Total Comissões</TableHead>
                  <TableHead>Pendente</TableHead>
                  <TableHead>Aprovada</TableHead>
                  <TableHead>Paga</TableHead>
                  <TableHead>Qtd. Vendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.userId}>
                    <TableCell className="font-medium">{vendor.userName}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(vendor.totalComissoes)}</TableCell>
                    <TableCell>{formatCurrency(vendor.totalPendente)}</TableCell>
                    <TableCell>{formatCurrency(vendor.totalAprovada)}</TableCell>
                    <TableCell>{formatCurrency(vendor.totalPaga)}</TableCell>
                    <TableCell>{vendor.countComissoes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
