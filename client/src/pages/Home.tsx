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
  CheckCircle 
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const features = [
    {
      icon: ShoppingCart,
      title: "PDV Completo",
      description: "Sistema de vendas integrado com emissão de NF-e e controle de comissões",
    },
    {
      icon: Package,
      title: "Estoque com IMEI",
      description: "Rastreamento individual de cada aparelho com alertas automáticos",
    },
    {
      icon: Wrench,
      title: "Ordem de Serviço",
      description: "Gestão completa de reparos com notificações automáticas",
    },
    {
      icon: Users,
      title: "CRM Avançado",
      description: "Gestão de clientes com programa de fidelidade e segmentação",
    },
    {
      icon: TrendingUp,
      title: "Business Intelligence",
      description: "Dashboards e relatórios em tempo real para tomada de decisão",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">OK</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            OkCells
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Sistema completo de gestão para lojas de celular, assistências técnicas e importadoras
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation("/login")}
              className="text-lg px-8 py-6"
            >
              Acessar Sistema
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Por que escolher o OkCells?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Controle absoluto de estoque com rastreamento IMEI",
              "Fluxo de caixa em tempo real",
              "Gestão completa de ordens de serviço",
              "Relatórios e análises preditivas",
              "Programa de fidelidade integrado",
              "Segurança e conformidade com LGPD",
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 OkCells. Sistema de Gestão para Lojas de Celular.</p>
        </div>
      </footer>
    </div>
  );
}
