import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Crown, Rocket, Star, Shield } from 'lucide-react';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Iniciante',
      tagline: 'Teste sem risco',
      price: 'Grátis',
      priceSubtext: 'por 14 dias',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Experimente toda a potência do CellSync por 14 dias. Sem cartão de crédito, sem compromisso.',
      icon: Zap,
      color: 'from-slate-500 to-slate-600',
      textColor: 'text-slate-600',
      buttonColor: 'bg-slate-600 hover:bg-slate-700',
      buttonVariant: 'default' as const,
      popular: false,
      features: [
        { name: 'Até 1 usuário', included: true },
        { name: 'Até 100 produtos', included: true },
        { name: 'Até 500 clientes', included: true },
        { name: 'OS e Vendas básicas', included: true },
        { name: 'Estoque simples', included: true },
        { name: 'Suporte por email', included: true },
        { name: 'CRM avançado', included: false },
        { name: 'Financeiro completo', included: false },
        { name: 'Importação de dados', included: false },
        { name: 'API e Webhooks', included: false },
      ],
      cta: 'Iniciar Trial Grátis',
      bonus: null,
    },
    {
      id: 'basic',
      name: 'Básico',
      tagline: 'Perfeito para começar',
      price: 'R$ 79',
      priceSubtext: '/mês',
      monthlyPrice: 79,
      yearlyPrice: 790,
      description: 'Tudo que uma pequena loja precisa para organizar vendas, estoque e clientes. Simples e poderoso.',
      icon: Rocket,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      buttonVariant: 'default' as const,
      popular: false,
      features: [
        { name: 'Até 2 usuários', included: true },
        { name: 'Até 500 produtos', included: true },
        { name: 'Até 1.000 clientes', included: true },
        { name: 'OS, Vendas e Estoque', included: true },
        { name: 'CRM simples', included: true },
        { name: 'Relatórios básicos', included: true },
        { name: 'Suporte por email', included: true },
        { name: 'Financeiro completo', included: false },
        { name: 'Importação de dados', included: false },
        { name: 'API e Webhooks', included: false },
      ],
      cta: 'Começar Agora',
      bonus: '30% desconto no 1º mês',
      discount: '17% off anual',
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
      features: [
        { name: 'Até 5 usuários', included: true },
        { name: 'Até 2.000 produtos', included: true },
        { name: 'Até 5.000 clientes', included: true },
        { name: 'Tudo do Básico', included: true },
        { name: 'CRM avançado', included: true },
        { name: 'Financeiro completo', included: true },
        { name: 'Comissões de vendedores', included: true },
        { name: 'Relatórios avançados', included: true },
        { name: 'Importação de dados (50/mês)', included: true },
        { name: 'Integração WhatsApp', included: true },
        { name: 'Suporte por email + chat', included: true },
        { name: 'API e Webhooks', included: false },
      ],
      cta: 'Escolher Profissional',
      bonus: 'Consulta de setup grátis',
      discount: '17% off anual',
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
      features: [
        { name: 'Até 15 usuários', included: true },
        { name: 'Até 5.000 produtos', included: true },
        { name: 'Até 20.000 clientes', included: true },
        { name: 'Tudo do Profissional', included: true },
        { name: 'Importação de dados (500/mês)', included: true },
        { name: 'API pública', included: true },
        { name: 'Webhooks', included: true },
        { name: 'Integração com contabilidade', included: true },
        { name: 'Relatórios customizáveis', included: true },
        { name: 'Prioridade no suporte', included: true },
        { name: 'Suporte por telefone + chat + email', included: true },
        { name: 'Treinamento de equipe (2h)', included: true },
      ],
      cta: 'Escolher Premium',
      bonus: 'Treinamento de equipe grátis',
      discount: '17% off anual',
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      tagline: 'Solução sob medida',
      price: 'Customizado',
      priceSubtext: 'a partir de R$ 999/mês',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      description: 'Plano customizado com suporte dedicado, SLA garantido e implementação completa.',
      icon: Shield,
      color: 'from-slate-900 to-slate-800',
      textColor: 'text-slate-900',
      buttonColor: 'bg-slate-900 hover:bg-slate-800',
      buttonVariant: 'default' as const,
      popular: false,
      features: [
        { name: 'Usuários ilimitados', included: true },
        { name: 'Produtos ilimitados', included: true },
        { name: 'Clientes ilimitados', included: true },
        { name: 'Tudo do Premium', included: true },
        { name: 'Importação de dados ilimitada', included: true },
        { name: 'Integração customizada', included: true },
        { name: 'Suporte dedicado 24/7', included: true },
        { name: 'SLA garantido', included: true },
        { name: 'Backup customizado', included: true },
        { name: 'Análise de dados avançada (BI)', included: true },
        { name: 'Consultoria estratégica', included: true },
        { name: 'Implementação grátis + 3 meses suporte', included: true },
      ],
      cta: 'Solicitar Demonstração',
      bonus: 'Implementação grátis',
      discount: null,
    },
  ];

  const displayPrice = (plan: typeof plans[0]) => {
    if (plan.id === 'starter' || plan.id === 'enterprise') {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl shadow-lg transition-all hover:shadow-2xl ${
                  plan.popular ? 'ring-2 ring-purple-500 lg:scale-105' : ''
                } ${plan.popular ? 'bg-white' : 'bg-white'}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MAIS POPULAR ⭐
                    </span>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${plan.color} p-6 rounded-t-xl text-white`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-8 h-8" />
                    <div>
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <p className="text-sm opacity-90">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-bold">{displayPrice(plan)}</div>
                    <div className="text-sm opacity-90">{plan.priceSubtext}</div>
                    {plan.discount && (
                      <div className="text-xs mt-2 bg-white/20 px-2 py-1 rounded inline-block">
                        {plan.discount}
                      </div>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed mb-6">{plan.description}</p>

                  <Button
                    className={`w-full ${plan.buttonColor} text-white font-semibold py-2 rounded-lg transition-all`}
                  >
                    {plan.cta}
                  </Button>

                  {plan.bonus && (
                    <p className="text-xs text-center mt-3 opacity-90">🎁 {plan.bonus}</p>
                  )}
                </div>

                {/* Features List */}
                <div className="p-6">
                  <div className="space-y-3">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {plan.features.length > 6 && (
                    <details className="mt-4 pt-4 border-t border-slate-200">
                      <summary className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                        Ver mais recursos →
                      </summary>
                      <div className="space-y-3 mt-3">
                        {plan.features.slice(6).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                            )}
                            <span
                              className={`text-sm ${
                                feature.included ? 'text-slate-700' : 'text-slate-400'
                              }`}
                            >
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantees Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Garantias e Compromissos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '✓',
                title: 'Garantia de 30 dias',
                desc: 'Dinheiro de volta sem perguntas se não gostar',
              },
              {
                icon: '🔓',
                title: 'Sem contrato',
                desc: 'Cancele quando quiser, sem multa ou taxa',
              },
              {
                icon: '🚀',
                title: 'Migração grátis',
                desc: 'Ajudamos a importar seus dados do sistema anterior',
              },
            ].map((guarantee, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-3">{guarantee.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{guarantee.title}</h3>
                <p className="text-slate-600 text-sm">{guarantee.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            O Que Nossos Clientes Dizem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Aumentei minhas vendas em 35% no primeiro mês',
                author: 'João Silva',
                role: 'Loja de Celulares',
                rating: 5,
              },
              {
                quote: 'Economizo 15 horas por semana com a automação',
                author: 'Maria Santos',
                role: 'Distribuidora',
                rating: 5,
              },
              {
                quote: 'Melhor investimento que fiz para meu negócio',
                author: 'Carlos Oliveira',
                role: 'Rede de Lojas',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900">{testimonial.author}</p>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Posso trocar de plano depois?',
                a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A cobrança será ajustada proporcionalmente.',
              },
              {
                q: 'Vocês oferecem suporte?',
                a: 'Claro! Todos os planos incluem suporte. Básico tem email, Profissional tem email + chat, Premium tem telefone 24/7.',
              },
              {
                q: 'Preciso de cartão de crédito para o trial?',
                a: 'Não! O trial de 14 dias é completamente grátis, sem necessidade de cartão de crédito.',
              },
              {
                q: 'E se eu tiver dúvidas antes de comprar?',
                a: 'Agende uma demonstração gratuita! Nosso time mostrará exatamente como o CellSync pode ajudar seu negócio.',
              },
            ].map((faq, idx) => (
              <details key={idx} className="border border-slate-200 rounded-lg p-4 cursor-pointer">
                <summary className="font-semibold text-slate-900 hover:text-purple-600">
                  {faq.q}
                </summary>
                <p className="text-slate-600 mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            Comece com 14 dias grátis. Sem cartão de crédito, sem compromisso.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg">
            Iniciar Trial Grátis Agora
          </Button>
        </div>
      </div>
    </div>
  );
}
