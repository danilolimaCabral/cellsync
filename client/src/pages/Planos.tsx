import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, Zap, Crown, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function Planos() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    plan: any | null;
  }>({ open: false, plan: null });
  
  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  const createCheckout = trpc.plans.createCheckout.useMutation();


  const openConfirmDialog = (plan: any) => {
    setConfirmDialog({ open: true, plan });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, plan: null });
  };

  const handleConfirmSubscribe = async () => {
    if (!confirmDialog.plan) return;
    
    const planSlug = confirmDialog.plan.slug;
    setLoadingPlan(planSlug);
    closeConfirmDialog();
    
    try {
      const result = await createCheckout.mutateAsync({
        planSlug,
        billingPeriod,
      });

      // Abrir checkout em nova aba
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
        toast.success("Redirecionando para pagamento", {
          description: "Uma nova aba foi aberta com o checkout seguro do Stripe.",
        });
      }
    } catch (error: any) {
      toast.error("Erro ao processar contratação", {
        description: error.message || "Tente novamente mais tarde.",
      });
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
            const features = plan.features as string[];
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
                  </div>

                  {/* Botão */}
                  <Button
                    onClick={() => openConfirmDialog(plan)}
                    disabled={loadingPlan === plan.slug}
                    className={`w-full mb-6 ${
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
            ✅ Teste grátis por 14 dias • 🔒 Pagamento seguro via Stripe • 💳 Cancele quando quiser
          </p>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              Confirmar Contratação
            </DialogTitle>
            <DialogDescription>
              Você está prestes a contratar o seguinte plano:
            </DialogDescription>
          </DialogHeader>

          {confirmDialog.plan && (
            <div className="space-y-4 py-4">
              {/* Resumo do Plano */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getPlanColor(confirmDialog.plan.slug)} text-white`}>
                    {getPlanIcon(confirmDialog.plan.slug)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {confirmDialog.plan.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {confirmDialog.plan.description}
                    </p>
                  </div>
                </div>

                {/* Preço */}
                <div className="flex items-baseline gap-2 justify-center py-3 border-t border-purple-200 dark:border-purple-800">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    R$ {(
                      (billingPeriod === "monthly" 
                        ? confirmDialog.plan.priceMonthly 
                        : confirmDialog.plan.priceYearly) / 100
                    ).toFixed(2)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{billingPeriod === "monthly" ? "mês" : "ano"}
                  </span>
                </div>

                {billingPeriod === "yearly" && (
                  <p className="text-sm text-green-600 dark:text-green-400 text-center">
                    🎉 Economize R$ {(
                      (confirmDialog.plan.priceMonthly * 12 - confirmDialog.plan.priceYearly!) / 100
                    ).toFixed(2)} por ano!
                  </p>
                )}
              </div>

              {/* Informações Importantes */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  14 dias de teste grátis
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Cancele quando quiser
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Pagamento seguro via Stripe
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeConfirmDialog}
              disabled={loadingPlan !== null}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSubscribe}
              disabled={loadingPlan !== null}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loadingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Contratação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
