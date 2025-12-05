import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Crown, Rocket, Star, Shield, BarChart3, Users, Package, CreditCard, MessageSquare, Code, Database, Lock, Headphones } from 'lucide-react';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Módulos disponíveis com ícones
  const modules = {
    os: { name: 'OS', icon: Zap, color: 'text-blue-500' },
    vendas: { name: 'Vendas', icon: CreditCard, color: 'text-green-500' },
    estoque: { name: 'Estoque', icon: Package, color: 'text-orange-500' },
    financeiro: { name: 'Financeiro', icon: BarChart3, color: 'text-purple-500' },
    crm: { name: 'CRM', icon: Users, color: 'text-red-500' },
    whatsapp: { name: 'WhatsApp', icon: MessageSquare, color: 'text-green-600' },
    api: { name: 'API', icon: Code, color: 'text-indigo-500' },
    relatorios: { name: 'Relatórios', icon: BarChart3, color: 'text-cyan-500' },
  };

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      tagline: 'Perfeito para começar',
      price: 'R$ 79',
      priceSubtext: '/mês',
      monthlyPrice: 79,
      yearlyPrice: 790,
      description: 'Tudo que uma pequena loja precisa para organizar vendas, estoque e clientes.',
      icon: Rocket,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      buttonVariant: 'default' as const,
      popular: false,
      modules: ['os', 'vendas', 'estoque', 'crm'],
      cta: 'Começar Agora',
      bonus: '30% desconto no 1º mês',
      discount: '17% off anual',
      details: {
        users: '2 usuários',
        products: '500 produtos',
        customers: '1.000 clientes',
        storage: '1 GB',
        support: 'Email',
      },
    },
    {
      id: 'professional',
      name: 'Profissional',
      tagline: 'Escolhido por 60% dos clientes',
      price: 'R$ 199',
      priceSubtext: '/mês',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      description: 'A escolha ideal para lojas em crescimento. Inclui financeiro, comissões e relatórios avançados.',
      icon: Star,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-600',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      buttonVariant: 'default' as const,
      popular: true,
      modules: ['os', 'vendas', 'estoque', 'financeiro', 'crm', 'whatsapp', 'relatorios'],
      cta: 'Escolher Profissional',
      bonus: 'Consulta de setup grátis',
      discount: '17% off anual',
      details: {
        users: '5 usuários',
        products: '2.000 produtos',
        customers: '5.000 clientes',
        storage: '10 GB',
        support: 'Email + Chat',
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: 'Para negócios em expansão',
      price: 'R$ 399',
      priceSubtext: '/mês',
      monthlyPrice: 399,
      yearlyPrice: 3990,
      description: 'Controle total com API, webhooks e integrações customizadas. Ideal para redes de lojas.',
      icon: Crown,
      color: 'from-orange-500 to-red-600',
      textColor: 'text-orange-600',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      buttonVariant: 'default' as const,
      popular: false,
      modules: ['os', 'vendas', 'estoque', 'financeiro', 'crm', 'whatsapp', 'api', 'relatorios'],
      cta: 'Escolher Premium',
      bonus: 'Treinamento grátis',
      discount: '17% off anual',
      details: {
        users: '15 usuários',
        products: '5.000 produtos',
        customers: '20.000 clientes',
        storage: '50 GB',
        support: 'Telefone + Chat + Email',
      },
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      tagline: 'Solução sob medida',
      price: 'Customizado',
      priceSubtext: 'a partir de R$ 999/mês',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      description: 'Plano customizado com suporte dedicado 24/7 e implementação completa.',
      icon: Shield,
      color: 'from-slate-900 to-slate-800',
      textColor: 'text-slate-900',
      buttonColor: 'bg-slate-900 hover:bg-slate-800',
      buttonVariant: 'default' as const,
      popular: false,
      modules: ['os', 'vendas', 'estoque', 'financeiro', 'crm', 'whatsapp', 'api', 'relatorios'],
      cta: 'Solicitar Demonstração',
      bonus: 'Implementação grátis',
      discount: null,
      details: {
        users: 'Ilimitados',
        products: 'Ilimitados',
        customers: 'Ilimitados',
        storage: 'Ilimitado',
        support: 'Suporte dedicado 24/7',
      },
    },
  ];

  const displayPrice = (plan: typeof plans[0]) => {
    if (plan.id === 'enterprise') {
      return plan.price;
    }
    return billingCycle === 'monthly' ? `R$ ${plan.monthlyPrice}` : `R$ ${plan.yearlyPrice}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          Escolha seu Plano
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          Transforme sua loja em um negócio de alto desempenho. Comece grátis, cancele quando quiser.
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${
              billingCycle === 'yearly'
                ? 'bg-green-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              -17%
            </span>
          </button>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          {[
            { icon: '📈', text: 'Aumente vendas em até 40%' },
            { icon: '⏱️', text: 'Economize 10+ horas/semana' },
            { icon: '📊', text: 'Controle total 24/7' },
            { icon: '🔗', text: 'Integração com tudo' },
            { icon: '🇧🇷', text: 'Suporte em português' },
          ].map((benefit, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">{benefit.icon}</div>
              <p className="text-sm text-slate-600">{benefit.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl shadow-lg transition-all hover:shadow-2xl overflow-hidden ${
                  plan.popular ? 'ring-2 ring-purple-500 lg:scale-105' : ''
                } bg-white`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MAIS POPULAR ⭐
                    </span>
                  </div>
                )}

                <div className={`h-2 bg-gradient-to-r ${plan.color}`}></div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${plan.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-sm text-slate-500">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-slate-900">
                      {displayPrice(plan)}
                    </div>
                    <p className="text-sm text-slate-500">{plan.priceSubtext}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-6">{plan.description}</p>

                  {/* Bonus */}
                  {plan.bonus && (
                    <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-900">✨ {plan.bonus}</p>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-6 font-semibold ${plan.buttonColor}`}
                    variant={plan.buttonVariant}
                  >
                    {plan.cta}
                  </Button>

                  {/* Modules Section */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Módulos Inclusos:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {plan.modules.map((moduleKey) => {
                        const module = modules[moduleKey as keyof typeof modules];
                        const ModuleIcon = module.icon;
                        return (
                          <div
                            key={moduleKey}
                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <ModuleIcon className={`h-4 w-4 ${module.color}`} />
                            <span className="text-xs font-medium text-slate-700">{module.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Usuários</p>
                        <p className="text-sm font-semibold text-slate-900">{plan.details.users}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Package className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Produtos</p>
                        <p className="text-sm font-semibold text-slate-900">{plan.details.products}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Clientes</p>
                        <p className="text-sm font-semibold text-slate-900">{plan.details.customers}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Database className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Armazenamento</p>
                        <p className="text-sm font-semibold text-slate-900">{plan.details.storage}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Headphones className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Suporte</p>
                        <p className="text-sm font-semibold text-slate-900">{plan.details.support}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantees Section */}
        <div className="text-center">
          <div className="inline-flex flex-wrap justify-center gap-6 bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-slate-700">Teste grátis por 7 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-slate-700">Pagamento seguro via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-slate-700">Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
