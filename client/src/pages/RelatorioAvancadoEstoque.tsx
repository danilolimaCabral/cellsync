import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RelatorioAvancadoEstoque() {
  // Estado de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Estado de filtros
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    supplier: undefined as string | undefined,
    warehouse: undefined as string | undefined,
    grade: undefined as string | undefined,
    readyForSale: undefined as boolean | undefined,
    hasDefect: undefined as boolean | undefined,
    minDaysInStock: undefined as number | undefined,
    maxDaysInStock: undefined as number | undefined,
  });

  // Estado de ordenação
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { user } = useAuth();

  // Queries
  const { data: stockData = [], isLoading: isLoadingStock } = trpc.reports.advancedStock.useQuery(filters, {
    enabled: !!user,
  });
  const { data: metrics, isLoading: isLoadingMetrics } = trpc.reports.stockMetrics.useQuery(filters, {
    enabled: !!user,
  });
  const { data: filterOptions } = trpc.reports.filterOptions.useQuery(undefined, {
    enabled: !!user,
  });

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Aplicar ordenação
  const sortedData = useMemo(() => {
    if (!sortColumn) return stockData;

    return [...stockData].sort((a: any, b: any) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [stockData, sortColumn, sortDirection]);

  // Paginação
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      supplier: undefined,
      warehouse: undefined,
      grade: undefined,
      readyForSale: undefined,
      hasDefect: undefined,
      minDaysInStock: undefined,
      maxDaysInStock: undefined,
    });
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined).length;

  // Exportação Excel
  const handleExportExcel = () => {
    // Preparar dados para exportação
    const exportData = sortedData.map((item: any) => ({
      "Data Entrada": item.entryDate ? format(new Date(item.entryDate), "dd/MM/yyyy") : "-",
      "IMEI": item.imei || "-",
      "Produto": item.productName,
      "SKU": item.sku || "-",
      "Quantidade": item.quantity || 1,
      "Custo (R$)": item.costPrice ? (item.costPrice / 100).toFixed(2) : "0.00",
      "Preço Varejo (R$)": item.salePrice ? (item.salePrice / 100).toFixed(2) : "0.00",
      "Preço Atacado (R$)": item.wholesalePrice ? (item.wholesalePrice / 100).toFixed(2) : "-",
      "Grade": item.grade || "-",
      "Almoxarifado": item.warehouse || "-",
      "Fornecedor": item.supplier || "-",
      "Bateria (%)": item.batteryHealth || "-",
      "Defeito": item.defect || "-",
      "Apto Venda": item.readyForSale ? "Sim" : "Não",
      "Dias em Estoque": item.daysInStock,
    }));

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Data Entrada
      { wch: 18 }, // IMEI
      { wch: 30 }, // Produto
      { wch: 15 }, // SKU
      { wch: 10 }, // Quantidade
      { wch: 12 }, // Custo
      { wch: 15 }, // Preço Varejo
      { wch: 15 }, // Preço Atacado
      { wch: 10 }, // Grade
      { wch: 15 }, // Almoxarifado
      { wch: 20 }, // Fornecedor
      { wch: 10 }, // Bateria
      { wch: 20 }, // Defeito
      { wch: 12 }, // Apto Venda
      { wch: 15 }, // Dias em Estoque
    ];
    ws["!cols"] = colWidths;

    // Download
    const fileName = `relatorio-estoque-${format(new Date(), "dd-MM-yyyy")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Exportação PDF
  const handleExportPDF = () => {
    const doc = new jsPDF("landscape");

    // Título
    doc.setFontSize(16);
    doc.text("Relatório Avançado de Estoque", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 22);

    // Métricas
    if (metrics) {
      doc.setFontSize(9);
      doc.text(`Total de Itens: ${metrics.totalItems}`, 14, 30);
      doc.text(`Valor Total: ${formatCurrency(metrics.totalValue)}`, 80, 30);
      doc.text(`Média de Dias: ${metrics.averageDaysInStock.toFixed(0)}`, 150, 30);
      doc.text(`Itens com Defeito: ${metrics.itemsWithDefect}`, 220, 30);
    }

    // Tabela
    const tableData = sortedData.map((item: any) => [
      item.entryDate ? format(new Date(item.entryDate), "dd/MM/yy") : "-",
      item.imei ? item.imei.substring(0, 12) + "..." : "-",
      item.productName.substring(0, 25),
      formatCurrency(item.salePrice || 0),
      item.grade || "-",
      item.warehouse || "-",
      item.daysInStock,
      item.readyForSale ? "Sim" : "Não",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Data", "IMEI", "Produto", "Preço", "Grade", "Almox.", "Dias", "Apto"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Download
    const fileName = `relatorio-estoque-${format(new Date(), "dd-MM-yyyy")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatório Avançado de Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Análise detalhada de todos os itens em estoque
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Métricas */}
      {!isLoadingMetrics && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Itens cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor de venda total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média de Dias</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageDaysInStock.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Dias em estoque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens com Defeito</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.itemsWithDefect}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Necessitam atenção
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtros Avançados</CardTitle>
              <CardDescription>
                Refine sua pesquisa com múltiplos critérios
              </CardDescription>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fornecedor */}
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={filters.supplier || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, supplier: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filterOptions?.suppliers.map((supplier: string) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Almoxarifado */}
            <div className="space-y-2">
              <Label>Almoxarifado</Label>
              <Select
                value={filters.warehouse || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, warehouse: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filterOptions?.warehouses.map((warehouse: string) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade */}
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select
                value={filters.grade || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, grade: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {filterOptions?.grades.map((grade: string) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="readyForSale"
                checked={filters.readyForSale === true}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, readyForSale: checked ? true : undefined })
                }
              />
              <Label htmlFor="readyForSale" className="cursor-pointer">
                Apenas aptos para venda
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasDefect"
                checked={filters.hasDefect === true}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, hasDefect: checked ? true : undefined })
                }
              />
              <Label htmlFor="hasDefect" className="cursor-pointer">
                Apenas com defeito
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Itens em Estoque ({sortedData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStock ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("entryDate")}>
                        <div className="flex items-center gap-1">
                          Data Entrada
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>IMEI</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("productName")}>
                        <div className="flex items-center gap-1">
                          Produto
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer" onClick={() => handleSort("salePrice")}>
                        <div className="flex items-center justify-end gap-1">
                          Preço Varejo
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer" onClick={() => handleSort("daysInStock")}>
                        <div className="flex items-center justify-end gap-1">
                          Dias em Estoque
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum item encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.entryDate
                              ? format(new Date(item.entryDate), "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.imei || "-"}</TableCell>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.salePrice || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                item.daysInStock > 90
                                  ? "destructive"
                                  : item.daysInStock > 60
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {item.daysInStock} dias
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {item.readyForSale && (
                                <Badge variant="default" className="bg-green-600">
                                  Apto
                                </Badge>
                              )}
                              {item.defect && (
                                <Badge variant="destructive">Defeito</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Label>Itens por página:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length}{" "}
                    registros
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
