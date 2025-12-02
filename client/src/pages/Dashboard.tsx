import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  Wrench,
  AlertCircle
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
          <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div 
                key={i} 
                className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              ></motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Vendas Hoje",
      value: overview?.totalSales || 0,
      subtitle: "Total de vendas realizadas",
      action: "Ir para PDV",
      icon: ShoppingCart,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      textColor: "text-blue-700",
      linkColor: "text-blue-600 hover:text-blue-700",
      onClick: () => setLocation("/vendas"),
      delay: 0.1,
    },
    {
      title: "Receita Total",
      value: formatCurrency(overview?.totalRevenue || 0),
      subtitle: "Receita acumulada",
      action: "Ver Financeiro",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      iconBg: "bg-gradient-to-br from-green-500 to-emerald-500",
      textColor: "text-green-700",
      linkColor: "text-green-600 hover:text-green-700",
      onClick: () => setLocation("/financeiro"),
      delay: 0.2,
    },
    {
      title: "Clientes",
      value: overview?.totalCustomers || 0,
      subtitle: "Clientes cadastrados",
      action: "Gerenciar Clientes",
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
      textColor: "text-purple-700",
      linkColor: "text-purple-600 hover:text-purple-700",
      onClick: () => setLocation("/clientes"),
      delay: 0.3,
    },
    {
      title: "Produtos",
      value: overview?.totalProducts || 0,
      subtitle: "Produtos em estoque",
      action: "Ver Estoque",
      icon: Package,
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-50 to-amber-50",
      iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
      textColor: "text-orange-700",
      linkColor: "text-orange-600 hover:text-orange-700",
      onClick: () => setLocation("/estoque"),
      delay: 0.4,
    },
    {
      title: "OS Abertas",
      value: overview?.openServiceOrders || 0,
      subtitle: "Ordens de serviço pendentes",
      action: "Ver Ordens",
      icon: Wrench,
      gradient: "from-red-500 to-rose-500",
      bgGradient: "from-red-50 to-rose-50",
      iconBg: "bg-gradient-to-br from-red-500 to-rose-500",
      textColor: "text-red-700",
      linkColor: "text-red-600 hover:text-red-700",
      onClick: () => setLocation("/ordem-servico"),
      delay: 0.5,
    },
    {
      title: "Pagamentos Pendentes",
      value: overview?.pendingPayments || 0,
      subtitle: "Contas a receber",
      action: "Ver Financeiro",
      icon: AlertCircle,
      gradient: "from-yellow-500 to-orange-400",
      bgGradient: "from-yellow-50 to-orange-50",
      iconBg: "bg-gradient-to-br from-yellow-500 to-orange-400",
      textColor: "text-yellow-700",
      linkColor: "text-yellow-600 hover:text-yellow-700",
      onClick: () => setLocation("/financeiro"),
      delay: 0.6,
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <PageHeader 
        title="Dashboard" 
        description="Visão geral do seu negócio"
        backTo="/"
      />

      {/* Estatísticas Principais - Grid Responsivo com Animações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: stat.delay }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <Card 
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl border-0 bg-gradient-to-br ${stat.bgGradient}`}
                onClick={stat.onClick}
              >
                {/* Gradiente de fundo sutil */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 hover:opacity-5 transition-opacity duration-300`}></div>
                
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    {stat.title}
                  </CardTitle>
                  <motion.div 
                    className={`p-3 rounded-xl ${stat.iconBg} shadow-lg`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </motion.div>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <motion.div 
                    className={`text-3xl md:text-4xl font-bold ${stat.textColor} mb-2`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: stat.delay + 0.2 }}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-xs text-slate-600 mb-3 font-medium">
                    {stat.subtitle}
                  </p>
                  <motion.p 
                    className={`text-sm font-semibold ${stat.linkColor} flex items-center gap-1 transition-colors`}
                    whileHover={{ x: 4 }}
                  >
                    → {stat.action}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Seção de Insights Rápidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8"
      >
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                💡
              </motion.div>
              Insights Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-200"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-sm font-semibold text-slate-700 mb-1">Taxa de Conversão</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {overview?.totalCustomers && overview?.totalSales 
                    ? ((overview.totalSales / overview.totalCustomers) * 100).toFixed(1) 
                    : 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Vendas por cliente</p>
              </motion.div>

              <motion.div 
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-200"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-sm font-semibold text-slate-700 mb-1">Ticket Médio</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {overview?.totalSales && overview?.totalRevenue 
                    ? formatCurrency(Math.floor(overview.totalRevenue / overview.totalSales)) 
                    : formatCurrency(0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Valor médio por venda</p>
              </motion.div>

              <motion.div 
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-200"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-sm font-semibold text-slate-700 mb-1">Taxa de Ocupação</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {overview?.openServiceOrders || 0} OS
                </p>
                <p className="text-xs text-slate-500 mt-1">Ordens em andamento</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>


    </div>
  );
}
