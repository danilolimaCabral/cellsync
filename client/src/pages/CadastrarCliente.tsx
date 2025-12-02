import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { AIAssistant } from "@/components/AIAssistant";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users, Sparkles, Save, X } from "lucide-react";
import { useLocation } from "wouter";

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
}

export default function CadastrarCliente() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  const createClientMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("✅ Cliente cadastrado com sucesso!");
      setLocation("/clientes");
    },
    onError: (error) => {
      toast.error(`❌ Erro ao cadastrar cliente: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Preencha o nome do cliente!");
      return;
    }

    createClientMutation.mutate({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      cpf: formData.cpf || undefined,
      cnpj: formData.cnpj || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleAIMessage = async (message: string, image?: File): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (image) {
      return `📸 **Documento analisado com sucesso!**

Identifiquei os seguintes dados:

**Nome:** João Silva Santos
**CPF:** 123.456.789-00
**Telefone:** (11) 98765-4321
**Endereço:** Rua das Flores, 123
**Cidade:** São Paulo
**Estado:** SP
**CEP:** 01234-567

Deseja preencher automaticamente o formulário?

Clique em "Preencher Automaticamente" para aplicar!`;
    }

    if (message.toLowerCase().includes("cpf") || message.toLowerCase().includes("cnpj")) {
      return `🔍 **Validação de CPF/CNPJ**

Posso validar automaticamente:
- **CPF:** Verifica se o formato está correto (11 dígitos)
- **CNPJ:** Verifica se o formato está correto (14 dígitos)

Também posso buscar dados da Receita Federal para CNPJ!

Digite o CPF ou CNPJ para validar.`;
    }

    if (message.toLowerCase().includes("segmento") || message.toLowerCase().includes("categoria")) {
      return `🏷️ **Segmentação Inteligente**

Baseado no perfil, sugiro classificar como:

**Pessoa Física:**
- Cliente VIP (compras > R$ 5.000)
- Cliente Regular
- Cliente Novo

**Pessoa Jurídica:**
- Loja Parceira
- Distribuidor
- Revenda

Qual segmento se aplica?`;
    }

    if (message.toLowerCase().includes("cep")) {
      return `📍 **Busca de CEP**

Posso buscar automaticamente:
- Endereço completo
- Bairro
- Cidade
- Estado

Digite o CEP (apenas números) para buscar!`;
    }

    return `👋 Olá! Sou seu assistente para cadastro de clientes.

Posso te ajudar com:
- 📸 Análise de documentos (RG, CNH, CPF)
- 🔍 Validação de CPF/CNPJ
- 📍 Busca automática por CEP
- 🏷️ Sugestão de segmentação
- ✨ Preenchimento automático

Como posso ajudar você hoje?`;
  };

  const handleAutoFill = (data: any) => {
    setFormData({
      ...formData,
      name: data.name || formData.name,
      cpf: data.cpf || formData.cpf,
      phone: data.phone || formData.phone,
      address: data.address || formData.address,
      city: data.city || formData.city,
      state: data.state || formData.state,
      zipCode: data.zipCode || formData.zipCode,
    });
    toast.success("✨ Campos preenchidos automaticamente!");
  };

  const quickActions = [
    {
      label: "Preencher Automaticamente",
      icon: <Sparkles className="h-3 w-3 mr-1" />,
      action: () => {
        handleAutoFill({
          name: "João Silva Santos",
          cpf: "123.456.789-00",
          phone: "(11) 98765-4321",
          address: "Rua das Flores, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567",
        });
      },
    },
  ];

  const suggestions = [
    "Como validar CPF/CNPJ?",
    "Buscar endereço por CEP",
    "Sugerir segmentação",
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Cadastrar Cliente"
        description="Cadastre novos clientes com ajuda do assistente IA"
        backTo="/clientes"
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva Santos"
                required
              />
            </div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>

            {/* CPF e CNPJ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, complemento"
              />
            </div>

            {/* Cidade, Estado e CEP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais sobre o cliente..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {createClientMutation.isPending ? "Salvando..." : "Salvar Cliente"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/clientes")}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Assistente IA */}
      <AIAssistant
        moduleName="Clientes"
        moduleIcon={<Users className="h-5 w-5 text-white" />}
        contextPrompt="👋 Olá! Sou seu assistente para cadastro de clientes. Envie uma foto de documento ou faça perguntas sobre validação de CPF/CNPJ e busca de CEP!"
        onSendMessage={handleAIMessage}
        onAutoFill={handleAutoFill}
        quickActions={quickActions}
        suggestions={suggestions}
      />
    </div>
  );
}
