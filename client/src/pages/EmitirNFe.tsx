import { useState, useEffect } from "react";
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
  AlertCircle,
  Truck,
  ShoppingBag
} from "lucide-react";
import { useLocation } from "wouter";
import { InputCNPJ } from "@/components/InputCNPJ";
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
  { id: 1, title: "Emitente", icon: Building2, description: "Dados da sua empresa" },
  { id: 2, title: "Destinatário", icon: User, description: "Cliente ou fornecedor" },
  { id: 3, title: "Produtos", icon: Package, description: "Itens da nota" },
  { id: 4, title: "Impostos", icon: Calculator, description: "Tributação e totais" },
  { id: 5, title: "Confirmação", icon: Eye, description: "Revisão final" },
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

  const handleCnpjDataFetched = (data: any) => {
    setNfe(prev => ({
      ...prev,
      emitterName: data.razao_social,
      emitterFantasyName: data.nome_fantasia,
      emitterAddress: `${data.logradouro}, ${data.numero}${data.complemento ? ` - ${data.complemento}` : ''} - ${data.bairro}`,
      emitterCity: data.municipio,
      emitterState: data.uf,
      emitterZipCode: data.cep,
      emitterIE: "" // Limpa IE ao trocar de empresa
    }));
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

  // Recalcular totais sempre que itens ou valores mudarem
  useEffect(() => {
    const totalProducts = nfe.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalInvoice = totalProducts - nfe.totalDiscount + nfe.totalFreight;
    
    setNfe((prev) => ({
      ...prev,
      totalProducts,
      totalInvoice,
    }));
  }, [nfe.items, nfe.totalDiscount, nfe.totalFreight]);

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
    <div className="container mx-auto p-6 max-w-5xl space-y-8 pb-24">
      <PageHeader
        title="Emitir NF-e Manual"
        description="Preencha os dados passo a passo para emitir sua nota fiscal"
        backTo="/notas-fiscais"
      />

      {/* Stepper Moderno */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2 hidden md:block" />
        <div className="flex justify-between items-center overflow-x-auto pb-4 md:pb-0">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center min-w-[100px] bg-white px-2 z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-200"
                      : isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                    isActive ? "text-blue-700" : isCompleted ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Etapa 1: Emitente */}
          {currentStep === 1 && (
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Dados do Emitente
                </CardTitle>
                <CardDescription>
                  Informações da empresa que está emitindo a nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>CNPJ *</Label>
                    <InputCNPJ
                      value={nfe.emitterCnpj}
                      onChange={(value) => updateField("emitterCnpj", value)}
                      onDataFetched={handleCnpjDataFetched}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inscrição Estadual</Label>
                    <Input
                      placeholder="Isento ou número da IE"
                      value={nfe.emitterIE || ""}
                      onChange={(e) => updateField("emitterIE", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Razão Social *</Label>
                    <Input
                      placeholder="Nome da empresa"
                      value={nfe.emitterName}
                      onChange={(e) => updateField("emitterName", e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome Fantasia</Label>
                    <Input
                      placeholder="Nome fantasia"
                      value={nfe.emitterFantasyName || ""}
                      onChange={(e) => updateField("emitterFantasyName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Endereço Completo</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        placeholder="Rua, número, bairro"
                        value={nfe.emitterAddress || ""}
                        onChange={(e) => updateField("emitterAddress", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={nfe.emitterCity || ""}
                      onChange={(e) => updateField("emitterCity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input
                      placeholder="UF"
                      maxLength={2}
                      value={nfe.emitterState || ""}
                      onChange={(e) => updateField("emitterState", e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 2: Destinatário */}
          {currentStep === 2 && (
            <Card className="border-t-4 border-t-purple-500 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-purple-600" />
                  Dados do Destinatário
                </CardTitle>
                <CardDescription>
                  Para quem a nota fiscal será emitida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>CPF / CNPJ *</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={nfe.recipientDocument}
                      onChange={(e) => updateField("recipientDocument", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome / Razão Social *</Label>
                    <Input
                      placeholder="Nome do cliente"
                      value={nfe.recipientName}
                      onChange={(e) => updateField("recipientName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Endereço</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        placeholder="Rua, número, bairro"
                        value={nfe.recipientAddress || ""}
                        onChange={(e) => updateField("recipientAddress", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={nfe.recipientCity || ""}
                      onChange={(e) => updateField("recipientCity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input
                      placeholder="UF"
                      maxLength={2}
                      value={nfe.recipientState || ""}
                      onChange={(e) => updateField("recipientState", e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
            <Card className="border-t-4 border-t-orange-500 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Package className="h-5 w-5 text-orange-600" />
                      Produtos e Serviços
                    </CardTitle>
                    <CardDescription>
                      Adicione os itens que serão incluídos na nota fiscal
                    </CardDescription>
                  </div>
                  <Button onClick={addItem} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {nfe.items.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhum item adicionado</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Clique em "Adicionar Item" para começar a preencher sua nota.</p>
                    <Button onClick={addItem} variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                      Adicionar Primeiro Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nfe.items.map((item, index) => (
                      <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                          <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                            <span className="bg-white border px-2 py-0.5 rounded text-xs font-bold text-gray-500">#{index + 1}</span>
                            Item da Nota
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-6">
                              <Label className="text-xs mb-1 block">Descrição *</Label>
                              <Input
                                placeholder="Nome do produto"
                                value={item.description}
                                onChange={(e) => updateItem(index, "description", e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs mb-1 block">NCM *</Label>
                              <Input
                                placeholder="85171231"
                                value={item.ncm}
                                onChange={(e) => updateItem(index, "ncm", e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs mb-1 block">CFOP *</Label>
                              <Select
                                value={item.cfop}
                                onValueChange={(value) => updateItem(index, "cfop", value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CFOP_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs mb-1 block">Unidade *</Label>
                              <Input
                                placeholder="UN"
                                value={item.unit}
                                onChange={(e) => updateItem(index, "unit", e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label className="text-xs mb-1 block">Quantidade *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 1)}
                                className="h-9"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label className="text-xs mb-1 block">Preço Unit. (R$) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice / 100}
                                onChange={(e) =>
                                  updateItem(index, "unitPrice", Math.round(parseFloat(e.target.value) * 100) || 0)
                                }
                                className="h-9"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label className="text-xs mb-1 block">Desconto (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.discount / 100}
                                onChange={(e) =>
                                  updateItem(index, "discount", Math.round(parseFloat(e.target.value) * 100) || 0)
                                }
                                className="h-9"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label className="text-xs mb-1 block">Total</Label>
                              <div className="h-9 px-3 flex items-center bg-gray-100 rounded-md border font-semibold text-gray-700">
                                {formatCurrency(item.totalPrice)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Operação */}
                <Card className="bg-blue-50/50 border-blue-100 mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Dados da Operação e Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1 block">Natureza da Operação *</Label>
                        <Input
                          placeholder="Venda de mercadoria"
                          value={nfe.natureOperation}
                          onChange={(e) => updateField("natureOperation", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Forma de Pagamento *</Label>
                        <Select
                          value={nfe.paymentMethod}
                          onValueChange={(value) => updateField("paymentMethod", value)}
                        >
                          <SelectTrigger className="bg-white">
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
                        <Label className="text-xs mb-1 block">Indicador de Pagamento *</Label>
                        <Select
                          value={nfe.paymentIndicator}
                          onValueChange={(value) => updateField("paymentIndicator", value)}
                        >
                          <SelectTrigger className="bg-white">
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
            <Card className="border-t-4 border-t-green-500 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calculator className="h-5 w-5 text-green-600" />
                  Impostos e Totais
                </CardTitle>
                <CardDescription>
                  Configure os impostos e valores adicionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Impostos por item */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Tributação por Item</h3>
                  {nfe.items.map((item, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardHeader className="py-3 bg-gray-50 border-b">
                        <CardTitle className="text-sm font-medium">
                          {item.description || `Item ${index + 1}`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs mb-1 block">ICMS (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(item.icmsRate || 0) / 100}
                              onChange={(e) =>
                                updateItem(index, "icmsRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                              }
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">IPI (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(item.ipiRate || 0) / 100}
                              onChange={(e) =>
                                updateItem(index, "ipiRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                              }
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">PIS (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(item.pisRate || 0) / 100}
                              onChange={(e) =>
                                updateItem(index, "pisRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                              }
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">COFINS (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(item.cofinsRate || 0) / 100}
                              onChange={(e) =>
                                updateItem(index, "cofinsRate", Math.round(parseFloat(e.target.value) * 100) || 0)
                              }
                              className="h-9"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Valores adicionais */}
                <Card className="bg-yellow-50/50 border-yellow-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Frete e Descontos Globais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1 block">Desconto Total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={nfe.totalDiscount / 100}
                          onChange={(e) =>
                            updateField("totalDiscount", Math.round(parseFloat(e.target.value) * 100) || 0)
                          }
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Frete (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={nfe.totalFreight / 100}
                          onChange={(e) =>
                            updateField("totalFreight", Math.round(parseFloat(e.target.value) * 100) || 0)
                          }
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Informações adicionais */}
                <div>
                  <Label className="mb-2 block">Informações Adicionais (Observações)</Label>
                  <Textarea
                    placeholder="Observações que devem constar na nota, condições de pagamento, etc..."
                    rows={4}
                    value={nfe.additionalInfo || ""}
                    onChange={(e) => updateField("additionalInfo", e.target.value)}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 5: Confirmação */}
          {currentStep === 5 && (
            <Card className="border-t-4 border-t-pink-500 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Eye className="h-5 w-5 text-pink-600" />
                  Confirmação e Preview
                </CardTitle>
                <CardDescription>
                  Revise todos os dados antes de emitir a nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Resumo Emitente */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                      <Building2 className="h-4 w-4" />
                      Emitente
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-900">Razão Social:</span> {nfe.emitterName}</p>
                      <p><span className="font-medium text-gray-900">CNPJ:</span> {nfe.emitterCnpj}</p>
                      {nfe.emitterAddress && <p><span className="font-medium text-gray-900">Endereço:</span> {nfe.emitterAddress}</p>}
                      {nfe.emitterCity && <p><span className="font-medium text-gray-900">Local:</span> {nfe.emitterCity} - {nfe.emitterState}</p>}
                    </div>
                  </div>
                  
                  {/* Resumo Destinatário */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                      <User className="h-4 w-4" />
                      Destinatário
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-900">Nome:</span> {nfe.recipientName}</p>
                      <p><span className="font-medium text-gray-900">CPF/CNPJ:</span> {nfe.recipientDocument}</p>
                      {nfe.recipientAddress && <p><span className="font-medium text-gray-900">Endereço:</span> {nfe.recipientAddress}</p>}
                      {nfe.recipientCity && <p><span className="font-medium text-gray-900">Local:</span> {nfe.recipientCity} - {nfe.recipientState}</p>}
                    </div>
                  </div>
                </div>
                
                {/* Resumo Produtos */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                    <Package className="h-4 w-4" />
                    Produtos ({nfe.items.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <td className="px-4 py-2">Descrição</td>
                          <td className="px-4 py-2 text-right">Qtd</td>
                          <td className="px-4 py-2 text-right">Unitário</td>
                          <td className="px-4 py-2 text-right">Total</td>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {nfe.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{item.description}</td>
                            <td className="px-4 py-2 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Totais */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total dos Produtos:</span>
                        <span className="font-medium">{formatCurrency(nfe.totalProducts)}</span>
                      </div>
                      {nfe.totalDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto:</span>
                          <span className="font-medium">- {formatCurrency(nfe.totalDiscount)}</span>
                        </div>
                      )}
                      {nfe.totalFreight > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Frete:</span>
                          <span className="font-medium">+ {formatCurrency(nfe.totalFreight)}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-200 pt-3 mt-1 flex justify-between items-end">
                        <span className="font-bold text-lg text-blue-900">Valor Total da Nota</span>
                        <span className="font-bold text-2xl text-blue-700">{formatCurrency(nfe.totalInvoice)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Informações adicionais */}
                {nfe.additionalInfo && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm">
                    <h3 className="font-semibold mb-1 text-yellow-800">Informações Adicionais</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{nfe.additionalInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Barra de Navegação Fixa */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50 md:pl-64">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="w-32"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="text-sm font-medium text-gray-500 hidden md:block">
            Passo {currentStep} de 5
          </div>
          
          {currentStep < 5 ? (
            <Button onClick={handleNext} className="w-32 bg-blue-600 hover:bg-blue-700">
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createNFeMutation.isPending || emitNFeMutation.isPending}
              className="w-40 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-200"
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
      </div>
    </div>
  );
}
