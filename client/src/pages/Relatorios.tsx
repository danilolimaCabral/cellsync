import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Wrench,
  Calendar,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { exportFinancialReport } from "@/lib/exportUtils";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Relatorios() {
  const [period, setPeriod] = useState("30"); // dias
  const [activeTab, setActiveTab] = useState("overview");

  // Calcular datas
  const getDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange(parseInt(period));

  const { user } = useAuth();

  // Queries
  const { data: salesStats } = trpc.reports.salesStats.useQuery({ startDate, endDate }, {
    enabled: !!user,
  });
  const { data: topProducts } = trpc.reports.topProducts.useQuery({ startDate, endDate, limit: 10 }, {
    enabled: !!user,
  });
  const { data: sellerPerformance } = trpc.reports.sellerPerformance.useQuery({ startDate, endDate }, {
    enabled: !!user,
  });
  const { data: serviceOrderStats } = trpc.reports.serviceOrderStats.useQuery({ startDate, endDate }, {
    enabled: !!user,
  });
  const { data: financialKPIs } = trpc.reports.financialKPIs.useQuery({ startDate, endDate }, {
    enabled: !!user,
  });
  const { data: inventoryStats } = trpc.reports.inventoryStats.useQuery(undefined, {
    enabled: !!user,
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  // Cores para gráficos
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

  // Dados para gráfico de vendas por período
  const salesChartData = salesStats?.salesByPeriod.map((item: any) => ({
    date: formatDate(item.date),
    vendas: item.count,
    receita: item.total / 100,
  })) || [];

  // Dados para gráfico de produtos
  const productsChartData = topProducts?.map((item: any) => ({
    name: item.productName.length > 20 ? item.productName.substring(0, 20) + "..." : item.productName,
    quantidade: item.quantity,
    receita: item.revenue / 100,
  })) || [];

  // Dados para gráfico de vendedores
  const sellersChartData = sellerPerformance?.map((item: any) => ({
    name: item.sellerName,
    vendas: item.salesCount,
    receita: item.totalRevenue / 100,
  })) || [];

  // Dados para gráfico de OS por status
  const osStatusData = serviceOrderStats?.byStatus.map((item: any) => ({
    name: item.status,
    value: item.count,
  })) || [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Relatórios e BI" 
          description="Análises e indicadores de performance"
          backTo="/dashboard"
        />
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (financialKPIs) {
                    const periodLabel = `${startDate.toLocaleDateString("pt-BR")}-${endDate.toLocaleDateString("pt-BR")}`;
                    const success = exportFinancialReport(financialKPIs, periodLabel).toExcel();
                    if (success) {
                      toast.success("Relatório exportado para Excel com sucesso!");
                    } else {
                      toast.error("Erro ao exportar relatório");
                    }
                  }
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar para Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (financialKPIs) {
                    const periodLabel = `${startDate.toLocaleDateString("pt-BR")}-${endDate.toLocaleDateString("pt-BR")}`;
                    const success = exportFinancialReport(financialKPIs, periodLabel).toPDF();
                    if (success) {
                      toast.success("Relatório exportado para PDF com sucesso!");
                    } else {
                      toast.error("Erro ao exportar relatório");
                    }
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar para PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards de KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{salesStats?.totalSales || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Receita: {formatCurrency(salesStats?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Ticket médio: {formatCurrency(salesStats?.averageTicket || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(financialKPIs?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialKPIs?.netProfit || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Margem: {financialKPIs?.profitMargin.toFixed(2) || 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Receitas - Despesas no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-600" />
              Ordens de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{serviceOrderStats?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {osStatusData.find((s: any) => s.name === "concluida")?.value || 0} concluídas
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Total de OS abertas no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{inventoryStats?.totalProducts || 0}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              {inventoryStats?.lowStock || 0} com estoque baixo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Valor total: {formatCurrency(inventoryStats?.totalValue || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vendas por Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="vendas"
                        stroke="#3b82f6"
                        name="Quantidade"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="receita"
                        stroke="#10b981"
                        name="Receita (R$)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Sem dados para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Top 10 Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productsChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Sem dados para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Performance de Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sellersChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sellersChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="vendas" fill="#8b5cf6" name="Vendas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Sem dados para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Ordens de Serviço por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {osStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={osStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {osStatusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Sem dados para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendas */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium mb-1">Total de Vendas</div>
                    <div className="text-2xl font-bold text-blue-700">{salesStats?.totalSales || 0}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium mb-1">Receita Total</div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(salesStats?.totalRevenue || 0)}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium mb-1">Ticket Médio</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {formatCurrency(salesStats?.averageTicket || 0)}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Cálculo do Ticket Médio:</strong> Receita Total ÷ Quantidade de Vendas
                  </p>
                  <p className="text-xs text-gray-500">
                    Período analisado: {startDate.toLocaleDateString("pt-BR")} até {endDate.toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {salesChartData.length > 0 && (
                  <div className="pt-4">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="vendas"
                          stroke="#3b82f6"
                          name="Quantidade"
                          strokeWidth={3}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="receita"
                          stroke="#10b981"
                          name="Receita (R$)"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Vendedores e Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sellersChartData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ranking de Vendedores</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sellersChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="vendas" fill="#8b5cf6" name="Quantidade de Vendas" />
                        <Bar yAxisId="right" dataKey="receita" fill="#10b981" name="Receita (R$)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {productsChartData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top 10 Produtos</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={productsChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={200} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade Vendida" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indicadores Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium mb-2">Receitas</div>
                    <div className="text-3xl font-bold text-green-700">
                      {formatCurrency(financialKPIs?.totalRevenue || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Total recebido no período</p>
                  </div>
                  <div className="p-6 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-600 font-medium mb-2">Despesas</div>
                    <div className="text-3xl font-bold text-red-700">
                      {formatCurrency(financialKPIs?.totalExpenses || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Total pago no período</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-6 rounded-lg ${(financialKPIs?.netProfit || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <div className={`text-sm font-medium mb-2 ${(financialKPIs?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      Lucro Líquido
                    </div>
                    <div className={`text-3xl font-bold ${(financialKPIs?.netProfit || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {formatCurrency(financialKPIs?.netProfit || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Receitas - Despesas</p>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium mb-2">Margem de Lucro</div>
                    <div className="text-3xl font-bold text-purple-700">
                      {financialKPIs?.profitMargin.toFixed(2) || 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-2">(Lucro ÷ Receita) × 100</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Cálculos:</strong>
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• <strong>Receitas:</strong> Soma de todas as contas recebidas (status "recebido") no período</li>
                    <li>• <strong>Despesas:</strong> Soma de todas as contas pagas (status "pago") no período</li>
                    <li>• <strong>Lucro Líquido:</strong> Receitas - Despesas</li>
                    <li>• <strong>Margem de Lucro:</strong> (Lucro Líquido ÷ Receitas) × 100</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
