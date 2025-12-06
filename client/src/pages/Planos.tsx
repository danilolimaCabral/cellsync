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
    // Redirecionar direto para onboarding (sem autenticação)
    window.location.href = `/onboarding?trial=${planSlug}`;
  };

  const handleSubscribe = async (planSlug: string) => {
    setLoadingPlan(planSlug);
    
    // Salvar informações do plano no localStorage para usar após pagamento
    localStorage.setItem('pendingSubscription', JSON.stringify({ 
      planSlug, 
      billingPeriod,
      timestamp: Date.now()
    }));
    
    try {
      const result = await createCheckout.mutateAsync({
        planSlug,
        billingPeriod,
      });

      // Redirecionar para checkout do Stripe
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      // Se der erro de Price ID não configurado, mostrar mensagem amigável
      if (error.message.includes("Price ID")) {
        alert("⚠️ Stripe ainda não configurado\n\nPor enquanto, use o botão 'Iniciar Trial Grátis' para testar o sistema por 14 dias.");
      } else {
        alert(`Erro ao criar checkout: ${error.message || "Tente novamente mais tarde"}`);
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
                  </div>                      {/* Botões */}
                  <div className="space-y-3 mb-6">
                    {/* Mostrar trial apenas para Básico e Profissional */}
                    {plan.slug !== "empresarial" && (
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
                            🎉 Iniciar Trial Grátis (7 dias)
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={loadingPlan === plan.slug}
                      className={`w-full ${
                        isPopular
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          : plan.slug === "empresarial"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
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
                  </div>

                  {/* Features */}
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
            ✅ Teste grátis por 7 dias • 🔒 Pagamento seguro via Stripe • 💳 Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}
