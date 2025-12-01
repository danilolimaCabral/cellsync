import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  Wrench,
  TrendingUp,
  AlertCircle,
  FileText,
  BarChart3
} from "lucide-react";

// Função auxiliar para formatação de moeda
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(cents / 100);
};

export default function Dashboard() {
  const { data: overview, isLoading } = trpc.dashboard.overview.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Estatísticas Principais - Grid Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Vendas Hoje */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] duration-200"
          onClick={() => setLocation("/vendas")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vendas Hoje
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{overview?.totalSales || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Total de vendas realizadas</p>
            <p className="text-xs font-medium mt-2 text-blue-600">
              → Ir para PDV
            </p>
          </CardContent>
        </Card>

        {/* Receita Total */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] duration-200"
          onClick={() => setLocation("/financeiro")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita Total
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-700">
              {formatCurrency(overview?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Receita acumulada</p>
            <p className="text-xs font-medium mt-2 text-green-600">
              → Ver Financeiro
            </p>
          </CardContent>
        </Card>

        {/* Clientes */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] duration-200"
          onClick={() => setLocation("/clientes")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{overview?.totalCustomers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Clientes cadastrados</p>
            <p className="text-xs font-medium mt-2 text-purple-600">
              → Gerenciar Clientes
            </p>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] duration-200"
          onClick={() => setLocation("/estoque")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              Produtos
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-100">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{overview?.totalProducts || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Produtos em estoque</p>
            <p className="text-xs font-medium mt-2 text-orange-600">
              → Ver Estoque
            </p>
          </CardContent>
        </Card>

        {/* OS Abertas */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] duration-200"
          onClick={() => setLocation("/os")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              OS Abertas
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-100">
              <Wrench className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{overview?.openServiceOrders || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Ordens de serviço em andamento</p>
            <p className="text-xs font-medium mt-2 text-red-600">
              → Ver Ordens
            </p>
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] duration-200"
          onClick={() => setLocation("/financeiro")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pagamentos Pendentes
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{overview?.pendingPayments || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Contas a receber</p>
            <p className="text-xs font-medium mt-2 text-yellow-600">
              → Ver Contas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] duration-200"
            onClick={() => setLocation("/vendas")}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-blue-50">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Nova Venda</h3>
                  <p className="text-xs text-gray-500 mt-1">Abrir PDV para realizar venda</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] duration-200"
            onClick={() => setLocation("/os")}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-orange-50">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Nova OS</h3>
                  <p className="text-xs text-gray-500 mt-1">Criar ordem de serviço</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] duration-200"
            onClick={() => setLocation("/relatorios")}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-purple-50">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Relatórios</h3>
                  <p className="text-xs text-gray-500 mt-1">Ver análises e relatórios</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] duration-200"
            onClick={() => setLocation("/notas-fiscais")}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-green-50">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Notas Fiscais</h3>
                  <p className="text-xs text-gray-500 mt-1">Gerenciar NF-e</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/historico-vendas")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Vendas Recentes
            </CardTitle>
            <CardDescription>Últimas transações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <p className="mb-2">Clique para ver o histórico completo</p>
              <p className="text-sm text-blue-600 font-medium">→ Ir para Histórico de Vendas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/estoque")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>Produtos com estoque baixo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <p className="mb-2">Clique para gerenciar o estoque</p>
              <p className="text-sm text-orange-600 font-medium">→ Ir para Gestão de Estoque</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
