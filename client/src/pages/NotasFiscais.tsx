import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  FileText,
  Download,
  Eye,
  XCircle,
  Plus,
  Filter,
  FileCheck,
  AlertCircle,
  Calendar,
  Edit,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  Ban,
  FileCode,
  File
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotasFiscais() {
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [, setLocation] = useLocation();
  const [showCancelar, setShowCancelar] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Queries
  const { user, loading } = useAuth();

  const { data: stats } = trpc.nfe.stats.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: invoices = [], refetch } = trpc.nfe.list.useQuery({
    status: statusFilter === "todos" ? undefined : statusFilter,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: 100,
  });

  // Mutations
  const cancelMutation = trpc.nfe.cancel.useMutation({
    onSuccess: () => {
      toast.success("NF-e cancelada com sucesso!");
      setShowCancelar(false);
      setCancelReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar NF-e: ${error.message}`);
    },
  });

  const getByIdQuery = trpc.nfe.getById.useQuery;

  // Verificar autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  const handleViewDetails = async (invoiceId: number) => {
    try {
      // Usar fetch para buscar os detalhes
      const response = await fetch(`/api/trpc/nfe.getById?input=${JSON.stringify({ id: invoiceId })}`);
      const data = await response.json();
      
      // Verificar se data.result e data.result.data existem
      if (data?.result?.data) {
        setSelectedInvoice(data.result.data);
        setShowDetails(true);
      } else {
        toast.error("Dados da nota fiscal não encontrados");
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar detalhes: ${error.message}`);
    }
  };

  const handleCancelInvoice = () => {
    if (!selectedInvoice || !cancelReason.trim()) {
      toast.error("Por favor, informe o motivo do cancelamento");
      return;
    }

    cancelMutation.mutate({
      id: selectedInvoice.id,
      reason: cancelReason,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; icon: any }> = {
      rascunho: { className: "bg-gray-100 text-gray-700 border-gray-200", label: "Rascunho", icon: FileText },
      emitida: { className: "bg-green-100 text-green-700 border-green-200", label: "Emitida", icon: FileCheck },
      cancelada: { className: "bg-red-100 text-red-700 border-red-200", label: "Cancelada", icon: Ban },
      inutilizada: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "Inutilizada", icon: XCircle },
      erro: { className: "bg-red-50 text-red-600 border-red-100", label: "Erro", icon: AlertCircle },
    };

    const config = variants[status] || { className: "bg-gray-100 text-gray-700", label: status, icon: FileText };
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1 px-2 py-0.5`}>
        <Icon className="h-3 w-3" />
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

  const formatDocument = (doc: string) => {
    if (doc.length === 11) {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (doc.length === 14) {
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return doc;
  };

  const handleDownloadXML = async (invoiceId: number) => {
    try {
      toast.info("Gerando XML...");
      const result = await fetch(
        `/api/trpc/nfe.downloadXML?input=${encodeURIComponent(JSON.stringify({ id: invoiceId }))}`
      );
      const data = await result.json();
      const { xml, filename } = data.result.data;

      // Criar blob e fazer download
      const blob = new Blob([xml], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("XML baixado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao baixar XML: ${error.message}`);
    }
  };

  const handleDownloadDANFE = async (invoiceId: number) => {
    try {
      toast.info("Gerando DANFE...");
      const result = await fetch(
        `/api/trpc/nfe.downloadDANFE?input=${encodeURIComponent(JSON.stringify({ id: invoiceId }))}`
      );
      const data = await result.json();
      const { pdf, filename } = data.result.data;

      // Converter base64 para blob
      const byteCharacters = atob(pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("DANFE baixado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao baixar DANFE: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Notas Fiscais Eletrônicas" 
          description="Gerencie, emita e acompanhe suas notas fiscais em tempo real"
          backTo="/dashboard"
        />
        <div className="flex gap-2">
          <Button 
            onClick={() => setLocation("/emitir-nfe")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Emitir Nova NF-e
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de NF-e</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as notas fiscais
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emitidas</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <FileCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.emitidas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              NF-e autorizadas pela SEFAZ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canceladas</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.canceladas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              NF-e canceladas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Download className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma das NF-e emitidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Lista */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Histórico de Notas</CardTitle>
              <CardDescription>Visualize e gerencie todas as notas fiscais emitidas</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por número, cliente..." 
                  className="pl-9 w-[250px] bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="emitida">Emitidas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                  <SelectItem value="erro">Com Erro</SelectItem>
                  <SelectItem value="rascunho">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data Inicial</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9 bg-gray-50 border-gray-200"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data Final</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9 bg-gray-50 border-gray-200"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-none">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[100px]">Número</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2 opacity-20" />
                        <p>Nenhuma nota fiscal encontrada</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-gray-900">#{invoice.number}</span>
                          <span className="text-xs text-muted-foreground">Série {invoice.series}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{invoice.recipientName}</span>
                          <span className="text-xs text-muted-foreground">{formatDocument(invoice.recipientDocument)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(invoice.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(invoice.totalInvoice)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            
                            {invoice.status === "emitida" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDownloadXML(invoice.id)}>
                                  <FileCode className="mr-2 h-4 w-4" />
                                  Baixar XML
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadDANFE(invoice.id)}>
                                  <File className="mr-2 h-4 w-4" />
                                  Baixar DANFE
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowCancelar(true);
                                  }}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Cancelar NF-e
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {invoice.status === "rascunho" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setLocation(`/emitir-nfe?id=${invoice.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar Rascunho
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-blue-600" />
              Detalhes da NF-e #{selectedInvoice?.number}
            </DialogTitle>
            <DialogDescription>
              Visualização completa dos dados da nota fiscal
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <Tabs defaultValue="geral" className="mt-4">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="emitente">Emitente/Destinatário</TabsTrigger>
                <TabsTrigger value="itens">Itens</TabsTrigger>
                <TabsTrigger value="impostos">Impostos</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gray-50/50 border-gray-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getStatusBadge(selectedInvoice.status)}
                      {selectedInvoice.status === "cancelada" && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100">
                          Motivo: {selectedInvoice.cancelReason}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50/50 border-gray-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Dados Básicos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p><span className="font-medium">Série:</span> {selectedInvoice.series}</p>
                      <p><span className="font-medium">Data Emissão:</span> {new Date(selectedInvoice.createdAt).toLocaleString("pt-BR")}</p>
                      <p><span className="font-medium">Natureza:</span> {selectedInvoice.natureOperation}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gray-50/50 border-gray-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p><span className="font-medium">Forma:</span> {selectedInvoice.paymentMethod}</p>
                      <p><span className="font-medium">Indicador:</span> {selectedInvoice.paymentIndicator}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50/50 border-gray-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Valores Totais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Produtos:</span>
                        <span>{formatCurrency(selectedInvoice.totalProducts)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(selectedInvoice.totalDiscount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-1 mt-1">
                        <span>Total:</span>
                        <span className="text-blue-600">{formatCurrency(selectedInvoice.totalInvoice)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedInvoice.accessKey && (
                  <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">Chave de Acesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-mono bg-white p-2 rounded border border-blue-100 text-blue-800 break-all">
                        {selectedInvoice.accessKey}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="emitente" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        Emitente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="font-semibold text-lg">{selectedInvoice.emitterName}</p>
                      <p className="text-muted-foreground">{selectedInvoice.emitterFantasyName}</p>
                      <div className="pt-2 border-t space-y-1">
                        <p><span className="font-medium">CNPJ:</span> {formatDocument(selectedInvoice.emitterCnpj)}</p>
                        <p><span className="font-medium">IE:</span> {selectedInvoice.emitterIE || "Isento"}</p>
                        <p><span className="font-medium">Endereço:</span> {selectedInvoice.emitterAddress}</p>
                        <p><span className="font-medium">Cidade:</span> {selectedInvoice.emitterCity} - {selectedInvoice.emitterState}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        Destinatário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="font-semibold text-lg">{selectedInvoice.recipientName}</p>
                      <div className="pt-2 border-t space-y-1">
                        <p><span className="font-medium">CPF/CNPJ:</span> {formatDocument(selectedInvoice.recipientDocument)}</p>
                        <p><span className="font-medium">Endereço:</span> {selectedInvoice.recipientAddress}</p>
                        <p><span className="font-medium">Cidade:</span> {selectedInvoice.recipientCity} - {selectedInvoice.recipientState}</p>
                        <p><span className="font-medium">Email:</span> {selectedInvoice.recipientEmail || "-"}</p>
                        <p><span className="font-medium">Telefone:</span> {selectedInvoice.recipientPhone || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="itens" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>NCM</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Valor Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-muted-foreground">{item.ncm}</TableCell>
                            <TableCell className="text-right">{(item.quantity / 100).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="impostos" className="mt-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">ICMS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(selectedInvoice.totalIcms)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50/50 border-purple-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">IPI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(selectedInvoice.totalIpi)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50/50 border-orange-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">PIS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatCurrency(selectedInvoice.totalPis)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50/50 border-green-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">COFINS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(selectedInvoice.totalCofins)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelar} onOpenChange={setShowCancelar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cancelar NF-e #{selectedInvoice?.number}
            </DialogTitle>
            <DialogDescription>
              O cancelamento é irreversível e deve ser feito dentro do prazo legal (24h).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do Cancelamento *</Label>
              <Input
                placeholder="Ex: Erro no valor, cliente desistiu da compra..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="border-red-200 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-muted-foreground">Mínimo de 15 caracteres.</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCancelar(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelInvoice}
                disabled={cancelMutation.isPending || cancelReason.length < 15}
              >
                {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Building2({ className }: { className?: string }) {
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
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  )
}

function User({ className }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
