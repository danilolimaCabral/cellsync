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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Wrench,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Package,
  Trash2,
} from "lucide-react";

export default function OrdemServico() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewOS, setShowNewOS] = useState(false);
  const [selectedOS, setSelectedOS] = useState<number | null>(null);
  const [showAddPart, setShowAddPart] = useState(false);
  
  const [newOS, setNewOS] = useState({
    customerId: "",
    deviceType: "",
    brand: "",
    model: "",
    imei: "",
    defect: "",
    priority: "media" as "baixa" | "media" | "alta" | "urgente",
  });

  const [newPart, setNewPart] = useState({
    productId: 0,
    quantity: 1,
    unitPrice: 0,
  });

  const { data: serviceOrders, refetch } = trpc.serviceOrders.list.useQuery({});
  const { data: customers } = trpc.customers.list.useQuery({ limit: 100 });
  const { data: products } = trpc.products.list.useQuery({ limit: 100 });
  const { data: parts, refetch: refetchParts } = trpc.serviceOrderParts.list.useQuery(
    { serviceOrderId: selectedOS! },
    { enabled: selectedOS !== null }
  );

  const createOSMutation = trpc.serviceOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Ordem de serviço criada com sucesso!");
      setShowNewOS(false);
      refetch();
      setNewOS({
        customerId: "",
        deviceType: "",
        brand: "",
        model: "",
        imei: "",
        defect: "",
        priority: "media",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao criar OS: ${error.message}`);
    },
  });

  const addPartMutation = trpc.serviceOrderParts.add.useMutation({
    onSuccess: () => {
      toast.success("Peça adicionada com sucesso!");
      setShowAddPart(false);
      refetchParts();
      setNewPart({ productId: 0, quantity: 1, unitPrice: 0 });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar peça: ${error.message}`);
    },
  });

  const removePartMutation = trpc.serviceOrderParts.remove.useMutation({
    onSuccess: () => {
      toast.success("Peça removida com sucesso!");
      refetchParts();
    },
    onError: (error) => {
      toast.error(`Erro ao remover peça: ${error.message}`);
    },
  });

  const completeOSMutation = trpc.serviceOrderParts.completeServiceOrder.useMutation({
    onSuccess: () => {
      toast.success("OS finalizada! Peças baixadas do estoque automaticamente.");
      setSelectedOS(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao finalizar OS: ${error.message}`);
    },
  });

  const handleCreateOS = () => {
    if (!newOS.customerId || !newOS.defect) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createOSMutation.mutate({
      ...newOS,
      customerId: parseInt(newOS.customerId),
    });
  };

  const handleAddPart = () => {
    if (!selectedOS || newPart.productId === 0) {
      toast.error("Selecione um produto");
      return;
    }
    addPartMutation.mutate({
      serviceOrderId: selectedOS,
      ...newPart,
    });
  };

  const handleCompleteOS = () => {
    if (!selectedOS) return;
    if (confirm("Deseja finalizar esta OS? As peças serão baixadas do estoque automaticamente.")) {
      completeOSMutation.mutate({ serviceOrderId: selectedOS });
    }
  };

  const filteredOrders = serviceOrders?.filter(
    (os: any) =>
      os.id.toString().includes(searchTerm) ||
      os.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.imei?.includes(searchTerm)
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      aberta: { variant: "secondary", icon: Clock },
      em_diagnostico: { variant: "default", icon: Search },
      em_reparo: { variant: "default", icon: Wrench },
      concluida: { variant: "default", icon: CheckCircle },
      cancelada: { variant: "destructive", icon: XCircle },
      aguardando_retirada: { variant: "outline", icon: AlertCircle },
    };
    const { variant, icon: Icon } = config[status] || config.aberta;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      baixa: { variant: "secondary", label: "Baixa" },
      media: { variant: "default", label: "Média" },
      alta: { variant: "default", label: "Alta" },
      urgente: { variant: "destructive", label: "Urgente" },
    };
    const { variant, label } = config[priority] || config.media;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const stats = {
    total: serviceOrders?.length || 0,
    abertas: serviceOrders?.filter((os: any) => os.status === "aberta").length || 0,
    em_reparo: serviceOrders?.filter((os: any) => os.status === "em_reparo").length || 0,
    concluidas: serviceOrders?.filter((os: any) => os.status === "concluida").length || 0,
  };

  const totalPartsCost = parts?.reduce((sum: number, part: any) => sum + part.totalPrice, 0) || 0;

  const selectedOSData: any = serviceOrders?.find((os: any) => os.id === selectedOS);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordem de Serviço</h1>
          <p className="text-gray-500 mt-1">Gerencie reparos e manutenções</p>
        </div>
        <Dialog open={showNewOS} onOpenChange={setShowNewOS}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={newOS.customerId} onValueChange={(value) => setNewOS({ ...newOS, customerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Aparelho</Label>
                <Input
                  value={newOS.deviceType}
                  onChange={(e) => setNewOS({ ...newOS, deviceType: e.target.value })}
                  placeholder="Ex: Smartphone"
                />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  value={newOS.brand}
                  onChange={(e) => setNewOS({ ...newOS, brand: e.target.value })}
                  placeholder="Ex: Samsung"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={newOS.model}
                  onChange={(e) => setNewOS({ ...newOS, model: e.target.value })}
                  placeholder="Ex: Galaxy S21"
                />
              </div>
              <div className="space-y-2">
                <Label>IMEI</Label>
                <Input
                  value={newOS.imei}
                  onChange={(e) => setNewOS({ ...newOS, imei: e.target.value })}
                  placeholder="15 dígitos"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={newOS.priority} onValueChange={(value: any) => setNewOS({ ...newOS, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Defeito Relatado *</Label>
                <Textarea
                  value={newOS.defect}
                  onChange={(e) => setNewOS({ ...newOS, defect: e.target.value })}
                  placeholder="Descreva o problema..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewOS(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOS} disabled={createOSMutation.isPending}>
                {createOSMutation.isPending ? "Criando..." : "Criar OS"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total de OS</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Abertas</div>
            <div className="text-2xl font-bold text-orange-600">{stats.abertas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Em Reparo</div>
            <div className="text-2xl font-bold text-blue-600">{stats.em_reparo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Concluídas</div>
            <div className="text-2xl font-bold text-green-600">{stats.concluidas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por OS, cliente, aparelho ou IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de OS */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Aparelho</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Defeito</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((os: any) => (
                  <TableRow key={os.id}>
                    <TableCell className="font-medium">#{os.id}</TableCell>
                    <TableCell>{os.customerName}</TableCell>
                    <TableCell>
                      {os.brand} {os.model}
                    </TableCell>
                    <TableCell>
                      {os.imei ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{os.imei}</code>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{os.defect}</TableCell>
                    <TableCell>{getStatusBadge(os.status)}</TableCell>
                    <TableCell>{getPriorityBadge(os.priority)}</TableCell>
                    <TableCell>{formatDate(os.openedAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOS(os.id)}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Peças
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Gestão de Peças */}
      <Dialog open={selectedOS !== null} onOpenChange={() => setSelectedOS(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gestão de Peças - OS #{selectedOS}
              {selectedOSData && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {selectedOSData.customerName} - {selectedOSData.brand} {selectedOSData.model}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="parts" className="mt-4">
            <TabsList>
              <TabsTrigger value="parts">Peças Utilizadas</TabsTrigger>
              <TabsTrigger value="add">Adicionar Peça</TabsTrigger>
            </TabsList>

            <TabsContent value="parts" className="space-y-4">
              {/* Resumo de Custos */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">Total em Peças</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalPartsCost)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {parts?.length || 0} peça(s) utilizada(s)
                      </div>
                    </div>
                    {selectedOSData?.status !== "concluida" && (
                      <Button
                        onClick={handleCompleteOS}
                        disabled={completeOSMutation.isPending || (parts?.length || 0) === 0}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar OS
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Peças */}
              {!parts || parts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma peça adicionada ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part: any) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.productName}</TableCell>
                        <TableCell>{part.productSku || "-"}</TableCell>
                        <TableCell>
                          {part.imei ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {part.imei}
                            </code>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{part.quantity}</TableCell>
                        <TableCell>{formatCurrency(part.unitPrice)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(part.totalPrice)}
                        </TableCell>
                        <TableCell>
                          {selectedOSData?.status !== "concluida" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removePartMutation.mutate({ partId: part.id })}
                              disabled={removePartMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Produto *</Label>
                      <Select
                        value={newPart.productId.toString()}
                        onValueChange={(value) => {
                          const product = products?.find((p: any) => p.id === parseInt(value));
                          setNewPart({
                            ...newPart,
                            productId: parseInt(value),
                            unitPrice: product?.salePrice || 0,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - Estoque: {product.currentStock} - {formatCurrency(product.salePrice)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newPart.quantity}
                          onChange={(e) =>
                            setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço Unitário (R$) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newPart.unitPrice / 100}
                          onChange={(e) =>
                            setNewPart({
                              ...newPart,
                              unitPrice: Math.round(parseFloat(e.target.value || "0") * 100),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-xl font-bold">
                          {formatCurrency(newPart.unitPrice * newPart.quantity)}
                        </span>
                      </div>
                    </div>
                    <Button onClick={handleAddPart} disabled={addPartMutation.isPending} className="w-full">
                      {addPartMutation.isPending ? "Adicionando..." : "Adicionar Peça"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
