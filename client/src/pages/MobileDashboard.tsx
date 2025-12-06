import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  LogOut, 
  TrendingUp, 
  Wrench, 
  Package, 
  Users, 
  ShoppingCart, 
  Plus, 
  Box, 
  ClipboardList,
  CheckCircle,
  UserPlus,
  Home,
  Wallet
} from "lucide-react";
import { motion } from "framer-motion";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(cents / 100);
};

export default function MobileDashboard() {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: overview } = trpc.dashboard.overview.useQuery();

  // Dados simulados para atividades recentes (enquanto não temos endpoint específico)
  const recentActivities = [
    {
      title: "Venda finalizada",
      time: "Há 5 minutos",
      value: "R$ 6.999",
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Nova OS criada",
      time: "Há 15 minutos",
      value: "#1234",
      icon: Wrench,
      color: "bg-orange-500",
      textColor: "text-green-600" // Na imagem parece verde o #1234
    },
    {
      title: "Cliente cadastrado",
      time: "Há 1 hora",
      value: "",
      icon: UserPlus,
      color: "bg-purple-500",
      textColor: "text-gray-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Roxo */}
      <div className="bg-[#8B5CF6] p-6 text-white flex justify-between items-center rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={() => logout()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <LogOut className="h-6 w-6" />
        </button>
      </div>

      <div className="p-4 space-y-6 -mt-4">
        {/* Cards Principais (2x2) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Vendas Hoje */}
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="bg-[#10B981] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center text-center h-32"
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <span className="text-xs font-medium opacity-90">Vendas Hoje</span>
            <span className="text-xl font-bold mt-1">
              {overview ? formatCurrency(overview.totalRevenue) : "R$ 0,00"}
            </span>
          </motion.div>

          {/* OS Abertas */}
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="bg-[#F59E0B] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center text-center h-32"
            onClick={() => setLocation("/ordem-servico")}
          >
            <Wrench className="h-6 w-6 mb-2" />
            <span className="text-xs font-medium opacity-90">OS Abertas</span>
            <span className="text-2xl font-bold mt-1">{overview?.openServiceOrders || 0}</span>
          </motion.div>

          {/* Produtos */}
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="bg-[#8B5CF6] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center text-center h-32"
            onClick={() => setLocation("/estoque")}
          >
            <Package className="h-6 w-6 mb-2" />
            <span className="text-xs font-medium opacity-90">Produtos</span>
            <span className="text-2xl font-bold mt-1">{overview?.totalProducts || 0}</span>
          </motion.div>

          {/* Clientes */}
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="bg-[#EC4899] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center text-center h-32"
            onClick={() => setLocation("/clientes")}
          >
            <Users className="h-6 w-6 mb-2" />
            <span className="text-xs font-medium opacity-90">Clientes</span>
            <span className="text-2xl font-bold mt-1">{overview?.totalCustomers || 0}</span>
          </motion.div>
        </div>

        {/* Ações Rápidas */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-yellow-500">⚡</span> Ações Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-[#10B981] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center h-24"
              onClick={() => setLocation("/vendas")}
            >
              <ShoppingCart className="h-6 w-6 mb-2" />
              <span className="text-sm font-bold">Nova Venda</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-[#F59E0B] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center h-24"
              onClick={() => setLocation("/ordem-servico/nova")}
            >
              <Wrench className="h-6 w-6 mb-2" />
              <span className="text-sm font-bold">Nova OS</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-[#8B5CF6] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center h-24"
              onClick={() => setLocation("/clientes/novo")}
            >
              <UserPlus className="h-6 w-6 mb-2" />
              <span className="text-sm font-bold">Novo Cliente</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="bg-[#EC4899] p-4 rounded-2xl text-white shadow-md flex flex-col items-center justify-center h-24"
              onClick={() => setLocation("/estoque")}
            >
              <Box className="h-6 w-6 mb-2" />
              <span className="text-sm font-bold">Ver Estoque</span>
            </motion.button>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-600" /> Atividades Recentes
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${activity.color} text-white`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <span className={`font-bold ${activity.textColor}`}>{activity.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 pb-safe">
        <button className="flex flex-col items-center gap-1 text-[#8B5CF6]" onClick={() => setLocation("/")}>
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-medium">Início</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#8B5CF6]" onClick={() => setLocation("/vendas")}>
          <ShoppingCart className="h-6 w-6" />
          <span className="text-[10px] font-medium">PDV</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#8B5CF6]" onClick={() => setLocation("/estoque")}>
          <Box className="h-6 w-6" />
          <span className="text-[10px] font-medium">Estoque</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#8B5CF6]" onClick={() => setLocation("/ordem-servico")}>
          <Wrench className="h-6 w-6" />
          <span className="text-[10px] font-medium">OS</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#8B5CF6]" onClick={() => setLocation("/clientes")}>
          <Users className="h-6 w-6" />
          <span className="text-[10px] font-medium">Clientes</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#8B5CF6]" onClick={() => setLocation("/financeiro")}>
          <Wallet className="h-6 w-6" />
          <span className="text-[10px] font-medium">Finanças</span>
        </button>
      </div>
    </div>
  );
}
