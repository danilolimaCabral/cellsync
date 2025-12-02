import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Loader2, ArrowRight, ArrowLeft, Store, User, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

export default function Cadastro() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Dados do formulário
  const [formData, setFormData] = useState({
    // Passo 1: Dados pessoais
    name: "",
    email: "",
    phone: "",
    
    // Passo 2: Dados da loja
    storeName: "",
    cnpj: "",
    
    // Passo 3: Plano
    planSlug: "profissional" as "basico" | "profissional" | "empresarial",
  });

  const checkEmail = trpc.onboarding.checkEmail.useQuery(
    { email: formData.email },
    { enabled: false }
  );

  const register = trpc.onboarding.register.useMutation();
  const { data: plans } = trpc.plans.list.useQuery();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name || formData.name.length < 3) {
      toast.error("Nome inválido", { description: "Digite seu nome completo" });
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email inválido", { description: "Digite um email válido" });
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      toast.error("Telefone inválido", { description: "Digite um telefone válido" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.storeName || formData.storeName.length < 3) {
      toast.error("Nome da loja inválido", { description: "Digite o nome da sua loja" });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    // Verificar email no passo 1
    if (step === 1) {
      const result = await checkEmail.refetch();
      if (!result.data?.available) {
        toast.error("Email já cadastrado", {
          description: "Este email já está em uso. Faça login ou use outro email.",
        });
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await register.mutateAsync(formData);
      
      toast.success("Cadastro realizado!", {
        description: result.message,
      });

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error: any) {
      toast.error("Erro ao cadastrar", {
        description: error.message || "Tente novamente mais tarde",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Dados Pessoais", icon: User },
    { number: 2, title: "Dados da Loja", icon: Store },
    { number: 3, title: "Escolha o Plano", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Crie sua Conta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Comece seu teste grátis de 14 dias agora mesmo!
          </p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between items-center mb-8 relative">
          {/* Linha de progresso */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -z-10">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.number;
            const isCompleted = step > s.number;

            return (
              <div key={s.number} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-110"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isActive || isCompleted
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Formulário */}
        <Card className="p-8">
          {/* Passo 1: Dados Pessoais */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="João Silva"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="joao@exemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Passo 2: Dados da Loja */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="storeName">Nome da Loja *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => handleInputChange("storeName", e.target.value)}
                  placeholder="Loja de Celulares XYZ"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Você pode adicionar depois nas configurações
                </p>
              </div>
            </div>
          )}

          {/* Passo 3: Escolha do Plano */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Escolha o plano ideal para sua loja
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {plans?.map((plan: any) => {
                  const isSelected = formData.planSlug === plan.slug;
                  const price = (plan.priceMonthly / 100).toFixed(2);

                  return (
                    <button
                      key={plan.id}
                      onClick={() => handleInputChange("planSlug", plan.slug)}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        {isSelected && <Check className="w-5 h-5 text-purple-600" />}
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                        R$ {price}
                        <span className="text-sm font-normal text-gray-500">/mês</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <strong>14 dias de teste grátis</strong> - Sem cartão de crédito necessário
                </p>
              </div>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={checkEmail.isFetching}
                className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {checkEmail.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Já tem uma conta?{" "}
          <a href="/login" className="text-purple-600 hover:underline font-medium">
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
}
