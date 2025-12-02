import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Package, 
  Wrench, 
  TrendingUp, 
  Users,
  CheckCircle,
  Zap,
  Shield,
  BarChart3,
  Sparkles
} from "lucide-react";
import { SalesChatbot } from "@/components/SalesChatbot";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500"></div>
        </motion.div>
      </div>
    );
  }

  const features = [
    {
      icon: ShoppingCart,
      title: "PDV Completo",
      description: "Sistema de vendas integrado com emissão de NF-e e controle de comissões",
      gradient: "from-blue-500 to-purple-500",
      delay: 0.1,
    },
    {
      icon: Package,
      title: "Estoque com IMEI",
      description: "Rastreamento individual de cada aparelho com alertas automáticos",
      gradient: "from-purple-500 to-pink-500",
      delay: 0.2,
    },
    {
      icon: Wrench,
      title: "Ordem de Serviço",
      description: "Gestão completa de reparos com notificações automáticas",
      gradient: "from-blue-500 to-cyan-500",
      delay: 0.3,
    },
    {
      icon: Users,
      title: "CRM Avançado",
      description: "Gestão de clientes com programa de fidelidade e segmentação",
      gradient: "from-pink-500 to-rose-500",
      delay: 0.4,
    },
    {
      icon: TrendingUp,
      title: "Business Intelligence",
      description: "Dashboards e relatórios em tempo real para tomada de decisão",
      gradient: "from-purple-500 to-blue-500",
      delay: 0.5,
    },
    {
      icon: BarChart3,
      title: "Controle Financeiro",
      description: "Fluxo de caixa, contas a pagar/receber e análise de rentabilidade",
      gradient: "from-cyan-500 to-blue-500",
      delay: 0.6,
    },
  ];

  const benefits = [
    { icon: Zap, text: "Controle absoluto de estoque com rastreamento IMEI", delay: 0.1 },
    { icon: TrendingUp, text: "Fluxo de caixa em tempo real", delay: 0.2 },
    { icon: Wrench, text: "Gestão completa de ordens de serviço", delay: 0.3 },
    { icon: BarChart3, text: "Relatórios e análises preditivas", delay: 0.4 },
    { icon: Users, text: "Programa de fidelidade integrado", delay: 0.5 },
    { icon: Shield, text: "Segurança e conformidade com LGPD", delay: 0.6 },
  ];

  const stats = [
    { number: "1.000+", label: "Clientes Ativos", gradient: "from-blue-500 to-purple-500", delay: 0.1 },
    { number: "99.9%", label: "Uptime Garantido", gradient: "from-purple-500 to-pink-500", delay: 0.2 },
    { number: "24/7", label: "Suporte Disponível", gradient: "from-pink-500 to-rose-500", delay: 0.3 },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section com Gradiente */}
      <div className="relative overflow-hidden">
        {/* Background Gradiente Sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60"></div>
        
        {/* Padrão de Ondas Animado */}
        <motion.div 
          className="absolute inset-0 opacity-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1 }}
        >
          <svg className="w-full h-full" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z" 
              fill="url(#gradient1)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo com Fade-in */}
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <motion.img 
                src="/cellsync-logo.png" 
                alt="CellSync" 
                className="h-16 md:h-20 w-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </motion.div>
            
            {/* Título Principal com Slide-up */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                CellSync
              </span>
            </motion.h1>
            
            {/* Subtítulo com Fade-in */}
            <motion.p 
              className="text-xl md:text-2xl text-slate-600 mb-4 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Sistema completo de gestão para lojas de celular,
            </motion.p>
            <motion.p 
              className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              assistências técnicas e importadoras
            </motion.p>

            {/* CTAs com Animação */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  onClick={() => setLocation("/login")}
                  className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl transition-all duration-300 border-0 relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <Zap className="mr-2 h-5 w-5 relative z-10" />
                  <span className="relative z-10">Acessar Sistema</span>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-10 py-7 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Saiba Mais
                </Button>
              </motion.div>
            </motion.div>

            {/* Badge de Destaque com Animação */}
            <motion.div 
              className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-purple-100"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-slate-700">
                Teste grátis por 14 dias • Sem cartão de crédito
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid com Stagger Animation */}
      <div className="container mx-auto px-4 py-20">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Gerencie vendas, estoque, ordens de serviço e financeiro com inteligência e eficiência
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: feature.delay }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-purple-200 h-full">
                  <motion.div 
                    className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section com Gradiente e Animações */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-10 md:p-16 border border-slate-200"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Por que escolher o CellSync?
                </span>
              </h2>
              <p className="text-xl text-slate-600">
                Recursos pensados para o seu negócio crescer
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div 
                    key={index} 
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: benefit.delay }}
                    whileHover={{ x: 4 }}
                  >
                    <motion.div 
                      className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </motion.div>
                    <span className="text-slate-700 text-lg leading-relaxed">{benefit.text}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Secundário */}
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg"
                  onClick={() => setLocation("/login")}
                  className="text-lg px-12 py-7 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl transition-all duration-300 border-0"
                >
                  Começar Agora
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section com Animações */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: stat.delay }}
              whileHover={{ y: -8 }}
            >
              <motion.div 
                className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-3`}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: stat.delay + 0.2, type: "spring" }}
              >
                {stat.number}
              </motion.div>
              <div className="text-slate-600 text-lg font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img src="/cellsync-icon.png" alt="CellSync" className="h-10 w-10" />
              <span className="text-slate-900 font-semibold text-lg">CellSync</span>
            </motion.div>
            
            <motion.div 
              className="text-center text-slate-600"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p>© 2025 CellSync. Sistema de Gestão para Lojas de Celular.</p>
            </motion.div>

            <motion.div 
              className="flex gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">
                Termos
              </a>
              <a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">
                Contato
              </a>
            </motion.div>
          </div>
        </div>
      </footer>

      {/* Chatbot de Vendas */}
      <SalesChatbot />
    </div>
  );
}
