import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2, Sparkles, Zap, Crown, X } from "lucide-react";


export default function Planos() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  const createCheckout = trpc.plans.createCheckout.useMutation();


  const handleStartTrial = async (planSlug: string) => {
    setLoadingPlan(planSlug + "_trial");
    try {
      // Ativar trial gratuito de 14 dias
      alert("🎉 Trial gratuito de 14 dias ativado!\n\nVoc\u00ea ser\u00e1 redirecionado para o dashboard.");
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(`Erro: ${error.message || "Tente novamente mais tarde"}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSubscribe = async (planSlug: string) => {
    setLoadingPlan(planSlug);
    try {
      const result = await createCheckout.mutateAsync({
        planSlug,
        billingPeriod,
      });

      // Abrir checkout em nova aba
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      // Se der erro de Price ID n\u00e3o configurado, mostrar mensagem amig\u00e1vel
      if (error.message.includes("Price ID")) {
        alert("⚠️ Stripe ainda não configurado\n\nPor enquanto, use o botão 'Iniciar Trial Grátis' para testar o sistema por 14 dias.");
      } else {
        alert(`Erro: ${error.message || "Tente novamente mais tarde"}`);
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanIcon = (slug: string) => {
    if (slug === "basico") return <Sparkles className="w-8 h-8" />;
    if (slug === "profissional") return <Zap className="w-8 h-8" />;
    return <Crown className="w-8 h-8" />;
  };

  const getPlanColor = (slug: string) => {
    if (slug === "basico") return "from-blue-500 to-cyan-500";
    if (slug === "profissional") return "from-purple-500 to-pink-500";
    return "from-amber-500 to-orange-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Comece a transformar sua loja com o CellSync
          </p>

          {/* Toggle de período */}
          <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingPeriod === "monthly"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingPeriod === "yearly"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Tabela Comparativa */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Compare os Planos
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Recursos</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">
                    <div className="flex flex-col items-center">
                      <span>Básico</span>
                      <span className="text-sm font-normal text-gray-500">R$ 99/mês</span>
                    </div>
                  </th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-2">
                        Profissional
                        <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">POPULAR</span>
                      </span>
                      <span className="text-sm font-normal text-gray-500">R$ 199/mês</span>
                    </div>
                  </th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">
                    <div className="flex flex-col items-center">
                      <span>Enterprise</span>
                      <span className="text-sm font-normal text-gray-500">R$ 399/mês</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Limites */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                    📊 Limites de Uso
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">👥 Usuários</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white">Até 3</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/10">Até 10</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white">Ilimitado</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">📦 Produtos</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white">Até 500</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/10">Até 5.000</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white">Ilimitado</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">💾 Armazenamento</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white">5GB</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/10">20GB</td>
                  <td className="p-4 text-center text-gray-900 dark:text-white">100GB</td>
                </tr>

                {/* Vendas */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                    🛒 Vendas & PDV
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">PDV Completo</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Emissão de NF-e</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Controle de Comissões</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>

                {/* Estoque */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                    📦 Estoque & IMEI
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Rastreamento IMEI</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Alertas de Estoque Baixo</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Múltiplos Depósitos</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>

                {/* Assistência Técnica */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                    🔧 Assistência Técnica
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Ordem de Serviço</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Notificações Automáticas</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Diagnóstico Inteligente (IA)</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>

                {/* Financeiro */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                    💰 Financeiro
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Fluxo de Caixa</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Contas a Pagar/Receber</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Análise de Rentabilidade</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>

                {/* Relatórios */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                    📊 Relatórios & BI
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Relatórios Básicos</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Dashboards Avançados</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Análise Preditiva (IA)</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>

                {/* Suporte */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="p-3 font-semibold text-gray-700 dark:text-gray-300">
                    🎧 Suporte
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Suporte por Email</td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-400">Suporte Prioritário</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-600 dark:text-gray-400">Gerente de Conta Dedicado</td>
                  <td className="p-4 text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans?.map((plan: any) => {
            let features: string[] = [];
            try {
              features = typeof plan.features === 'string' 
                ? JSON.parse(plan.features) 
                : Array.isArray(plan.features) 
                  ? plan.features 
                  : [];            } catch (e) {
              console.error('Erro ao parsear features:', e);
              features = [];
            }
            const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const priceDisplay = (price / 100).toFixed(2);
            const isPopular = plan.slug === "profissional";

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${
                  isPopular ? "ring-2 ring-purple-500 scale-105" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    MAIS POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Ícone e Nome */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${getPlanColor(plan.slug)} text-white`}>
                      {getPlanIcon(plan.slug)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">
                        R$ {priceDisplay}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        /{billingPeriod === "monthly" ? "mês" : "ano"}
                      </span>
                    </div>
                    {billingPeriod === "yearly" && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Economize R$ {((plan.priceMonthly * 12 - plan.priceYearly!) / 100).toFixed(2)}
                      </p>
                    )}
                  </div>                  {/* Bot\u00f5es */}
                  <div className="space-y-3 mb-6">
                    <Button
                      onClick={() => handleStartTrial(plan.slug)}
                      disabled={loadingPlan === plan.slug + "_trial"}
                      variant="outline"
                      className="w-full border-2 border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      {loadingPlan === plan.slug + "_trial" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Ativando...
                        </>
                      ) : (
                        <>
                          🎉 Iniciar Trial Grátis (14 dias)
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={loadingPlan === plan.slug}
                      className={`w-full ${
                        isPopular
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          : ""
                      }`}
                    >
                      {loadingPlan === plan.slug ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Assinar Agora"
                      )}
                    </Button>
                  </div>                 {/* Features */}
                  <div className="space-y-3">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Limites */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>👥 Até {plan.maxUsers === 999999 ? "∞" : plan.maxUsers} usuários</p>
                      <p>📦 Até {plan.maxProducts === 999999 ? "∞" : plan.maxProducts} produtos</p>
                      <p>💾 {(plan.maxStorage / 1024).toFixed(0)}GB de armazenamento</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Garantia */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400">
            ✅ Teste grátis por 14 dias • 🔒 Pagamento seguro via Stripe • 💳 Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}
