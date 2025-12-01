import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  TrendingUp,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function Movimentacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    productId: undefined as number | undefined,
    type: undefined as string | undefined,
    limit: 50,
    offset: 0,
  });

  const [newMovement, setNewMovement] = useState({
    productId: 0,
    stockItemId: undefined as number | undefined,
    type: "entrada" as "entrada" | "saida" | "transferencia" | "ajuste" | "devolucao",
    quantity: 1,
    fromLocation: "",
    toLocation: "",
    reason: "",
  });

  const [searchIMEI, setSearchIMEI] = useState("");

  const { data: movementsData, isLoading, refetch } = trpc.stockMovements.list.useQuery(filters);
  const { data: products } = trpc.products.list.useQuery({ limit: 100 });
  const { data: inventoryReport } = trpc.stockMovements.inventoryReport.useQuery();
  const { data: imeiMovements } = trpc.stockMovements.byIMEI.useQuery(
    { imei: searchIMEI },
    { enabled: searchIMEI.length > 0 }
  );

  const createMovementMutation = trpc.stockMovements.create.useMutation({
    onSuccess: () => {
      toast.success("Movimentação registrada com sucesso!");
      setIsDialogOpen(false);
      refetch();
      setNewMovement({
        productId: 0,
        stockItemId: undefined,
        type: "entrada",
        quantity: 1,
        fromLocation: "",
        toLocation: "",
        reason: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`);
    },
  });

  const handleCreateMovement = () => {
    if (newMovement.productId === 0) {
      toast.error("Selecione um produto");
      return;
    }
    if (newMovement.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    createMovementMutation.mutate(newMovement);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      entrada: { variant: "default", icon: ArrowDownCircle },
      saida: { variant: "destructive", icon: ArrowUpCircle },
      transferencia: { variant: "secondary", icon: RefreshCw },
      ajuste: { variant: "outline", icon: TrendingUp },
      devolucao: { variant: "default", icon: ArrowDownCircle },
    };
    const { variant, icon: Icon } = config[type] || config.entrada;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any; label: string }> = {
      normal: { variant: "default", icon: CheckCircle, label: "Normal" },
      baixo: { variant: "secondary", icon: AlertTriangle, label: "Baixo" },
      sem_estoque: { variant: "destructive", icon: XCircle, label: "Sem Estoque" },
    };
    const { variant, icon: Icon, label } = config[status] || config.normal;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimentações de Estoque</h1>
          <p className="text-gray-500 mt-1">Gerencie entradas, saídas e ajustes de estoque</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Movimentação</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Produto *</Label>
                <Select
                  value={newMovement.productId.toString()}
                  onValueChange={(value) =>
                    setNewMovement({ ...newMovement, productId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - Estoque: {product.currentStock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Movimentação *</Label>
                <Select
                  value={newMovement.type}
                  onValueChange={(value: any) => setNewMovement({ ...newMovement, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  value={newMovement.quantity}
                  onChange={(e) =>
                    setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Local de Origem</Label>
                <Input
                  value={newMovement.fromLocation}
                  onChange={(e) => setNewMovement({ ...newMovement, fromLocation: e.target.value })}
                  placeholder="Ex: Loja Principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Local de Destino</Label>
                <Input
                  value={newMovement.toLocation}
                  onChange={(e) => setNewMovement({ ...newMovement, toLocation: e.target.value })}
                  placeholder="Ex: Depósito"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Motivo / Observações</Label>
                <Textarea
                  value={newMovement.reason}
                  onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                  placeholder="Descreva o motivo da movimentação..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMovement} disabled={createMovementMutation.isPending}>
                {createMovementMutation.isPending ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="historico" className="space-y-4">
        <TabsList>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="inventario">Inventário</TabsTrigger>
          <TabsTrigger value="rastreamento">Rastreamento IMEI</TabsTrigger>
        </TabsList>

        {/* Histórico de Movimentações */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        startDate: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        endDate: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={filters.type || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, type: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                      <SelectItem value="devolucao">Devolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select
                    value={filters.productId?.toString() || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        productId: value === "all" ? undefined : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os produtos</SelectItem>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Movimentações: {movementsData?.movements.length || 0} de {movementsData?.total || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Carregando movimentações...</div>
              ) : movementsData?.movements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma movimentação encontrada
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementsData?.movements.map((movement: any) => (
                        <TableRow key={movement.id}>
                          <TableCell>{formatDate(movement.createdAt)}</TableCell>
                          <TableCell className="font-medium">{movement.productName}</TableCell>
                          <TableCell>
                            {movement.imei ? (
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {movement.imei}
                              </code>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getTypeBadge(movement.type)}</TableCell>
                          <TableCell className="font-semibold">{movement.quantity}</TableCell>
                          <TableCell>{movement.fromLocation || "-"}</TableCell>
                          <TableCell>{movement.toLocation || "-"}</TableCell>
                          <TableCell>{movement.userName}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {movement.reason || "-"}
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

        {/* Relatório de Inventário */}
        <TabsContent value="inventario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Inventário
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Compara estoque registrado vs calculado por movimentações
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!inventoryReport || inventoryReport.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum produto no estoque</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Estoque Calculado</TableHead>
                        <TableHead>Divergência</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor em Estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryReport.map((item: any) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.sku || "-"}</TableCell>
                          <TableCell className="font-semibold">{item.currentStock}</TableCell>
                          <TableCell>{item.calculatedStock}</TableCell>
                          <TableCell>
                            {item.divergence !== 0 ? (
                              <span
                                className={`font-semibold ${
                                  item.divergence > 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {item.divergence > 0 ? "+" : ""}
                                {item.divergence}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{item.minStock}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {formatCurrency(item.costPrice * item.currentStock)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo do Inventário */}
          {inventoryReport && inventoryReport.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">Total de Produtos</div>
                  <div className="text-2xl font-bold">{inventoryReport.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">Produtos com Estoque Baixo</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {inventoryReport.filter((item: any) => item.status === "baixo").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">Produtos Sem Estoque</div>
                  <div className="text-2xl font-bold text-red-600">
                    {inventoryReport.filter((item: any) => item.status === "sem_estoque").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 mb-1">Valor Total em Estoque</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      inventoryReport.reduce(
                        (sum: number, item: any) => sum + item.costPrice * item.currentStock,
                        0
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Rastreamento por IMEI */}
        <TabsContent value="rastreamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rastrear Produto por IMEI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Digite o IMEI do produto..."
                    value={searchIMEI}
                    onChange={(e) => setSearchIMEI(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchIMEI.length > 0 && (
                <>
                  {!imeiMovements || imeiMovements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma movimentação encontrada para este IMEI
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Origem</TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {imeiMovements.map((movement: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{formatDate(movement.createdAt)}</TableCell>
                              <TableCell className="font-medium">{movement.productName}</TableCell>
                              <TableCell>{getTypeBadge(movement.type)}</TableCell>
                              <TableCell className="font-semibold">{movement.quantity}</TableCell>
                              <TableCell>{movement.fromLocation || "-"}</TableCell>
                              <TableCell>{movement.toLocation || "-"}</TableCell>
                              <TableCell>{movement.userName}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {movement.reason || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
