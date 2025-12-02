import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Settings, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Dados do formulário
  const [formData, setFormData] = useState({
    // Etapa 1: Dados da Empresa
    cnpj: "",
    razaoSocial: "",
    nomeFantasia: "",
    
    // Etapa 2: Endereço
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    
    // Etapa 3: Contato
    telefone: "",
    email: "",
    whatsapp: "",
  });

  const completeOnboarding = trpc.tenant.completeOnboarding.useMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }));
          toast.success("CEP encontrado!");
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      }
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.cnpj || !formData.razaoSocial || !formData.nomeFantasia) {
          toast.error("Preencha todos os campos obrigatórios");
          return false;
        }
        // Validação básica de CNPJ (14 dígitos)
        const cnpj = formData.cnpj.replace(/\D/g, "");
        if (cnpj.length !== 14) {
          toast.error("CNPJ inválido");
          return false;
        }
        return true;
      
      case 2:
        if (!formData.cep || !formData.logradouro || !formData.numero || 
            !formData.bairro || !formData.cidade || !formData.estado) {
          toast.error("Preencha todos os campos obrigatórios");
          return false;
        }
        return true;
      
      case 3:
        if (!formData.telefone || !formData.email) {
          toast.error("Preencha todos os campos obrigatórios");
          return false;
        }
        // Validação básica de email
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
          toast.error("Email inválido");
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (!validateStep(3)) return;
    
    setLoading(true);
    try {
      await completeOnboarding.mutateAsync(formData);
      toast.success("🎉 Cadastro concluído com sucesso!");
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao completar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Dados da Empresa", icon: Building2 },
    { id: 2, title: "Endereço", icon: MapPin },
    { id: 3, title: "Contato", icon: Phone },
    { id: 4, title: "Confirmação", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bem-vindo ao CellSync! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vamos configurar sua conta em poucos passos
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Etapa 1: Dados da Empresa */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  maxLength={18}
                />
              </div>
              <div>
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  placeholder="Empresa LTDA"
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                <Input
                  id="nomeFantasia"
                  placeholder="Minha Loja"
                  value={formData.nomeFantasia}
                  onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Etapa 2: Endereço */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => handleInputChange("cep", e.target.value)}
                  onBlur={handleCepBlur}
                  maxLength={9}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="logradouro">Logradouro *</Label>
                  <Input
                    id="logradouro"
                    placeholder="Rua, Avenida..."
                    value={formData.logradouro}
                    onChange={(e) => handleInputChange("logradouro", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    placeholder="123"
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Sala, Andar..."
                  value={formData.complemento}
                  onChange={(e) => handleInputChange("complemento", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    placeholder="Centro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange("bairro", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="São Paulo"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  placeholder="SP"
                  value={formData.estado}
                  onChange={(e) => handleInputChange("estado", e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>
          )}

          {/* Etapa 3: Contato */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 0000-0000"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@empresa.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Etapa 4: Confirmação */}
          {currentStep === 4 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Tudo Pronto!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Revise suas informações e clique em "Concluir" para começar a usar o CellSync.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-left space-y-3">
                <div>
                  <span className="font-semibold">Empresa:</span> {formData.nomeFantasia}
                </div>
                <div>
                  <span className="font-semibold">CNPJ:</span> {formData.cnpj}
                </div>
                <div>
                  <span className="font-semibold">Endereço:</span> {formData.logradouro}, {formData.numero} - {formData.bairro}, {formData.cidade}/{formData.estado}
                </div>
                <div>
                  <span className="font-semibold">Contato:</span> {formData.telefone} | {formData.email}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && currentStep < 4 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          
          <div className="ml-auto">
            {currentStep < 3 && (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 3 && (
              <Button onClick={() => setCurrentStep(4)}>
                Revisar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 4 && (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Concluindo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Concluir Cadastro
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
