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

export default function Dashboard() {
  const { data: overview, isLoading } = trpc.dashboard.overview.useQuery();
  const [, setLocation] = useLocation();

  const stats = [
    {
      title: "Vendas Hoje",
      value: overview?.totalSales || 0,
      icon: ShoppingCart,
      description: "Total de vendas realizadas",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/vendas",
      action: "Ir para PDV",
    },
    {
      title: "Receita Total",
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((overview?.totalRevenue || 0) / 100),
      icon: DollarSign,
      description: "Receita acumulada",
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/financeiro",
      action: "Ver Financeiro",
    },
    {
      title: "Clientes",
      value: overview?.totalCustomers || 0,
      icon: Users,
      description: "Clientes cadastrados",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/clientes",
      action: "Gerenciar Clientes",
    },
    {
      title: "Produtos",
      value: overview?.totalProducts || 0,
      icon: Package,
      description: "Produtos em estoque",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      link: "/estoque",
      action: "Ver Estoque",
    },
    {
      title: "OS Abertas",
      value: overview?.openServiceOrders || 0,
      icon: Wrench,
      description: "Ordens de serviço em andamento",
      color: "text-red-600",
      bgColor: "bg-red-100",
      link: "/os",
      action: "Ver Ordens",
    },
    {
      title: "Pagamentos Pendentes",
      value: overview?.pendingPayments || 0,
      icon: AlertCircle,
      description: "Contas a receber",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      link: "/financeiro",
      action: "Ver Contas",
    },
  ];

  // Atalhos rápidos adicionais
  const quickActions = [
    {
      title: "Nova Venda",
      description: "Abrir PDV para realizar venda",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/vendas",
    },
    {
      title: "Nova OS",
      description: "Criar ordem de serviço",
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/os",
    },
    {
      title: "Relatórios",
      description: "Ver análises e relatórios",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/relatorios",
    },
    {
      title: "Notas Fiscais",
      description: "Gerenciar NF-e",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/notas-fiscais",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Estatísticas Principais - Clicáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 duration-200"
              onClick={() => setLocation(stat.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                <p className={`text-xs font-medium mt-2 ${stat.color}`}>
                  → {stat.action}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Atalhos Rápidos */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-md transition-all cursor-pointer hover:scale-105 duration-200"
                onClick={() => setLocation(action.link)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${action.bgColor}`}>
                      <Icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Seção de Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
