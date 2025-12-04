import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  Barcode,
  Sparkles,
  Loader2,
  FileUp,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showModelSearch, setShowModelSearch] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState("");
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [isImportingXML, setIsImportingXML] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    model: "",
    sku: "",
    imei: "",
    costPrice: "",
    salePrice: "",
    wholesalePrice: "",
    minWholesaleQty: "5",
    minStock: "10",
    requiresImei: false,
  });

  const { user } = useAuth();
  const { data: products, isLoading, refetch } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produto cadastrado com sucesso!");
      setShowAddProduct(false);
      setNewProduct({
        name: "",
        category: "",
        brand: "",
        model: "",
        sku: "",
        imei: "",
        costPrice: "",
        salePrice: "",
        wholesalePrice: "",
        minWholesaleQty: "5",
        minStock: "10",
        requiresImei: false,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar produto");
    },
  });

  const analyzeProductMutation = trpc.ai.analyzeProduct.useMutation({
    onSuccess: (data) => {
      setNewProduct({
        ...newProduct,
        brand: data.brand !== "Não identificado" ? data.brand : newProduct.brand,
        model: data.model !== "Não identificado" ? data.model : newProduct.model,
        category: data.category !== "Não identificado" ? data.category : newProduct.category,
        description: data.description || newProduct.description,
      });
      
      if (data.confidence === "high") {
        toast.success("✨ Produto analisado com alta confiança!");
      } else if (data.confidence === "medium") {
        toast.success("✨ Produto analisado! Verifique os campos.");
      } else {
        toast.warning("⚠️ Não consegui identificar todos os campos.");
      }
      
      setIsAnalyzingWithAI(false);
    },
    onError: (error) => {
      toast.error("Erro ao analisar produto: " + error.message);
      setIsAnalyzingWithAI(false);
    },
  });

  const parseNFeMutation = trpc.products.parseNFe.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data.products.length > 0) {
        const prod = result.data.products[0]; // Pega o primeiro produto por enquanto
        setNewProduct({
          ...newProduct,
          name: prod.name,
          sku: prod.code,
          costPrice: prod.unitPrice.toFixed(2),
          salePrice: (prod.unitPrice * 1.5).toFixed(2), // Sugestão de margem 50%
        });
        toast.success(`Dados importados da NFe: ${prod.name}`);
        
        // Dispara análise de IA automaticamente após importar XML
        analyzeProductMutation.mutate({ productName: prod.name });
      }
      setIsImportingXML(false);
    },
    onError: (error) => {
      toast.error("Erro ao ler XML: " + error.message);
      setIsImportingXML(false);
    }
  });

  const handleXMLUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingXML(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseNFeMutation.mutate({ xmlContent: content });
    };
    reader.readAsText(file);
  };

  const filteredProducts = products?.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products?.filter((p) => {
    const stock = 0; // TODO: Calcular estoque real
    return stock < (p.minStock || 10);
  });

  const handleAnalyzeWithAI = async () => {
    if (!newProduct.name) {
      toast.error("Digite o nome do produto primeiro");
      return;
    }
    
    setIsAnalyzingWithAI(true);
    analyzeProductMutation.mutate({ productName: newProduct.name });
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.costPrice || !newProduct.salePrice) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

      createProductMutation.mutate({
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      brand: newProduct.brand,
      model: newProduct.model,
      sku: newProduct.sku,
      costPrice: Math.round(parseFloat(newProduct.costPrice) * 100),
      salePrice: Math.round(parseFloat(newProduct.salePrice) * 100),
      minStock: parseInt(newProduct.minStock) || 10,
      requiresImei: newProduct.requiresImei,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Estoque" 
          description="Gestão de produtos e rastreamento IMEI"
          backTo="/dashboard"
        />
        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            </DialogHeader>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-4 border border-dashed border-primary/20">
              <Label className="mb-2 block text-sm font-medium text-muted-foreground">
                Agilizar cadastro (Opcional)
              </Label>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="file"
                    accept=".xml"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleXMLUpload}
                    disabled={isImportingXML}
                  />
                  <Button type="button" variant="outline" className="w-full" disabled={isImportingXML}>
                    {isImportingXML ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4 mr-2 text-blue-500" />
                    )}
                    Importar XML de Nota (NFe)
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  Carregue o XML da nota de compra para preencher os dados automaticamente.
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Produto *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Ex: iPhone 15 Pro Max 256GB"
                      required
                    />
                    <Popover open={showModelSearch} onOpenChange={setShowModelSearch}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar modelo cadastrado..."
                            value={modelSearchTerm}
                            onValueChange={setModelSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                            <CommandGroup>
                              {products
                                ?.filter(p => 
                                  p.name?.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
                                  p.brand?.toLowerCase().includes(modelSearchTerm.toLowerCase())
                                )
                                .slice(0, 10)
                                .map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name || ""}
                                    onSelect={() => {
                                      setNewProduct({
                                        ...newProduct,
                                        name: product.name || "",
                                        category: product.category || "",
                                        brand: product.brand || "",
                                        model: product.model || "",
                                      });
                                      setShowModelSearch(false);
                                      setModelSearchTerm("");
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {product.brand} - {product.category}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeWithAI}
                      disabled={!newProduct.name || isAnalyzingWithAI}
                      className="shrink-0 gap-2"
                    >
                      {isAnalyzingWithAI ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Preencher com IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Ex: Smartphones"
                  />
                </div>

                <div>
                  <Label>Marca</Label>
                  <Input
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    placeholder="Ex: Apple"
                  />
                </div>

                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={newProduct.model}
                    onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                    placeholder="Ex: iPhone 15 Pro Max"
                  />
                </div>

                <div>
                  <Label>SKU</Label>
                  <Input
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Ex: IPH15PM256"
                  />
                </div>

                <div>
                  <Label>IMEI</Label>
                  <Input
                    type="text"
                    value={newProduct.imei}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                      setNewProduct({ ...newProduct, imei: value });
                    }}
                    placeholder="Buscar IMEI..."
                    maxLength={15}
                  />
                  {newProduct.imei && newProduct.imei.length !== 15 && (
                    <p className="text-xs text-red-600 mt-1">IMEI deve ter 15 dígitos</p>
                  )}
                </div>

                <div>
                  <Label>Preço de Custo (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label>Preço de Venda Varejo (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.salePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label>Preço de Atacado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.wholesalePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, wholesalePrice: e.target.value })}
                    placeholder="0.00"
                  />
                  {newProduct.wholesalePrice && newProduct.salePrice && parseFloat(newProduct.wholesalePrice) >= parseFloat(newProduct.salePrice) && (
                    <p className="text-xs text-red-600 mt-1">Preço atacado deve ser menor que varejo</p>
                  )}
                  {newProduct.wholesalePrice && newProduct.salePrice && parseFloat(newProduct.wholesalePrice) < parseFloat(newProduct.salePrice) && (
                    <p className="text-xs text-green-600 mt-1">
                      Economia: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        parseFloat(newProduct.salePrice) - parseFloat(newProduct.wholesalePrice)
                      )} por unidade
                    </p>
                  )}
                </div>

                <div>
                  <Label>Quantidade Mínima Atacado</Label>
                  <Input
                    type="number"
                    value={newProduct.minWholesaleQty}
                    onChange={(e) => setNewProduct({ ...newProduct, minWholesaleQty: e.target.value })}
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Qtd mínima para aplicar preço de atacado</p>
                </div>

                <div>
                  <Label>Estoque Mínimo</Label>
                  <Input
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                    placeholder="10"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresImei"
                    checked={newProduct.requiresImei}
                    onChange={(e) => setNewProduct({ ...newProduct, requiresImei: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="requiresImei" className="cursor-pointer">
                    Requer rastreamento por IMEI
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddProduct(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? "Salvando..." : "Cadastrar Produto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Total em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                (products?.reduce((sum, p) => sum + (p.salePrice || 0), 0) || 0) / 100
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Valor de venda total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockProducts?.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Produtos abaixo do mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Com Rastreamento IMEI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products?.filter(p => p.requiresImei).length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Produtos rastreados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Produtos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Preço Custo</TableHead>
                <TableHead className="text-right">Preço Venda</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => {
                const stock = 0; // TODO: Calcular estoque real
                const isLowStock = stock < (product.minStock || 10);
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {product.requiresImei && (
                          <Barcode className="h-4 w-4 text-blue-600" />
                        )}
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>{product.sku || "-"}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>{product.brand || "-"}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        (product.costPrice || 0) / 100
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        (product.salePrice || 0) / 100
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={isLowStock ? "text-yellow-600 font-semibold" : ""}>
                        {stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isLowStock ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Baixo
                        </Badge>
                      ) : stock === 0 ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Zerado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
