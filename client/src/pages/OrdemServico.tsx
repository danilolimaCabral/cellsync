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
} from "lucide-react";

export default function OrdemServico() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewOS, setShowNewOS] = useState(false);
  const [newOS, setNewOS] = useState({
    customerId: "",
    deviceType: "",
    brand: "",
    model: "",
    imei: "",
    defect: "",
    priority: "media" as "baixa" | "media" | "alta" | "urgente",
    notes: "",
  });

  const { data: orders, isLoading } = trpc.serviceOrders.list.useQuery({});
  const { data: customers } = trpc.customers.list.useQuery();

  const createOSMutation = trpc.serviceOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Ordem de Serviço criada com sucesso!");
      setShowNewOS(false);
      setNewOS({
        customerId: "",
        deviceType: "",
        brand: "",
        model: "",
        imei: "",
        defect: "",
        priority: "media",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar OS");
    },
  });

  const handleSubmitOS = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOS.customerId || !newOS.deviceType || !newOS.defect) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createOSMutation.mutate({
      customerId: parseInt(newOS.customerId),
      deviceType: newOS.deviceType,
      brand: newOS.brand || undefined,
      model: newOS.model || undefined,
      imei: newOS.imei || undefined,
      defect: newOS.defect,
      priority: newOS.priority,
      notes: newOS.notes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aberta: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Aberta" },
      em_diagnostico: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Em Diagnóstico" },
      aguardando_aprovacao: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Aguardando Aprovação" },
      em_reparo: { color: "bg-purple-50 text-purple-700 border-purple-200", label: "Em Reparo" },
      concluida: { color: "bg-green-50 text-green-700 border-green-200", label: "Concluída" },
      cancelada: { color: "bg-red-50 text-red-700 border-red-200", label: "Cancelada" },
      aguardando_retirada: { color: "bg-teal-50 text-teal-700 border-teal-200", label: "Aguardando Retirada" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.aberta;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      baixa: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Baixa" },
      media: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Média" },
      alta: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Alta" },
      urgente: { color: "bg-red-50 text-red-700 border-red-200", label: "Urgente" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.media;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = {
    total: orders?.length || 0,
    abertas: orders?.filter((o: any) => o.status === "aberta" || o.status === "em_diagnostico" || o.status === "em_reparo").length || 0,
    concluidas: orders?.filter((o: any) => o.status === "concluida").length || 0,
    aguardandoRetirada: orders?.filter((o: any) => o.status === "aguardando_retirada").length || 0,
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordem de Serviço</h1>
          <p className="text-gray-500 mt-1">Gestão completa de reparos e assistência técnica</p>
        </div>
        <Dialog open={showNewOS} onOpenChange={setShowNewOS}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitOS} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={newOS.customerId}
                    onValueChange={(value) => setNewOS({ ...newOS, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Aparelho *</Label>
                  <Input
                    value={newOS.deviceType}
                    onChange={(e) => setNewOS({ ...newOS, deviceType: e.target.value })}
                    placeholder="Ex: Smartphone"
                    required
                  />
                </div>

                <div>
                  <Label>Marca</Label>
                  <Input
                    value={newOS.brand}
                    onChange={(e) => setNewOS({ ...newOS, brand: e.target.value })}
                    placeholder="Ex: Samsung"
                  />
                </div>

                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={newOS.model}
                    onChange={(e) => setNewOS({ ...newOS, model: e.target.value })}
                    placeholder="Ex: Galaxy S24"
                  />
                </div>

                <div>
                  <Label>IMEI</Label>
                  <Input
                    value={newOS.imei}
                    onChange={(e) => setNewOS({ ...newOS, imei: e.target.value })}
                    placeholder="123456789012345"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Defeito Relatado *</Label>
                  <textarea
                    value={newOS.defect}
                    onChange={(e) => setNewOS({ ...newOS, defect: e.target.value })}
                    placeholder="Descreva o problema relatado pelo cliente..."
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={newOS.priority}
                    onValueChange={(value: any) => setNewOS({ ...newOS, priority: value })}
                  >
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

                <div className="col-span-2">
                  <Label>Observações</Label>
                  <textarea
                    value={newOS.notes}
                    onChange={(e) => setNewOS({ ...newOS, notes: e.target.value })}
                    placeholder="Informações adicionais..."
                    className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewOS(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createOSMutation.isPending}>
                  {createOSMutation.isPending ? "Criando..." : "Criar OS"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de OS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Ordens de serviço totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.abertas}</div>
            <p className="text-xs text-gray-500 mt-1">Sendo processadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.concluidas}</div>
            <p className="text-xs text-gray-500 mt-1">Reparos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Aguardando Retirada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.aguardandoRetirada}</div>
            <p className="text-xs text-gray-500 mt-1">Prontas para retirada</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de OS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Ordens de Serviço</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Aparelho</TableHead>
                  <TableHead>Defeito</TableHead>
                  <TableHead className="text-center">Prioridade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customerId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.deviceType}</div>
                        <div className="text-sm text-gray-500">
                          {order.brand} {order.model}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{order.defect}</TableCell>
                    <TableCell className="text-center">
                      {getPriorityBadge(order.priority)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma ordem de serviço cadastrada</p>
              <p className="text-sm">Clique em "Nova OS" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
