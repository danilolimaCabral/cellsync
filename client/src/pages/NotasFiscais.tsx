import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
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
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

export default function NotasFiscais() {
  const { user, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEmitir, setShowEmitir] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Queries
  const { data: stats } = trpc.nfe.stats.useQuery();
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
        <p className="text-muted-foreground">Carregando...</p>
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
    const variants: Record<string, { variant: any; label: string }> = {
      rascunho: { variant: "secondary", label: "Rascunho" },
      emitida: { variant: "default", label: "Emitida" },
      cancelada: { variant: "destructive", label: "Cancelada" },
      inutilizada: { variant: "outline", label: "Inutilizada" },
      erro: { variant: "destructive", label: "Erro" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Notas Fiscais Eletrônicas" 
          description="Gerencie as NF-e emitidas pelo sistema"
          backTo="/dashboard"
        />
        <Button onClick={() => setShowEmitir(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Emitir NF-e
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de NF-e</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todas as notas fiscais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emitidas</CardTitle>
            <FileCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emitidas || 0}</div>
            <p className="text-xs text-muted-foreground">
              NF-e autorizadas pela SEFAZ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.canceladas || 0}</div>
            <p className="text-xs text-muted-foreground">
              NF-e canceladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma das NF-e emitidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="inutilizada">Inutilizada</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter("todos");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de NF-e */}
      <Card>
        <CardHeader>
          <CardTitle>Listagem de Notas Fiscais</CardTitle>
          <CardDescription>
            {invoices.length} nota(s) fiscal(is) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.series}</TableCell>
                    <TableCell>{invoice.recipientName}</TableCell>
                    <TableCell>{formatDocument(invoice.recipientDocument)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalInvoice)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {new Date(invoice.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === "emitida" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowCancelar(true);
                              }}
                              title="Cancelar NF-e"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadXML(invoice.id)}
                              title="Baixar XML"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadDANFE(invoice.id)}
                              title="Baixar DANFE (PDF)"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da NF-e #{selectedInvoice?.number}</DialogTitle>
            <DialogDescription>
              Série {selectedInvoice?.series} - {getStatusBadge(selectedInvoice?.status)}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="itens">Itens</TabsTrigger>
                <TabsTrigger value="impostos">Impostos</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Emitente</h3>
                    <p className="text-sm">{selectedInvoice.emitterName}</p>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {formatDocument(selectedInvoice.emitterCnpj)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedInvoice.emitterCity}/{selectedInvoice.emitterState}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Destinatário</h3>
                    <p className="text-sm">{selectedInvoice.recipientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedInvoice.recipientDocument.length === 11 ? "CPF" : "CNPJ"}:{" "}
                      {formatDocument(selectedInvoice.recipientDocument)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedInvoice.recipientCity}/{selectedInvoice.recipientState}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Informações Fiscais</h3>
                    <p className="text-sm">CFOP: {selectedInvoice.cfop}</p>
                    <p className="text-sm">
                      Natureza: {selectedInvoice.natureOperation}
                    </p>
                    <p className="text-sm">
                      Pagamento: {selectedInvoice.paymentMethod}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Valores</h3>
                    <p className="text-sm">
                      Produtos: {formatCurrency(selectedInvoice.totalProducts)}
                    </p>
                    <p className="text-sm">
                      Desconto: {formatCurrency(selectedInvoice.totalDiscount)}
                    </p>
                    <p className="text-sm font-semibold">
                      Total: {formatCurrency(selectedInvoice.totalInvoice)}
                    </p>
                  </div>
                </div>

                {selectedInvoice.accessKey && (
                  <div>
                    <h3 className="font-semibold mb-2">Chave de Acesso</h3>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {selectedInvoice.accessKey}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="itens">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>NCM</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.ncm}</TableCell>
                        <TableCell>{(item.quantity / 100).toFixed(2)}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="impostos">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">ICMS</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(selectedInvoice.totalIcms)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">IPI</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(selectedInvoice.totalIpi)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">PIS</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(selectedInvoice.totalPis)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">COFINS</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(selectedInvoice.totalCofins)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
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
            <DialogTitle>Cancelar NF-e #{selectedInvoice?.number}</DialogTitle>
            <DialogDescription>
              O cancelamento é irreversível. Informe o motivo do cancelamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo do Cancelamento *</Label>
              <Input
                placeholder="Ex: Erro no valor, cliente desistiu da compra..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCancelar(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelInvoice}
                disabled={cancelMutation.isPending || !cancelReason.trim()}
              >
                {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Emissão (placeholder) */}
      <Dialog open={showEmitir} onOpenChange={setShowEmitir}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emitir Nova NF-e</DialogTitle>
            <DialogDescription>
              Funcionalidade em desenvolvimento. Use o PDV para emitir NF-e automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm">
              A emissão manual de NF-e será implementada em breve. Por enquanto, as NF-e são
              emitidas automaticamente através do PDV ao finalizar vendas.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
