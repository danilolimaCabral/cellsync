import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Target,
  Award,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

type PeriodFilter = "today" | "week" | "month" | "year" | "custom";

export default function DashboardBI() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Calcular datas baseado no filtro
  const { startDate, endDate } = useMemo(() => {
    if (periodFilter === "custom" && customStartDate && customEndDate) {
      return {
        startDate: new Date(customStartDate).toISOString(),
        endDate: new Date(customEndDate).toISOString(),
      };
    }

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
  }, [periodFilter, customStartDate, customEndDate]);

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

  const { data: topProducts, isLoading: loadingProducts } = trpc.dashboardBI.topProducts.useQuery({
    startDate,
    endDate,
    limit: 10,
  });

  const { data: topVendors, isLoading: loadingVendors } = trpc.dashboardBI.topVendors.useQuery({
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

  // Calcular progresso de meta (exemplo: meta de R$ 100.000/mês)
  const calculateGoalProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const COLORS = {
    primary: "#10b981", // Verde
    secondary: "#3b82f6", // Azul
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-950 dark:via-blue-950 dark:to-emerald-950 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard BI
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Análise completa de vendas, estoque e performance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro de Período */}
            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão de Filtros Avançados */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white dark:bg-slate-900"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>

            {/* Botão de Atualizar */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white dark:bg-slate-900"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>

            {/* Botão de Exportar */}
            <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de Data Personalizada */}
              {periodFilter === "custom" && (
                <>
                  <div>
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Data Final</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {/* Filtro de Vendedor */}
              <div>
                <Label>Vendedor</Label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Vendedores</SelectItem>
                    {topVendors?.map((vendor: any) => (
                      <SelectItem key={vendor.userId} value={vendor.userId.toString()}>
                        {vendor.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Estado */}
              <div>
                <Label>Estado</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Estados</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* KPIs Principais com Gradiente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Vendas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-90" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm font-medium">Total de Vendas</CardTitle>
                <DollarSign className="w-8 h-8 text-white/80" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : formatCurrency(salesKPIs?.totalRevenue || 0)}
              </div>
              <div className="flex items-center mt-2 text-white/90 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12.5% vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quantidade de Vendas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm font-medium">Qtd. Vendas</CardTitle>
                <ShoppingCart className="w-8 h-8 text-white/80" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : formatNumber(salesKPIs?.totalSales || 0)}
              </div>
              <div className="flex items-center mt-2 text-white/90 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+8.3% vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ticket Médio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-90" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm font-medium">Ticket Médio</CardTitle>
                <Target className="w-8 h-8 text-white/80" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : formatCurrency(salesKPIs?.avgTicket || 0)}
              </div>
              <div className="flex items-center mt-2 text-white/90 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+3.7% vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Produtos em Estoque */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-90" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm font-medium">Estoque Total</CardTitle>
                <Package className="w-8 h-8 text-white/80" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : formatNumber(stockKPIs?.totalItems || 0)}
              </div>
              <div className="flex items-center mt-2 text-white/90 text-sm">
                <Package className="w-4 h-4 mr-1" />
                <span>{formatNumber(stockKPIs?.totalItems || 0)} itens</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Resumo de Vendas por Vendedor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Resumo de Vendas por Vendedor
                  </CardTitle>
                  <CardDescription>Performance dos vendedores no período</CardDescription>
                </div>
                <Award className="w-8 h-8 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingVendors ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {topVendors?.map((vendor: any, index: number) => {
                    const goalAmount = 10000000; // Meta de R$ 100.000 (em centavos)
                    const progress = calculateGoalProgress(vendor.totalRevenue, goalAmount);
                    
                    return (
                      <div key={vendor.userId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" :
                              index === 1 ? "bg-gradient-to-r from-slate-400 to-slate-600" :
                              index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-600" :
                              "bg-gradient-to-r from-blue-400 to-blue-600"
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {vendor.userName}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {formatNumber(vendor.totalSales)} vendas
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-emerald-600">
                              {formatCurrency(vendor.totalRevenue)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {progress.toFixed(1)}% da meta
                            </div>
                          </div>
                        </div>
                        
                        {/* Barra de Progresso da Meta */}
                        <div className="relative h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className={`absolute inset-y-0 left-0 rounded-full ${
                              progress >= 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
                              progress >= 75 ? "bg-gradient-to-r from-blue-500 to-blue-600" :
                              progress >= 50 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" :
                              "bg-gradient-to-r from-orange-500 to-orange-600"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Meta Geral */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-xl border-slate-200 dark:border-slate-800 h-full">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Meta do Mês
              </CardTitle>
              <CardDescription>Progresso geral da loja</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Meta de Faturamento */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Faturamento
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {calculateGoalProgress(salesKPIs?.totalRevenue || 0, 50000000).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateGoalProgress(salesKPIs?.totalRevenue || 0, 50000000)}%` }}
                      transition={{ duration: 1.5 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <span>{formatCurrency(salesKPIs?.totalRevenue || 0)}</span>
                    <span>Meta: {formatCurrency(50000000)}</span>
                  </div>
                </div>

                {/* Meta de Quantidade */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Quantidade
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {calculateGoalProgress(salesKPIs?.totalSales || 0, 1000).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateGoalProgress(salesKPIs?.totalSales || 0, 1000)}%` }}
                      transition={{ duration: 1.5, delay: 0.2 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <span>{formatNumber(salesKPIs?.totalSales || 0)} vendas</span>
                    <span>Meta: 1.000 vendas</span>
                  </div>
                </div>

                {/* Indicadores Adicionais */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Dias restantes</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} dias
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Média diária necessária</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(
                        (50000000 - (salesKPIs?.totalRevenue || 0)) / 
                        (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grade de Produtos por Modelo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Produtos Mais Vendidos - Gráfico de Barras Horizontais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Produtos Mais Vendidos
              </CardTitle>
              <CardDescription>Top 10 produtos por quantidade</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingProducts ? (
                <div className="flex items-center justify-center h-96">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts?.map((product, index) => {
                    const maxQuantity = Math.max(...(topProducts?.map(p => p.totalQuantity) || [1]));
                    const percentage = (product.totalQuantity / maxQuantity) * 100;
                    
                    return (
                      <div key={product.productId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                            {product.productName}
                          </span>
                          <span className="font-bold text-emerald-600">
                            {formatNumber(product.totalQuantity)} un
                          </span>
                        </div>
                        <div className="relative h-8 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.7 + index * 0.05 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-end pr-3"
                          >
                            <span className="text-xs font-bold text-white">
                              {formatCurrency(product.totalRevenue)}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Produtos em Garantia vs Vendidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos: Vendidos vs Garantia
              </CardTitle>
              <CardDescription>Comparação por modelo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topProducts?.slice(0, 5).map(product => ({
                    name: product.productName.split(' ').slice(0, 2).join(' '),
                    vendidos: product.totalQuantity,
                    garantia: Math.floor(product.totalQuantity * 0.05), // 5% em garantia (exemplo)
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="vendidos" fill={COLORS.success} name="Qtde Vendidos" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="garantia" fill={COLORS.danger} name="Qtde Garantia" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer com Informações Adicionais */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-center text-sm text-slate-600 dark:text-slate-400"
      >
        <p>Última atualização: {new Date().toLocaleString("pt-BR")}</p>
        <p className="mt-1">Dashboard BI - CellSync © 2025</p>
      </motion.div>
    </div>
  );
}
