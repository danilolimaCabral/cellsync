import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Loader2,
  Store,
  User,
  Mail,
  Lock,
  FileText,
  Building2,
} from "lucide-react";

export default function AssinaturaSucesso() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "form" | "success">("loading");
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    cnpj: "",
    ownerName: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const createTenantMutation = trpc.tenants.createFromCheckout.useMutation();

  useEffect(() => {
    // Pegar session_id da URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    
    if (!sid) {
      alert("Sessão inválida. Redirecionando para planos...");
      setLocation("/planos");
      return;
    }
    
    setSessionId(sid);
    
    // Recuperar dados do plano do localStorage
    const pendingSubscription = localStorage.getItem('pendingSubscription');
    if (pendingSubscription) {
      console.log("Plano selecionado:", JSON.parse(pendingSubscription));
    }
    
    // Mostrar formulário
    setStep("form");
  }, [setLocation]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Senha deve ter no mínimo 6 caracteres";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não conferem";
    }
    
    if (!formData.storeName || formData.storeName.length < 3) {
      newErrors.storeName = "Nome da loja deve ter no mínimo 3 caracteres";
    }
    
    if (!formData.cnpj || formData.cnpj.replace(/\D/g, "").length !== 14) {
      newErrors.cnpj = "CNPJ inválido (14 dígitos)";
    }
    
    if (!formData.ownerName || formData.ownerName.length < 3) {
      newErrors.ownerName = "Nome do responsável deve ter no mínimo 3 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!sessionId) {
      alert("Sessão inválida");
      return;
    }
    
    try {
      setStep("loading");
      
      await createTenantMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        storeName: formData.storeName,
        cnpj: formData.cnpj.replace(/\D/g, ""),
        ownerName: formData.ownerName,
        stripeSessionId: sessionId,
      });
      
      // Limpar localStorage
      localStorage.removeItem('pendingSubscription');
      
      setStep("success");
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
      
    } catch (error: any) {
      setStep("form");
      alert(`Erro ao criar conta: ${error.message || "Tente novamente"}`);
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="relative inline-block mb-6">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-50"
            />
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-8 shadow-2xl">
              <CheckCircle className="h-24 w-24 text-white" strokeWidth={2.5} />
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            🎉 Conta Criada com Sucesso!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Bem-vindo ao <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">CellSync</span>
          </p>
          <p className="text-gray-500">
            Redirecionando para o login em 3 segundos...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Pagamento Confirmado! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Agora crie sua conta para acessar o sistema
          </p>
          {sessionId && (
            <p className="text-xs text-gray-400 mt-2">
              Sessão: {sessionId.substring(0, 20)}...
            </p>
          )}
        </div>

        {/* Formulário */}
        <Card className="shadow-xl border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Criar Minha Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados da Loja */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="h-5 w-5 text-purple-600" />
                  Dados da Loja
                </h3>
                
                <div>
                  <Label htmlFor="storeName">Nome da Loja *</Label>
                  <Input
                    id="storeName"
                    placeholder="Ex: Loja do João"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className={errors.storeName ? "border-red-500" : ""}
                  />
                  {errors.storeName && <p className="text-xs text-red-500 mt-1">{errors.storeName}</p>}
                </div>
                
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    className={errors.cnpj ? "border-red-500" : ""}
                    maxLength={18}
                  />
                  {errors.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj}</p>}
                </div>
                
                <div>
                  <Label htmlFor="ownerName">Nome do Responsável *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Seu nome completo"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className={errors.ownerName ? "border-red-500" : ""}
                  />
                  {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
                </div>
              </div>

              {/* Dados de Acesso */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Dados de Acesso
                </h3>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6"
                disabled={createTenantMutation.isPending}
              >
                {createTenantMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Criar Conta e Acessar Sistema
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Ao criar sua conta, você concorda com nossos Termos de Uso e Política de Privacidade
        </p>
      </motion.div>
    </div>
  );
}
