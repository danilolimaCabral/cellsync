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
      toast.success("Produto cadastrado com sucesso!");
      setLocation("/estoque");
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar produto: ${error.message}`);
    },
  });

  // Mutation para análise de imagem com IA
  const analyzeImageMutation = trpc.imageAnalysis.analyzeProduct.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.category) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const costPriceCents = Math.round(parseFloat(formData.costPrice || "0") * 100);
    const salePriceCents = Math.round(parseFloat(formData.salePrice || "0") * 100);
    const wholesalePriceCents = formData.wholesalePrice
      ? Math.round(parseFloat(formData.wholesalePrice) * 100)
      : undefined;

    createProductMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      sku: formData.sku || undefined,
      barcode: formData.barcode || undefined,
      costPrice: costPriceCents,
      salePrice: salePriceCents,
      wholesalePrice: wholesalePriceCents,
      minWholesaleQty: wholesalePriceCents ? parseInt(formData.minWholesaleQty) : undefined,
      minStock: parseInt(formData.minStock),
      requiresImei: formData.requiresImei,
    });
  };

  // Handler do assistente IA com análise REAL de imagens
  const handleAIMessage = async (message: string, image?: File): Promise<string> => {
    // Se houver imagem, fazer análise real com IA
    if (image) {
      try {
        // Converter imagem para base64
        const reader = new FileReader();
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });

        // Chamar endpoint de análise de imagem
        const result = await analyzeImageMutation.mutateAsync({ imageBase64 });

        // Preencher formulário automaticamente com os dados extraídos
        if (result.success) {
          handleAutoFill({
            name: result.data.name,
            brand: result.data.brand,
            model: result.data.model,
            category: result.data.category,
            description: result.data.description,
            costPrice: result.data.suggestedCostPrice ? (result.data.suggestedCostPrice / 100).toFixed(2) : "",
            salePrice: result.data.suggestedSalePrice ? (result.data.suggestedSalePrice / 100).toFixed(2) : "",
          });

          return `✅ **Análise Concluída!**

📸 Imagem analisada com sucesso!

**Informações Extraídas:**
- **Nome:** ${result.data.name}
- **Marca:** ${result.data.brand}
- **Modelo:** ${result.data.model}
- **Categoria:** ${result.data.category}

${result.data.suggestedSalePrice ? `💰 **Preço Sugerido:** R$ ${(result.data.suggestedSalePrice / 100).toFixed(2)}` : ''}

${result.data.description ? `📝 **Descrição:**\n${result.data.description}` : ''}

**Confiança da Análise:** ${result.confidence === 'high' ? '✨ Alta' : result.confidence === 'medium' ? '⚠️ Média' : '❌ Baixa'}

Os campos foram preenchidos automaticamente! Revise e ajuste se necessário.`;
        } else {
          return `❌ Não foi possível analisar a imagem. ${result.message || 'Tente novamente com uma foto mais clara.'}`;
        }
      } catch (error: any) {
        console.error('Erro na análise de imagem:', error);
        return `❌ Erro ao analisar imagem: ${error.message || 'Tente novamente.'}`;
      }
    }

    // Respostas contextuais baseadas na mensagem (sem imagem)
    if (message.toLowerCase().includes("preço") || message.toLowerCase().includes("valor")) {
      return `💰 **Sugestão de Preços**

Para calcular preços competitivos, considere:

**1. Custo do Produto** (quanto você paga)
**2. Margem de Lucro** (recomendado: 30-40% para varejo)
**3. Preço de Mercado** (pesquise concorrentes)

**Exemplo:**
- Custo: R$ 4.500,00
- Margem 33%: R$ 5.999,00 (varejo)
- Atacado (10+ un): R$ 5.499,00

📸 **Dica:** Envie uma foto do produto para análise automática de preços!`;
    }

    if (message.toLowerCase().includes("descrição")) {
      return `📝 **Como Criar Descrições Profissionais**

Uma boa descrição deve incluir:
1. **Nome completo** do produto
2. **Especificações técnicas** principais
3. **Diferenciais** e benefícios
4. **Estado** (novo, usado, lacrado)
5. **Garantia**

**Exemplo:**
"iPhone 14 Pro Max 256GB - Roxo Profundo. Tela Super Retina XDR de 6,7 polegadas com ProMotion. Chip A16 Bionic. Sistema de câmera Pro com 48MP. Dynamic Island. Bateria de longa duração. 5G. Produto novo, lacrado com garantia Apple de 1 ano."

