import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { AIAssistant } from "@/components/AIAssistant";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Package, Sparkles, Save, X } from "lucide-react";
import { useLocation } from "wouter";

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  sku: string;
  barcode: string;
  costPrice: string;
  salePrice: string;
  wholesalePrice: string;
  minWholesaleQty: string;
  minStock: string;
  requiresImei: boolean;
}

export default function CadastrarProduto() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "",
    brand: "",
    model: "",
    sku: "",
    barcode: "",
    costPrice: "",
    salePrice: "",
    wholesalePrice: "",
    minWholesaleQty: "10",
    minStock: "10",
    requiresImei: false,
  });

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("✅ Produto cadastrado com sucesso!");
      setLocation("/estoque");
    },
    onError: (error) => {
      toast.error(`❌ Erro ao cadastrar produto: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.costPrice || !formData.salePrice) {
      toast.error("Preencha os campos obrigatórios!");
      return;
    }

    createProductMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      sku: formData.sku || undefined,
      barcode: formData.barcode || undefined,
      costPrice: Math.round(parseFloat(formData.costPrice) * 100),
      salePrice: Math.round(parseFloat(formData.salePrice) * 100),
      minStock: parseInt(formData.minStock) || 10,
      requiresImei: formData.requiresImei,
    });
  };

  const handleAIMessage = async (message: string, image?: File): Promise<string> => {
    // Simular análise de IA (em produção, chamar endpoint real)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (image) {
      // Simular análise de imagem
      return `📸 **Imagem analisada com sucesso!**

Identifiquei as seguintes informações:

**Produto:** iPhone 14 Pro Max 256GB
**Marca:** Apple
**Categoria:** Smartphone
**Modelo:** iPhone 14 Pro Max

**Especificações detectadas:**
- Armazenamento: 256GB
- Cor: Roxo Profundo
- Estado: Novo/Lacrado

Deseja que eu preencha automaticamente o formulário com essas informações?

Clique em "Preencher Automaticamente" para aplicar!`;
    }

    // Respostas contextuais baseadas na mensagem
    if (message.toLowerCase().includes("preço") || message.toLowerCase().includes("valor")) {
      return `💰 **Sugestão de Preços**

Baseado em produtos similares no mercado:

**Custo sugerido:** R$ 4.500,00
**Preço varejo:** R$ 5.999,00 (margem de 33%)
**Preço atacado:** R$ 5.499,00 (para 10+ unidades)

Essa precificação está competitiva e garante boa margem de lucro!`;
    }

    if (message.toLowerCase().includes("descrição")) {
      return `📝 **Sugestão de Descrição**

"iPhone 14 Pro Max 256GB - Roxo Profundo. Tela Super Retina XDR de 6,7 polegadas com ProMotion. Chip A16 Bionic. Sistema de câmera Pro com 48MP. Dynamic Island. Bateria de longa duração. 5G. Produto novo, lacrado com garantia Apple de 1 ano."

Posso adicionar esta descrição ao formulário?`;
    }

    if (message.toLowerCase().includes("categoria")) {
      return `🏷️ **Categorização Inteligente**

Categorias sugeridas para este produto:
1. **Smartphone** (recomendado)
2. Eletrônicos > Celulares
3. Apple > iPhone

Qual categoria você prefere usar?`;
    }

    // Resposta padrão
    return `👋 Olá! Sou seu assistente para cadastro de produtos.

Posso te ajudar com:
- 📸 Análise de fotos de produtos
- 💰 Sugestão de preços competitivos
- 📝 Geração de descrições profissionais
- 🏷️ Categorização automática
- ✨ Preenchimento automático de campos

Como posso ajudar você hoje?`;
  };

  const handleAutoFill = (data: any) => {
    setFormData({
      ...formData,
      name: data.name || formData.name,
      brand: data.brand || formData.brand,
      model: data.model || formData.model,
      category: data.category || formData.category,
      description: data.description || formData.description,
    });
    toast.success("✨ Campos preenchidos automaticamente!");
  };

  const quickActions = [
    {
      label: "Preencher Automaticamente",
      icon: <Sparkles className="h-3 w-3 mr-1" />,
      action: () => {
        handleAutoFill({
          name: "iPhone 14 Pro Max 256GB",
          brand: "Apple",
          model: "iPhone 14 Pro Max",
          category: "Smartphone",
          description: "iPhone 14 Pro Max 256GB - Roxo Profundo. Tela Super Retina XDR de 6,7 polegadas com ProMotion. Chip A16 Bionic. Sistema de câmera Pro com 48MP.",
        });
      },
    },
  ];

  const suggestions = [
    "Como precificar este produto?",
    "Gere uma descrição profissional",
    "Qual categoria usar?",
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Cadastrar Produto"
        description="Cadastre novos produtos com ajuda do assistente IA"
        backTo="/estoque"
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Produto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: iPhone 14 Pro Max 256GB"
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do produto..."
                rows={3}
              />
            </div>

            {/* Categoria, Marca, Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Smartphone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ex: Apple"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: iPhone 14 Pro Max"
                />
              </div>
            </div>

            {/* SKU e Código de Barras */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Código interno"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="EAN/UPC"
                />
              </div>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">
                  Preço de Custo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">
                  Preço de Venda (Varejo) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Preço Atacado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Preço de Atacado</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minWholesaleQty">Quantidade Mínima (Atacado)</Label>
                <Input
                  id="minWholesaleQty"
                  type="number"
                  value={formData.minWholesaleQty}
                  onChange={(e) => setFormData({ ...formData, minWholesaleQty: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Estoque Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                placeholder="10"
              />
            </div>

            {/* Requer IMEI */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresImei"
                checked={formData.requiresImei}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresImei: checked as boolean })
                }
              />
              <Label htmlFor="requiresImei" className="cursor-pointer">
                Este produto requer rastreamento por IMEI
              </Label>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createProductMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {createProductMutation.isPending ? "Salvando..." : "Salvar Produto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/estoque")}
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
        moduleName="Produtos"
        moduleIcon={<Package className="h-5 w-5 text-white" />}
        contextPrompt="👋 Olá! Sou seu assistente para cadastro de produtos. Envie uma foto do produto ou faça perguntas sobre preços, descrições e categorização!"
        onSendMessage={handleAIMessage}
        onAutoFill={handleAutoFill}
        quickActions={quickActions}
        suggestions={suggestions}
      />
    </div>
  );
}
