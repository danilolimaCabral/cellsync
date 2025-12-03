import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  User,
  Package,
  Calculator,
  Eye,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Plus,
  Trash2,
  Download,
  Send,
  Search,
} from "lucide-react";
import { useLocation } from "wouter";
import { fetchCnpjData } from "@/lib/cnpj-service";
import { validateIE } from "@/lib/ie-validator";

interface NFe {
  // Emitente
  emitterCnpj: string;
  emitterName: string;
  emitterFantasyName?: string;
  emitterAddress?: string;
  emitterCity?: string;
  emitterState?: string;
  emitterZipCode?: string;
  emitterIE?: string;
  
  // Destinatário
  recipientDocument: string;
  recipientName: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientState?: string;
  recipientZipCode?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  
  // Operação
  cfop: string;
  natureOperation: string;
  paymentMethod: "dinheiro" | "cheque" | "cartao_credito" | "cartao_debito" | "credito_loja" | "vale_alimentacao" | "vale_refeicao" | "vale_presente" | "vale_combustivel" | "boleto" | "deposito" | "pix" | "sem_pagamento" | "outros";
  paymentIndicator: "a_vista" | "a_prazo" | "outros";
  
  // Totais
  totalProducts: number;
  totalDiscount: number;
  totalFreight: number;
  totalInvoice: number;
  additionalInfo?: string;
  
  // Itens
  items: Array<{
    code?: string;
    ean?: string;
    description: string;
    ncm: string;
    cfop: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount: number;
    icmsRate?: number;
    ipiRate?: number;
    pisRate?: number;
    cofinsRate?: number;
  }>;
}

const STEPS = [
  { id: 1, title: "Emitente", icon: Building2 },
  { id: 2, title: "Destinatário", icon: User },
  { id: 3, title: "Produtos", icon: Package },
  { id: 4, title: "Impostos", icon: Calculator },
  { id: 5, title: "Confirmação", icon: Eye },
];

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "deposito", label: "Depósito Bancário" },
];

const CFOP_OPTIONS = [
  { value: "5102", label: "5102 - Venda de mercadoria adquirida" },
  { value: "5405", label: "5405 - Venda de mercadoria adquirida (ST)" },
  { value: "6102", label: "6102 - Venda de mercadoria adquirida (interestadual)" },
];

