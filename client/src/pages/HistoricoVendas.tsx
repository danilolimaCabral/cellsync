import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
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
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, Filter, FileSpreadsheet, FileText, Calendar, Printer } from "lucide-react";
import { exportSalesReport } from "@/lib/exportUtils";
import { toast } from "sonner";
import { ThermalReceipt, useThermalPrinter } from "@/components/ThermalReceipt";
import { useEffect } from "react";

export default function HistoricoVendas() {
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const { printThermalReceipt } = useThermalPrinter();

  const { data: selectedSale, isLoading: isLoadingSale, error: saleError } = trpc.sales.getById.useQuery(selectedSaleId!, {
    enabled: !!selectedSaleId,
    retry: false,
  });

  useEffect(() => {
    if (saleError) {
      toast.error("Erro ao carregar dados da venda: " + saleError.message);
      setSelectedSaleId(null);
    }
  }, [saleError]);

  const { data: tenant } = trpc.tenants.getById.useQuery(undefined, {
    staleTime: Infinity,
  });

  const { data: fiscalSettings } = trpc.fiscal.getSettings.useQuery(undefined, {
    staleTime: Infinity,
  });

  useEffect(() => {
    if (selectedSale && selectedSaleId && !isLoadingSale) {
      // Pequeno delay para garantir renderização
      const timer = setTimeout(() => {
        try {
          printThermalReceipt();
        } catch (e) {
          console.error("Erro ao imprimir:", e);
          toast.error("Erro ao abrir janela de impressão");
        } finally {
          setSelectedSaleId(null); // Limpar seleção após imprimir (ou falhar)
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedSale, selectedSaleId, isLoadingSale, printThermalReceipt]);
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    sellerId: undefined as number | undefined,
    customerId: undefined as number | undefined,
    status: undefined as string | undefined,
    paymentMethod: undefined as string | undefined,
    limit: 50,
    offset: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

	  const { data: salesData, isLoading } = trpc.salesHistory.list.useQuery(filters);
	  const { data: users } = trpc.users.list.useQuery({ limit: 100 });

	  const generateReceiptMutation = trpc.sales.generateReceipt.useMutation({
	    onSuccess: (result) => {
	      const byteCharacters = atob(result.pdf);
	      const byteNumbers = new Array(byteCharacters.length);
	      for (let i = 0; i < byteCharacters.length; i++) {
	        byteNumbers[i] = byteCharacters.charCodeAt(i);
	      }
	      const byteArray = new Uint8Array(byteNumbers);
	      const blob = new Blob([byteArray], { type: "application/pdf" });
	      const url = URL.createObjectURL(blob);
	      window.open(url, "_blank");
	      toast.success("Recibo gerado com sucesso!");
	    },
	    onError: (error) => {
	      toast.error("Erro ao gerar recibo: " + error.message);
	    },
	  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      concluida: "default",
      pendente: "secondary",
      cancelada: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleExportExcel = () => {
    if (salesData && salesData.sales.length > 0) {
      const periodLabel = filters.startDate && filters.endDate
        ? `${filters.startDate.toLocaleDateString("pt-BR")}-${filters.endDate.toLocaleDateString("pt-BR")}`
        : "todos";
      const success = exportSalesReport(salesData.sales, periodLabel).toExcel();
      if (success) {
        toast.success("Histórico exportado para Excel com sucesso!");
      } else {
        toast.error("Erro ao exportar histórico");
      }
    }
  };

  const handleExportPDF = () => {
    if (salesData && salesData.sales.length > 0) {
      const periodLabel = filters.startDate && filters.endDate
        ? `${filters.startDate.toLocaleDateString("pt-BR")}-${filters.endDate.toLocaleDateString("pt-BR")}`
        : "todos";
      const success = exportSalesReport(salesData.sales, periodLabel).toPDF();
      if (success) {
        toast.success("Histórico exportado para PDF com sucesso!");
      } else {
        toast.error("Erro ao exportar histórico");
      }
    }
  };

  const filteredSales = salesData?.sales.filter((sale: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      sale.customerName?.toLowerCase().includes(term) ||
      sale.sellerName?.toLowerCase().includes(term) ||
      sale.nfeNumber?.toLowerCase().includes(term) ||
      sale.id.toString().includes(term)
    );
  }) || [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Histórico de Vendas" 
          description="Consulte e exporte vendas realizadas"
          backTo="/dashboard"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={!salesData || salesData.sales.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={!salesData || salesData.sales.length === 0}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value ? new Date(e.target.value) : undefined })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value ? new Date(e.target.value) : undefined })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select
                value={filters.sellerId?.toString() || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, sellerId: value === "all" ? undefined : parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {users?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={filters.paymentMethod || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, paymentMethod: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente, vendedor, NF-e..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Vendas Encontradas: {filteredSales.length} {salesData && `de ${salesData.total} total`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando vendas...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma venda encontrada com os filtros aplicados</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>NF-e</TableHead>
	                    <TableHead>Status</TableHead>
	                    <TableHead className="w-[50px]"></TableHead>
	                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">#{sale.id}</TableCell>
                      <TableCell>{formatDate(sale.saleDate || sale.createdAt)}</TableCell>
                      <TableCell>{sale.customerName || "Cliente não identificado"}</TableCell>
                      <TableCell>{sale.sellerName || "N/A"}</TableCell>
                      <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell className="text-red-600">
                        {sale.discountAmount > 0 ? `-${formatCurrency(sale.discountAmount)}` : "-"}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(sale.finalAmount)}</TableCell>
                      <TableCell>
                        {sale.paymentMethod ? (
                          <Badge variant="outline">{sale.paymentMethod.replace("_", " ")}</Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.nfeIssued ? (
                          <span className="text-green-600 text-sm">{sale.nfeNumber || "Emitida"}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Não emitida</span>
                        )}
                      </TableCell>
	                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
	                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={selectedSaleId === sale.id}
                          onClick={() => {
                            if (sale.nfeIssued) {
                              // TODO: Implementar reimpressão de NF-e
                              toast.info("Reimpressão de NF-e em breve");
                            } else {
                              setSelectedSaleId(sale.id);
                            }
                          }}
                        >
                          {selectedSaleId === sale.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>
	                      </TableCell>
	                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      {filteredSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium mb-1">Total de Vendas</div>
                <div className="text-2xl font-bold text-blue-700">{filteredSales.length}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium mb-1">Receita Total</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(
                    filteredSales.reduce((sum: number, sale: any) => sum + sale.finalAmount, 0)
                  )}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium mb-1">Ticket Médio</div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(
                    filteredSales.reduce((sum: number, sale: any) => sum + sale.finalAmount, 0) /
                      filteredSales.length
                  )}
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 font-medium mb-1">Descontos Aplicados</div>
                <div className="text-2xl font-bold text-orange-700">
                  {formatCurrency(
                    filteredSales.reduce((sum: number, sale: any) => sum + sale.discountAmount, 0)
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recibo Térmico Oculto para Reimpressão */}
      {selectedSale && (
        <div style={{ display: "none" }}>
          <ThermalReceipt
            saleId={selectedSale.id}
            customerName={selectedSale.customer?.name || "Consumidor"}
            items={selectedSale.items.map((item: any) => ({
              name: item.productName || "Produto",
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal || (item.quantity * item.unitPrice),
            }))}
            subtotal={selectedSale.totalAmount}
            discount={selectedSale.discount || 0}
            total={selectedSale.totalAmount - (selectedSale.discount || 0)}
            paymentMethod={selectedSale.paymentMethod || "dinheiro"}
            timestamp={new Date(selectedSale.createdAt)}
            companyName={tenant?.name || "LOJA PADRÃO"}
            companyDocument={tenant?.cnpj || "00.000.000/0000-00"}
            companyAddress={tenant?.address || ""}
            companyPhone={tenant?.phone || ""}
            customerCpf={selectedSale.customer?.cpf}
            customerCnpj={selectedSale.customer?.cnpj}
            customerAddress={selectedSale.customer?.address}
            customerPhone={selectedSale.customer?.phone}
            customerEmail={selectedSale.customer?.email}
            sellerName={selectedSale.seller?.name}
            footerMessage={fiscalSettings?.receiptFooter || undefined}
            isReprint={true}
          />
        </div>
      )}
    </div>
  );
}
