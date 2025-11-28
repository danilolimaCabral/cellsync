import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  Wrench,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function Dashboard() {
  const { data: overview, isLoading } = trpc.dashboard.overview.useQuery();

  const stats = [
    {
      title: "Vendas Hoje",
      value: overview?.totalSales || 0,
      icon: ShoppingCart,
      description: "Total de vendas realizadas",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Receita Total",
      value: `R$ ${((overview?.totalRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      description: "Receita acumulada",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Clientes",
      value: overview?.totalCustomers || 0,
      icon: Users,
      description: "Clientes cadastrados",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Produtos",
      value: overview?.totalProducts || 0,
      icon: Package,
      description: "Produtos em estoque",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "OS Abertas",
      value: overview?.openServiceOrders || 0,
      icon: Wrench,
      description: "Ordens de serviço em andamento",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Pagamentos Pendentes",
      value: overview?.pendingPayments || 0,
      icon: AlertCircle,
      description: "Contas a receber",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Vendas Recentes
            </CardTitle>
            <CardDescription>Últimas transações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              Nenhuma venda registrada ainda
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>Produtos com estoque baixo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              Nenhum alerta no momento
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
