import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  Phone, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  ArrowLeft,
  Search
} from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);

  // Dados do formulário
  const [formData, setFormData] = useState({
    // Etapa 1: Dados da Empresa (preenchido automaticamente via CNPJ)
    cnpj: "",
    razaoSocial: "",
    nomeFantasia: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    
    // Etapa 2: Contato
    telefone: "",
    email: "",
    whatsapp: "",
  });

  const completeOnboarding = trpc.tenant.completeOnboarding.useMutation();
  const lookupCNPJ = trpc.cnpj.lookup.useMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchCNPJ = async () => {
    const cnpj = formData.cnpj.replace(/\D/g, "");
    
    if (cnpj.length !== 14) {
      toast.error("Digite um CNPJ válido com 14 dígitos");
      return;
    }

    setSearchingCNPJ(true);
    try {
      const result = await lookupCNPJ.mutateAsync({ cnpj });
      
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          cnpj: result.data.cnpj,
          razaoSocial: result.data.razaoSocial,
          nomeFantasia: result.data.nomeFantasia,
          cep: result.data.cep,
          logradouro: result.data.logradouro,
          numero: result.data.numero,
          complemento: result.data.complemento,
          bairro: result.data.bairro,
          cidade: result.data.municipio,
          estado: result.data.uf,
          telefone: result.data.telefone || "",
          email: result.data.email || "",
        }));
        toast.success("Dados da empresa encontrados!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar CNPJ");
    } finally {
      setSearchingCNPJ(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.cnpj || !formData.razaoSocial || !formData.nomeFantasia) {
          toast.error("Preencha todos os campos obrigatórios");
          return false;
        }
        if (!formData.cep || !formData.logradouro || !formData.numero || 
            !formData.bairro || !formData.cidade || !formData.estado) {
          toast.error("Preencha o endereço completo");
          return false;
        }
        return true;
      
      case 2:
        if (!formData.telefone || !formData.email) {
          toast.error("Preencha todos os campos obrigatórios");
          return false;
        }
        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      await completeOnboarding.mutateAsync(formData);
      toast.success("Cadastro concluído! Bem-vindo ao CellSync!");
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao completar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dados da Empresa</h2>
                <p className="text-gray-600">Busque pelo CNPJ para preencher automaticamente</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", e.target.value)}
                    maxLength={18}
                  />
                  <Button
                    type="button"
                    onClick={handleSearchCNPJ}
                    disabled={searchingCNPJ}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {searchingCNPJ ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Digite o CNPJ e clique na lupa para buscar automaticamente
                </p>
              </div>

              <div>
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  placeholder="Nome registrado na Receita Federal"
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                <Input
                  id="nomeFantasia"
                  placeholder="Nome comercial da sua loja"
                  value={formData.nomeFantasia}
                  onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                />
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Endereço</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => handleInputChange("cep", e.target.value)}
                      maxLength={9}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="logradouro">Logradouro *</Label>
                    <Input
                      id="logradouro"
                      placeholder="Rua, Avenida, etc"
                      value={formData.logradouro}
                      onChange={(e) => handleInputChange("logradouro", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      placeholder="123"
                      value={formData.numero}
                      onChange={(e) => handleInputChange("numero", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      placeholder="Sala, Andar, etc"
                      value={formData.complemento}
                      onChange={(e) => handleInputChange("complemento", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input
                      id="bairro"
                      placeholder="Nome do bairro"
                      value={formData.bairro}
                      onChange={(e) => handleInputChange("bairro", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      placeholder="Nome da cidade"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange("cidade", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      placeholder="UF"
                      value={formData.estado}
                      onChange={(e) => handleInputChange("estado", e.target.value)}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Contato</h2>
                <p className="text-gray-600">Como podemos entrar em contato?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@suaempresa.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional - para receber notificações
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Confirmação</h2>
                <p className="text-gray-600">Revise seus dados antes de finalizar</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Empresa</h3>
                <p className="text-sm text-gray-600">CNPJ: {formData.cnpj}</p>
                <p className="text-sm text-gray-600">Razão Social: {formData.razaoSocial}</p>
                <p className="text-sm text-gray-600">Nome Fantasia: {formData.nomeFantasia}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Endereço</h3>
                <p className="text-sm text-gray-600">
                  {formData.logradouro}, {formData.numero}
                  {formData.complemento && ` - ${formData.complemento}`}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.bairro} - {formData.cidade}/{formData.estado}
                </p>
                <p className="text-sm text-gray-600">CEP: {formData.cep}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Contato</h3>
                <p className="text-sm text-gray-600">Telefone: {formData.telefone}</p>
                <p className="text-sm text-gray-600">Email: {formData.email}</p>
                {formData.whatsapp && (
                  <p className="text-sm text-gray-600">WhatsApp: {formData.whatsapp}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                  step <= currentStep
                    ? "bg-gradient-to-r from-blue-600 to-purple-600"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Passo {currentStep} de {totalSteps}
          </p>
        </div>

        {/* Step content */}
        {renderStep()}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalizar Cadastro
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
