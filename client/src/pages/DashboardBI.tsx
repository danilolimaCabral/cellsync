import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

type PeriodFilter = "today" | "week" | "month" | "year";

export default function DashboardBI() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calcular datas baseado no filtro
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (periodFilter) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [periodFilter]);

  // Queries
  const { data: salesKPIs, isLoading: loadingSales, refetch: refetchSales } = trpc.dashboardBI.salesKPIs.useQuery({
    startDate,
    endDate,
  });

  const { data: stockKPIs, isLoading: loadingStock, refetch: refetchStock } = trpc.dashboardBI.stockKPIs.useQuery();

  const { data: financialKPIs, isLoading: loadingFinancial, refetch: refetchFinancial } = trpc.dashboardBI.financialKPIs.useQuery({
    startDate,
    endDate,
  });

  const { data: salesTimeline, isLoading: loadingTimeline } = trpc.dashboardBI.salesTimeline.useQuery({
    startDate,
    endDate,
    groupBy: periodFilter === "today" || periodFilter === "week" ? "day" : periodFilter === "month" ? "day" : "month",
  });

  const { data: topProducts, isLoading: loadingProducts } = trpc.dashboardBI.topProducts.useQuery({
    startDate,
    endDate,
    limit: 10,
  });

  const isLoading = loadingSales || loadingStock || loadingFinancial;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchSales(), refetchStock(), refetchFinancial()]);
    setIsRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard BI</h1>
          <p className="text-muted-foreground">
            Análise em tempo real de vendas, estoque e finanças
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita Total */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(salesKPIs?.totalRevenue || 0)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {salesKPIs && salesKPIs.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={salesKPIs && salesKPIs.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                      {salesKPIs?.revenueGrowth.toFixed(1)}%
                    </span>
                    <span className="ml-1">vs período anterior</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Total de Vendas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatNumber(salesKPIs?.totalSales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ticket médio: {formatCurrency(salesKPIs?.avgTicket || 0)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Estoque */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stockKPIs?.totalValue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(stockKPIs?.availableItems || 0)} itens disponíveis
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Lucro Líquido */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(financialKPIs?.netProfit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margem: {financialKPIs?.profitMargin.toFixed(1)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alertas */}
      {stockKPIs && stockKPIs.defectItems > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Atenção: Itens com Defeito
            </CardTitle>
            <CardDescription className="text-orange-700">
              Existem {stockKPIs.defectItems} itens marcados com defeito no estoque
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Vendas ao Longo do Tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução da receita no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTimeline ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : salesTimeline && salesTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Receita"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível para o período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Produtos Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 10 produtos por quantidade</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : topProducts && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="productName" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="totalQuantity" fill="#8b5cf6" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível para o período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Receita vs Despesas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Receita vs Despesas</CardTitle>
            <CardDescription>Comparativo financeiro do período</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFinancial ? (
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            ) : financialKPIs ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Financeiro",
                      Receita: financialKPIs.revenue / 100,
                      Despesas: financialKPIs.expenses / 100,
                      Lucro: financialKPIs.netProfit / 100,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="Receita" fill="#10b981" />
                  <Bar dataKey="Despesas" fill="#ef4444" />
                  <Bar dataKey="Lucro" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