📸 **Dica:** Envie uma foto e eu gero a descrição automaticamente!`;
    }

    if (message.toLowerCase().includes("categoria")) {
      return `🏷️ **Categorias Disponíveis**

Principais categorias para produtos:
- **Smartphone** (celulares em geral)
- **Tablet** (iPads, tablets Android)
- **Acessório** (capas, películas, carregadores)
- **Áudio** (fones, caixas de som)
- **Smartwatch** (relógios inteligentes)
- **Notebook** (laptops)
- **Outros** (demais produtos)

📸 **Dica:** Envie uma foto e eu identifico a categoria automaticamente!`;
    }

    if (message.toLowerCase().includes("foto") || message.toLowerCase().includes("imagem")) {
      return `📸 **Como Usar a Análise de Imagens**

1. Clique no ícone de **📷 imagem** abaixo
2. Tire uma foto clara do produto ou selecione da galeria
3. Aguarde alguns segundos
4. A IA vai extrair automaticamente:
   - Nome e modelo
   - Marca
   - Categoria
   - Descrição profissional
   - Sugestão de preços

**Dicas para melhores resultados:**
✅ Foto bem iluminada
✅ Produto centralizado
✅ Foco nítido
✅ Mostrar embalagem ou etiquetas

Experimente agora!`;
    }

    // Resposta padrão
    return `👋 **Olá! Sou seu Assistente IA para Cadastro de Produtos**

Posso te ajudar com:

📸 **Análise de Fotos** - Tire uma foto e eu extraio todas as informações automaticamente
💰 **Sugestão de Preços** - Calcule preços competitivos com margem de lucro
📝 **Descrições Profissionais** - Gero descrições completas e atrativas
🏷️ **Categorização** - Identifico a categoria correta do produto
✨ **Preenchimento Automático** - Preencho todos os campos em segundos

**Como começar?**
- Envie uma foto do produto usando o botão 📷
- Ou pergunte algo como: "Como precificar?" ou "Qual categoria usar?"

Estou aqui para economizar seu tempo! 🚀`;
  };

  const handleAutoFill = (data: any) => {
    setFormData({
      ...formData,
      name: data.name || formData.name,
      brand: data.brand || formData.brand,
      model: data.model || formData.model,
      category: data.category || formData.category,
      description: data.description || formData.description,
      costPrice: data.costPrice || formData.costPrice,
      salePrice: data.salePrice || formData.salePrice,
    });
    toast.success("✨ Campos preenchidos automaticamente!");
  };

  const quickActions = [
    {
      label: "📸 Analisar Foto",
      icon: <Sparkles className="h-3 w-3 mr-1" />,
      action: () => {
        toast.info("Clique no ícone de imagem 📷 abaixo para enviar uma foto!");
      },
    },
  ];

  const suggestions = [
    "Como usar a análise de fotos?",
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: iPhone 14 Pro Max 256GB"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ex: Apple"
                    />
                  </div>

                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Ex: iPhone 14 Pro Max"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Smartphone"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Ex: IPH14PM256"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição detalhada do produto..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="wholesalePrice">Preço Atacado (R$)</Label>
                    <Input
                      id="wholesalePrice"
                      type="number"
                      step="0.01"
                      value={formData.wholesalePrice}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minWholesaleQty">Qtd Mínima Atacado</Label>
                    <Input
                      id="minWholesaleQty"
                      type="number"
                      value={formData.minWholesaleQty}
                      onChange={(e) => setFormData({ ...formData, minWholesaleQty: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="barcode">Código de Barras</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Ex: 7891234567890"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id="requiresImei"
                      checked={formData.requiresImei}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiresImei: checked as boolean })
                      }
                    />
                    <Label htmlFor="requiresImei" className="cursor-pointer">
                      Requer rastreamento por IMEI
                    </Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createProductMutation.isPending}>
                    {createProductMutation.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Produto
                      </>
                    )}
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
        </div>

        {/* Assistente IA */}
        <div className="lg:col-span-1">
          <AIAssistant
            moduleName="Cadastro de Produtos"
            moduleIcon={<Sparkles className="h-5 w-5" />}
            contextPrompt="👋 Olá! Sou seu assistente IA para cadastro de produtos. Envie uma foto do produto e eu extraio automaticamente todas as informações!"
            onSendMessage={handleAIMessage}
            onAutoFill={handleAutoFill}
            quickActions={quickActions}
            suggestions={suggestions}
          />
        </div>
      </div>
    </div>
  );
}
