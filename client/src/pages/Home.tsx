import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ShoppingCart, 
  Package, 
  Wrench, 
  TrendingUp, 
  Users,
  CheckCircle,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";

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
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500"></div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: ShoppingCart,
      title: "PDV Completo",
      description: "Sistema de vendas integrado com emissão de NF-e e controle de comissões",
      gradient: "from-blue-500 to-purple-500",
    },
    {
      icon: Package,
      title: "Estoque com IMEI",
      description: "Rastreamento individual de cada aparelho com alertas automáticos",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Wrench,
      title: "Ordem de Serviço",
      description: "Gestão completa de reparos com notificações automáticas",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      title: "CRM Avançado",
      description: "Gestão de clientes com programa de fidelidade e segmentação",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: TrendingUp,
      title: "Business Intelligence",
      description: "Dashboards e relatórios em tempo real para tomada de decisão",
      gradient: "from-purple-500 to-blue-500",
    },
    {
      icon: BarChart3,
      title: "Controle Financeiro",
      description: "Fluxo de caixa, contas a pagar/receber e análise de rentabilidade",
      gradient: "from-cyan-500 to-blue-500",
    },
  ];

  const benefits = [
    { icon: Zap, text: "Controle absoluto de estoque com rastreamento IMEI" },
    { icon: TrendingUp, text: "Fluxo de caixa em tempo real" },
    { icon: Wrench, text: "Gestão completa de ordens de serviço" },
    { icon: BarChart3, text: "Relatórios e análises preditivas" },
    { icon: Users, text: "Programa de fidelidade integrado" },
    { icon: Shield, text: "Segurança e conformidade com LGPD" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section com Gradiente */}
      <div className="relative overflow-hidden">
        {/* Background Gradiente Sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60"></div>
        
        {/* Padrão de Ondas (Opcional) */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z" fill="url(#gradient1)" />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src="/cellsync-logo.png" 
                alt="CellSync" 
                className="h-16 md:h-20 w-auto"
              />
            </div>
            
            {/* Título Principal */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                CellSync
              </span>
            </h1>
            
            {/* Subtítulo */}
            <p className="text-xl md:text-2xl text-slate-600 mb-4 leading-relaxed">
              Sistema completo de gestão para lojas de celular,
            </p>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
              assistências técnicas e importadoras
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => setLocation("/login")}
                className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0"
              >
                <Zap className="mr-2 h-5 w-5" />
                Acessar Sistema
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-10 py-7 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
              >
                Saiba Mais
              </Button>
            </div>

            {/* Badge de Destaque */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-purple-100">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-slate-700">
                Teste grátis por 14 dias • Sem cartão de crédito
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Gerencie vendas, estoque, ordens de serviço e financeiro com inteligência e eficiência
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-purple-200 hover:-translate-y-2"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section com Gradiente */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-10 md:p-16 border border-slate-200">
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
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-700 text-lg leading-relaxed">{benefit.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA Secundário */}
            <div className="mt-12 text-center">
              <Button 
                size="lg"
                onClick={() => setLocation("/login")}
                className="text-lg px-12 py-7 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0"
              >
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section (Opcional) */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { number: "1.000+", label: "Clientes Ativos", gradient: "from-blue-500 to-purple-500" },
            { number: "99.9%", label: "Uptime Garantido", gradient: "from-purple-500 to-pink-500" },
            { number: "24/7", label: "Suporte Disponível", gradient: "from-pink-500 to-rose-500" },
          ].map((stat, index) => (
            <div key={index} className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-3`}>
                {stat.number}
              </div>
              <div className="text-slate-600 text-lg font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/cellsync-icon.png" alt="CellSync" className="h-10 w-10" />
              <span className="text-slate-900 font-semibold text-lg">CellSync</span>
            </div>
            
            <div className="text-center text-slate-600">
              <p>© 2025 CellSync. Sistema de Gestão para Lojas de Celular.</p>
            </div>

            <div className="flex gap-6">
              <a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">
                Termos
              </a>
              <a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-slate-600 hover:text-purple-600 transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