export default function EmitirNFe() {
  const [currentStep, setCurrentStep] = useState(1);
  const [nfe, setNfe] = useState<NFe>({
    emitterCnpj: "",
    emitterName: "",
    recipientDocument: "",
    recipientName: "",
    cfop: "5102",
    natureOperation: "Venda de mercadoria",
    paymentMethod: "pix",
    paymentIndicator: "a_vista",
    totalProducts: 0,
    totalDiscount: 0,
    totalFreight: 0,
    totalInvoice: 0,
    items: [],
  });

  const [, setLocation] = useLocation();

  const createNFeMutation = trpc.nfe.create.useMutation({
    onSuccess: async (data) => {
      toast.success(`NF-e criada com sucesso! Número: ${data.number}`);
      
      // Emitir automaticamente
      try {
        const result = await emitNFeMutation.mutateAsync({ id: data.invoiceId });
        toast.success(`NF-e emitida! Chave: ${result.accessKey.slice(0, 20)}...`);
        setLocation("/notas-fiscais");
      } catch (error: any) {
        toast.error(error.message || "Erro ao emitir NF-e");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar NF-e");
    },
  });

  const emitNFeMutation = trpc.nfe.emit.useMutation();

  const updateField = (field: keyof NFe, value: any) => {
    setNfe((prev) => ({ ...prev, [field]: value }));
  };

  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

  const handleSearchCnpj = async () => {
    const cnpj = nfe.emitterCnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      toast.error("CNPJ inválido. Digite 14 números.");
      return;
    }

    setIsLoadingCnpj(true);
    try {
      const data = await fetchCnpjData(cnpj);
      
      setNfe(prev => ({
        ...prev,
        emitterName: data.razao_social,
        emitterFantasyName: data.nome_fantasia,
        emitterAddress: `${data.logradouro}, ${data.numero} ${data.complemento ? `- ${data.complemento}` : ""}, ${data.bairro}`,
        emitterCity: data.municipio,
        emitterState: data.uf,
        emitterZipCode: data.cep,
        emitterIE: "" // Limpa IE ao trocar de empresa
      }));
      
      toast.success("Dados da empresa carregados!");
    } catch (error) {
      toast.error("Erro ao buscar CNPJ. Verifique o número ou a API configurada.");
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const addItem = () => {
    setNfe((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          ncm: "85171231",
          cfop: prev.cfop,
          unit: "UN",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          discount: 0,
          icmsRate: 1800,
          ipiRate: 0,
          pisRate: 165,
          cofinsRate: 760,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setNfe((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setNfe((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Recalcular total do item
      if (field === "quantity" || field === "unitPrice" || field === "discount") {
        const item = newItems[index];
        item.totalPrice = Math.round(item.quantity * item.unitPrice * 100 - item.discount);
      }
      
      return { ...prev, items: newItems };
    });
  };

  const calculateTotals = () => {
    const totalProducts = nfe.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalInvoice = totalProducts - nfe.totalDiscount + nfe.totalFreight;
    
    setNfe((prev) => ({
      ...prev,
      totalProducts,
      totalInvoice,
    }));
  };

  const handleNext = () => {
    // Validações por etapa
    if (currentStep === 1) {
      if (!nfe.emitterCnpj || !nfe.emitterName) {
        toast.error("Preencha CNPJ e Razão Social do emitente");
        return;
      }
      if (nfe.emitterIE && nfe.emitterState && !validateIE(nfe.emitterIE, nfe.emitterState)) {
        toast.error(`Inscrição Estadual inválida para o estado ${nfe.emitterState}`);
        return;
      }
    } else if (currentStep === 2) {
      if (!nfe.recipientDocument || !nfe.recipientName) {
        toast.error("Preencha CPF/CNPJ e Nome do destinatário");
        return;
      }
    } else if (currentStep === 3) {
      if (nfe.items.length === 0) {
        toast.error("Adicione pelo menos um produto");
        return;
      }
      calculateTotals();
    }
    
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    createNFeMutation.mutate({
      ...nfe,
      series: 1,
      model: "55",
      type: "saida",
    });
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Emitir NF-e Manual"
        description="Preencha os dados para emitir uma nota fiscal eletrônica"
        backTo="/notas-fiscais"
      />

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : isActive
                          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span
                      className={`text-sm mt-2 font-medium ${
                        isActive ? "text-purple-600" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded transition-all ${
                        currentStep > step.id
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Etapa 1: Emitente */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Dados do Emitente
                </CardTitle>
                <CardDescription>
                  Informações da empresa que está emitindo a nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>CNPJ *</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={nfe.emitterCnpj}
                        onChange={(e) => updateField("emitterCnpj", e.target.value)}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleSearchCnpj}
                        disabled={isLoadingCnpj}
                      >
                        {isLoadingCnpj ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Razão Social *</Label>
                    <Input
                      placeholder="Empresa LTDA"
                      value={nfe.emitterName}
                      onChange={(e) => updateField("emitterName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Nome Fantasia</Label>
                    <Input
                      placeholder="Nome Fantasia"
                      value={nfe.emitterFantasyName || ""}
                      onChange={(e) => updateField("emitterFantasyName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Rua, número"
                      value={nfe.emitterAddress || ""}
                      onChange={(e) => updateField("emitterAddress", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={nfe.emitterCity || ""}
                      onChange={(e) => updateField("emitterCity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input
                      placeholder="GO"
                      maxLength={2}
                      value={nfe.emitterState || ""}
                      onChange={(e) => updateField("emitterState", e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input
                      placeholder="00000-000"
                      value={nfe.emitterZipCode || ""}
                      onChange={(e) => updateField("emitterZipCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Inscrição Estadual</Label>
                    <Input
                      placeholder="Isento ou número"
                      value={nfe.emitterIE || ""}
                      onChange={(e) => updateField("emitterIE", e.target.value)}
                      className={nfe.emitterIE && nfe.emitterState && !validateIE(nfe.emitterIE, nfe.emitterState) ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {nfe.emitterIE && nfe.emitterState && !validateIE(nfe.emitterIE, nfe.emitterState) && (
                      <span className="text-xs text-red-500 mt-1">IE inválida para {nfe.emitterState}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 2: Destinatário */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  Dados do Destinatário
                </CardTitle>
                <CardDescription>
                  Informações do cliente que está recebendo a nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>CPF/CNPJ *</Label>
                    <Input
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={nfe.recipientDocument}
                      onChange={(e) => updateField("recipientDocument", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Nome/Razão Social *</Label>
                    <Input
                      placeholder="Nome do cliente"
                      value={nfe.recipientName}
                      onChange={(e) => updateField("recipientName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Rua, número"
                      value={nfe.recipientAddress || ""}
                      onChange={(e) => updateField("recipientAddress", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={nfe.recipientCity || ""}
                      onChange={(e) => updateField("recipientCity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input
                      placeholder="GO"
                      maxLength={2}
                      value={nfe.recipientState || ""}
                      onChange={(e) => updateField("recipientState", e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input
                      placeholder="00000-000"
                      value={nfe.recipientZipCode || ""}
                      onChange={(e) => updateField("recipientZipCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        placeholder="(00) 00000-0000"
                        value={nfe.recipientPhone || ""}
                        onChange={(e) => updateField("recipientPhone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={nfe.recipientEmail || ""}
                        onChange={(e) => updateField("recipientEmail", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 3: Produtos */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-500" />
                      Produtos e Serviços
                    </CardTitle>
                    <CardDescription>
                      Adicione os itens que serão incluídos na nota fiscal
                    </CardDescription>
                  </div>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {nfe.items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum item adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                  </div>
                ) : (
                  nfe.items.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Label>Descrição *</Label>
                            <Input
                              placeholder="Nome do produto"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Código</Label>
                            <Input
                              placeholder="SKU"
                              value={item.code || ""}
                              onChange={(e) => updateItem(index, "code", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>NCM *</Label>
                            <Input
                              placeholder="85171231"
                              value={item.ncm}
                              onChange={(e) => updateItem(index, "ncm", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>CFOP *</Label>
                            <Select
                              value={item.cfop}
                              onValueChange={(value) => updateItem(index, "cfop", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CFOP_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Unidade *</Label>
                            <Input
                              placeholder="UN"
                              value={item.unit}
                              onChange={(e) => updateItem(index, "unit", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Quantidade *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>Preço Unitário (R$) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice / 100}
                              onChange={(e) =>
                                updateItem(index, "unitPrice", Math.round(parseFloat(e.target.value) * 100) || 0)
                              }
                            />
                          </div>
                          <div>
                            <Label>Desconto (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount / 100}
                              onChange={(e) =>
                                updateItem(index, "discount", Math.round(parseFloat(e.target.value) * 100) || 0)
                              }
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <Input
                              value={formatCurrency(item.totalPrice)}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                
                {/* Operação */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Informações da Operação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>CFOP *</Label>
                        <Select
                          value={nfe.cfop}
                          onValueChange={(value) => updateField("cfop", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CFOP_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Natureza da Operação *</Label>
                        <Input
                          placeholder="Venda de mercadoria"
                          value={nfe.natureOperation}
                          onChange={(e) => updateField("natureOperation", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Forma de Pagamento *</Label>
                        <Select
                          value={nfe.paymentMethod}
                          onValueChange={(value) => updateField("paymentMethod", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Indicador de Pagamento *</Label>
                        <Select
                          value={nfe.paymentIndicator}
                          onValueChange={(value) => updateField("paymentIndicator", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a_vista">À Vista</SelectItem>
                            <SelectItem value="a_prazo">A Prazo</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Etapa 4: Impostos */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-500" />
                  Impostos e Totais
                </CardTitle>
                <CardDescription>
                  Configure os impostos e valores adicionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Impostos por item */}
                {nfe.items.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {item.description || `Item ${index + 1}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>ICMS (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={(item.icmsRate || 0) / 100}
                            onChange={(e) =>
                              updateItem(index, "icmsRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                            }
                          />
                        </div>
                        <div>
                          <Label>IPI (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={(item.ipiRate || 0) / 100}
                            onChange={(e) =>
                              updateItem(index, "ipiRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                            }
                          />
                        </div>
                        <div>
                          <Label>PIS (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={(item.pisRate || 0) / 100}
                            onChange={(e) =>
                              updateItem(index, "pisRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                            }
                          />
                        </div>
                        <div>
                          <Label>COFINS (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={(item.cofinsRate || 0) / 100}
                            onChange={(e) =>
                              updateItem(index, "cofinsRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Valores adicionais */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Valores Adicionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Desconto Total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={nfe.totalDiscount / 100}
                          onChange={(e) =>
                            updateField("totalDiscount", Math.round(parseFloat(e.target.value) * 100) || 0)
                          }
                        />
                      </div>
                      <div>
                        <Label>Frete (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={nfe.totalFreight / 100}
                          onChange={(e) =>
                            updateField("totalFreight", Math.round(parseFloat(e.target.value) * 100) || 0)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Informações adicionais */}
                <div>
                  <Label>Informações Adicionais</Label>
                  <Textarea
                    placeholder="Observações, condições de pagamento, etc..."
                    rows={4}
                    value={nfe.additionalInfo || ""}
                    onChange={(e) => updateField("additionalInfo", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 5: Confirmação */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-pink-500" />
                  Confirmação e Preview
                </CardTitle>
                <CardDescription>
                  Revise todos os dados antes de emitir a nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resumo Emitente */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    Emitente
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                    <p><strong>CNPJ:</strong> {nfe.emitterCnpj}</p>
                    <p><strong>Razão Social:</strong> {nfe.emitterName}</p>
                    {nfe.emitterAddress && <p><strong>Endereço:</strong> {nfe.emitterAddress}</p>}
                    {nfe.emitterCity && <p><strong>Cidade:</strong> {nfe.emitterCity} - {nfe.emitterState}</p>}
                  </div>
                </div>
                
                {/* Resumo Destinatário */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    Destinatário
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                    <p><strong>CPF/CNPJ:</strong> {nfe.recipientDocument}</p>
                    <p><strong>Nome:</strong> {nfe.recipientName}</p>
                    {nfe.recipientAddress && <p><strong>Endereço:</strong> {nfe.recipientAddress}</p>}
                    {nfe.recipientCity && <p><strong>Cidade:</strong> {nfe.recipientCity} - {nfe.recipientState}</p>}
                    {nfe.recipientPhone && <p><strong>Telefone:</strong> {nfe.recipientPhone}</p>}
                    {nfe.recipientEmail && <p><strong>E-mail:</strong> {nfe.recipientEmail}</p>}
                  </div>
                </div>
                
                {/* Resumo Produtos */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-500" />
                    Produtos ({nfe.items.length})
                  </h3>
                  <div className="space-y-2">
                    {nfe.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                            </p>
                            {item.discount > 0 && (
                              <p className="text-sm text-green-600">
                                Desconto: {formatCurrency(item.discount)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                            <p className="text-xs text-gray-500">NCM: {item.ncm}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Totais */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Totais da Nota Fiscal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total dos Produtos:</span>
                      <span className="font-semibold">{formatCurrency(nfe.totalProducts)}</span>
                    </div>
                    {nfe.totalDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span className="font-semibold">- {formatCurrency(nfe.totalDiscount)}</span>
                      </div>
                    )}
                    {nfe.totalFreight > 0 && (
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span className="font-semibold">+ {formatCurrency(nfe.totalFreight)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg">
                      <span className="font-bold">Total da Nota:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(nfe.totalInvoice)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Informações adicionais */}
                {nfe.additionalInfo && (
                  <div>
                    <h3 className="font-semibold mb-2">Informações Adicionais</h3>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      {nfe.additionalInfo}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navegação */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createNFeMutation.isPending || emitNFeMutation.isPending}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
              >
                {createNFeMutation.isPending || emitNFeMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Emitindo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Emitir NF-e
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
