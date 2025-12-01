import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Printer, Download, Tag, Loader2 } from "lucide-react";

type LabelSize = "small" | "medium" | "large";

interface SelectedProduct {
  id: number;
  name: string;
  sku: string;
  brand?: string;
  model?: string;
  salePrice: number;
  quantity: number;
}

interface GeneratedLabel {
  barcode: string;
  qrcode: string;
  productName: string;
  price: string;
  sku: string;
  brand?: string;
  model?: string;
}

export default function GerarEtiquetas() {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [labelSize, setLabelSize] = useState<LabelSize>("medium");
  const [generatedLabels, setGeneratedLabels] = useState<GeneratedLabel[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: products = [] } = trpc.products.list.useQuery();
  const generateLabelMutation = trpc.labels.generate.useMutation();

  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto");
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return;

    // Verificar se já foi adicionado
    if (selectedProducts.some((p) => p.id === product.id)) {
      toast.warning("Produto já adicionado");
      return;
    }

    setSelectedProducts([
      ...selectedProducts,
      {
        id: product.id!,
        name: product.name!,
        sku: product.sku ?? `PROD-${product.id}`,
        brand: product.brand ?? undefined,
        model: product.model ?? undefined,
        salePrice: product.salePrice!,
        quantity: 1,
      },
    ]);

    setSelectedProductId("");
    toast.success("Produto adicionado");
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const handleQuantityChange = (id: number, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, quantity) } : p))
    );
  };

  const handleGenerateLabels = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    setIsGenerating(true);
    const labels: GeneratedLabel[] = [];

    try {
      for (const product of selectedProducts) {
        // Gerar etiquetas conforme a quantidade
        for (let i = 0; i < product.quantity; i++) {
          const label = await generateLabelMutation.mutateAsync({
            productName: product.name,
            price: product.salePrice,
            sku: product.sku,
            brand: product.brand,
            model: product.model,
          });
          labels.push(label);
        }
      }

      setGeneratedLabels(labels);
      toast.success(`${labels.length} etiquetas geradas com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro ao gerar etiquetas: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getLabelSizeClass = () => {
    switch (labelSize) {
      case "small":
        return "w-48 h-24";
      case "medium":
        return "w-64 h-32";
      case "large":
        return "w-96 h-48";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerar Etiquetas</h1>
        <p className="text-muted-foreground">
          Gere etiquetas de preço com código de barras e QR code
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Configuração
            </h2>

            <div className="space-y-4">
              {/* Selecionar produto */}
              <div className="space-y-2">
                <Label>Adicionar Produto</Label>
                <div className="flex gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id!} value={product.id!.toString()}>
                          {product.name} - {product.sku ?? `PROD-${product.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddProduct}>Adicionar</Button>
                </div>
              </div>

              {/* Tamanho da etiqueta */}
              <div className="space-y-2">
                <Label>Tamanho da Etiqueta</Label>
                <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequena (12x6cm)</SelectItem>
                    <SelectItem value="medium">Média (16x8cm)</SelectItem>
                    <SelectItem value="large">Vitrine (24x12cm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de produtos selecionados */}
              <div className="space-y-2">
                <Label>Produtos Selecionados ({selectedProducts.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 p-2 border rounded"
                    >
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-muted-foreground text-xs">
                          SKU: {product.sku}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) =>
                          handleQuantityChange(product.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateLabels}
                  disabled={isGenerating || selectedProducts.length === 0}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 mr-2" />
                      Gerar Etiquetas
                    </>
                  )}
                </Button>
              </div>

              {generatedLabels.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={handlePrint} variant="outline" className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          {generatedLabels.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Gere etiquetas para visualizar o preview
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {generatedLabels.slice(0, 3).map((label, index) => (
                <div
                  key={index}
                  className={`border rounded p-4 bg-white text-black print:break-inside-avoid ${getLabelSizeClass()}`}
                >
                  {labelSize === "large" ? (
                    // Layout Vitrine
                    <div className="h-full flex flex-col justify-between">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2">{label.productName}</div>
                        {label.brand && (
                          <div className="text-lg text-gray-600">{label.brand}</div>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <img src={label.barcode} alt="Barcode" className="h-16" />
                        <img src={label.qrcode} alt="QR Code" className="w-20 h-20" />
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">{label.price}</div>
                        <div className="text-sm text-gray-500">SKU: {label.sku}</div>
                      </div>
                    </div>
                  ) : labelSize === "medium" ? (
                    // Layout Médio
                    <div className="h-full flex flex-col justify-between">
                      <div className="text-sm font-semibold truncate">{label.productName}</div>
                      <div className="flex items-center justify-between gap-2">
                        <img src={label.barcode} alt="Barcode" className="h-10 flex-1" />
                        <img src={label.qrcode} alt="QR Code" className="w-12 h-12" />
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-2xl font-bold text-green-600">{label.price}</div>
                        <div className="text-xs text-gray-500">{label.sku}</div>
                      </div>
                    </div>
                  ) : (
                    // Layout Pequeno
                    <div className="h-full flex flex-col justify-between text-xs">
                      <div className="font-semibold truncate">{label.productName}</div>
                      <img src={label.barcode} alt="Barcode" className="h-8" />
                      <div className="flex justify-between items-end">
                        <div className="text-lg font-bold text-green-600">{label.price}</div>
                        <div className="text-xs text-gray-500">{label.sku}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {generatedLabels.length > 3 && (
                <div className="text-center text-muted-foreground text-sm">
                  + {generatedLabels.length - 3} etiquetas adicionais
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Área de impressão (oculta na tela) */}
      <div className="hidden print:block">
        <div className="grid grid-cols-3 gap-4">
          {generatedLabels.map((label, index) => (
            <div
              key={index}
              className={`border rounded p-4 bg-white text-black print:break-inside-avoid ${getLabelSizeClass()}`}
            >
              {labelSize === "large" ? (
                <div className="h-full flex flex-col justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{label.productName}</div>
                    {label.brand && <div className="text-lg text-gray-600">{label.brand}</div>}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <img src={label.barcode} alt="Barcode" className="h-16" />
                    <img src={label.qrcode} alt="QR Code" className="w-20 h-20" />
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{label.price}</div>
                    <div className="text-sm text-gray-500">SKU: {label.sku}</div>
                  </div>
                </div>
              ) : labelSize === "medium" ? (
                <div className="h-full flex flex-col justify-between">
                  <div className="text-sm font-semibold truncate">{label.productName}</div>
                  <div className="flex items-center justify-between gap-2">
                    <img src={label.barcode} alt="Barcode" className="h-10 flex-1" />
                    <img src={label.qrcode} alt="QR Code" className="w-12 h-12" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-2xl font-bold text-green-600">{label.price}</div>
                    <div className="text-xs text-gray-500">{label.sku}</div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between text-xs">
                  <div className="font-semibold truncate">{label.productName}</div>
                  <img src={label.barcode} alt="Barcode" className="h-8" />
                  <div className="flex justify-between items-end">
                    <div className="text-lg font-bold text-green-600">{label.price}</div>
                    <div className="text-xs text-gray-500">{label.sku}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
