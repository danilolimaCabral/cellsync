import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Search, ShoppingCart, Trash2, Plus, Minus, UserPlus, Receipt, X, FileText } from "lucide-react";
import NFeIssuanceDialog from "@/components/NFeIssuanceDialog";

interface CartItem {
  productId: number;
  name: string;
  imei: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

// Helper para formatação de moeda brasileira
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};

export default function Vendas() {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [discount, setDiscount] = useState(0);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [emitirNFe, setEmitirNFe] = useState(false);
  const [emitirCupom, setEmitirCupom] = useState(false);
  const [cpfNota, setCpfNota] = useState("");
  const [emitindoNFe, setEmitindoNFe] = useState(false);
  const [saleType, setSaleType] = useState<"retail" | "wholesale">("retail");
  const [showNFeDialog, setShowNFeDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Verificar autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  // Queries
  const { data: products = [] } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: customers = [] } = trpc.customers.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const createSaleMutation = trpc.sales.create.useMutation({
    onSuccess: async (result) => {
      toast.success("Venda realizada com sucesso!");
      setLastSaleId(result.saleId);
      
      // Emitir NF-e se solicitado
      if (emitirNFe && selectedCustomerId) {
        // await emitirNFeParaVenda(result.saleId, selectedCustomerId);
        // Nova abordagem: Abrir diálogo de emissão
        setShowNFeDialog(true);
      }
      
      setShowReceipt(true);
      setCart([]);
      setSelectedCustomerId(null);
      setDiscount(0);
      setPaymentMethod("dinheiro");
      setEmitirNFe(false);
      searchInputRef.current?.focus();
    },
    onError: (error) => {
      toast.error(`Erro ao realizar venda: ${error.message}`);
    },
  });

  const createCustomerMutation = trpc.customers.create.useMutation({
    onSuccess: (data) => {
      toast.success("Cliente cadastrado com sucesso!");
      // Recarregar lista de clientes e selecionar o novo cliente
      setShowNewCustomer(false);
      if (data.customer && data.customer.id) {
        // Pequeno delay para garantir que a lista de clientes foi atualizada
        setTimeout(() => {
          setSelectedCustomerId(data.customer.id);
        }, 100);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar cliente: ${error.message}`);
    },
  });

  const issueNFeMutation = trpc.nfe.create.useMutation({
    onSuccess: () => {
      toast.success("NF-e emitida com sucesso!");
      setEmitindoNFe(false);
    },
    onError: (error) => {
      toast.error(`Erro ao emitir NF-e: ${error.message}`);
      setEmitindoNFe(false);
    },
  });

  // Filtrar produtos pela busca
  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p as any).imei?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular preço baseado em tipo de venda e quantidade
  const calculatePrice = (product: typeof products[0], quantity: number) => {
    const retailPrice = product.salePrice || 0;
    const wholesalePrice = (product as any).wholesalePrice;
    const minWholesaleQty = (product as any).minWholesaleQty || 5;

    // Se não tem preço de atacado ou tipo é varejo, usa preço de varejo
    if (!wholesalePrice || saleType === "retail") {
      return retailPrice;
    }

    // Atacado - verifica quantidade mínima
    if (quantity >= minWholesaleQty) {
      return wholesalePrice;
    }

    // Quantidade insuficiente para atacado
    return retailPrice;
  };

  // Adicionar produto ao carrinho
  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= (product.currentStock || 0)) {
        toast.error("Estoque insuficiente!");
        return;
      }
      const newQuantity = existingItem.quantity + 1;
      const newPrice = calculatePrice(product, newQuantity);
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity, unitPrice: newPrice }
            : item
        )
      );
    } else {
      if ((product.currentStock || 0) < 1) {
        toast.error("Produto sem estoque!");
        return;
      }
      const unitPrice = calculatePrice(product, 1);
      setCart([
        ...cart,
        {
          productId: product.id || 0,
          name: product.name || "",
          imei: product.sku || "",
          quantity: 1,
          unitPrice,
          stock: product.currentStock || 0,
        },
      ]);
    }
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  // Atualizar quantidade
  const updateQuantity = (productId: number, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity > item.stock) {
              toast.error("Estoque insuficiente!");
              return item;
            }
            // Buscar produto para recalcular preço
            const product = products.find(p => p.id === productId);
            if (product) {
              const newPrice = calculatePrice(product, newQuantity);
              return { ...item, quantity: newQuantity, unitPrice: newPrice };
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Remover item
  const removeItem = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal - discount;

  // Calcular economia de atacado
  const savedAmount = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return sum;
    
    const retailPrice = product.salePrice || 0;
    const wholesalePrice = (product as any).wholesalePrice;
    const minWholesaleQty = (product as any).minWholesaleQty || 5;
    
    // Se está usando preço de atacado
    if (wholesalePrice && saleType === "wholesale" && item.quantity >= minWholesaleQty) {
      const savings = (retailPrice - wholesalePrice) * item.quantity;
      return sum + savings;
    }
    
    return sum;
  }, 0);

  // Verificar produtos próximos do limite de atacado
  const productsNearWholesale = cart.filter(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return false;
    
    const wholesalePrice = (product as any).wholesalePrice;
    const minWholesaleQty = (product as any).minWholesaleQty || 5;
    
    // Tem preço de atacado mas não atingiu quantidade mínima
    return wholesalePrice && item.quantity < minWholesaleQty && item.quantity >= minWholesaleQty - 2;
  });

  // Emitir NF-e para venda
  const emitirNFeParaVenda = async (saleId: number, customerId: number) => {
    setEmitindoNFe(true);
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        toast.error("Cliente não encontrado!");
        return;
      }

      // Validar documento do cliente
      if (!customer.cpf && !customer.cnpj) {
        toast.error("Cliente sem CPF/CNPJ cadastrado! NF-e não emitida.");
        return;
      }

      // Preparar itens da NF-e
      const items = cart.map(item => ({
        productId: item.productId,
        description: item.name,
        ncm: "61091000", // NCM genérico para celulares
        cfop: "5102", // Venda de mercadoria adquirida
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      }));

      // Emitir NF-e
      issueNFeMutation.mutate({
        saleId,
        emitterCnpj: "00000000000000", // TODO: Pegar do sistema
        emitterName: "CellSync",
        recipientDocument: customer.cpf || customer.cnpj || "",
        recipientName: customer.name,
        recipientAddress: customer.address || undefined,
        recipientCity: customer.city || undefined,
        recipientState: customer.state || undefined,
        recipientZipCode: customer.zipCode || undefined,
        recipientPhone: customer.phone || undefined,
        recipientEmail: customer.email || undefined,
        cfop: "5102",
        natureOperation: "Venda de mercadoria",
        paymentMethod: paymentMethod as any,
        paymentIndicator: "a_vista" as const,
        totalProducts: subtotal,
        totalDiscount: discount,
        totalInvoice: total,
        items,
      });
    } catch (error: any) {
      toast.error(`Erro ao emitir NF-e: ${error.message}`);
      setEmitindoNFe(false);
    }
  };

  // Finalizar venda
  const finalizeSale = () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho!");
      return;
    }
    if (!selectedCustomerId) {
      toast.error("Selecione um cliente!");
      return;
    }
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }

    createSaleMutation.mutate({
      customerId: selectedCustomerId,
      totalAmount: subtotal,
      discount,
      paymentMethod,
      saleType,
      appliedDiscount: savedAmount,
      emitirNfce: emitirCupom,
      cpfNota: cpfNota.replace(/\D/g, ""),
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F2 - Focar busca
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F3 - Finalizar venda
      if (e.key === "F3" && cart.length > 0 && selectedCustomerId) {
        e.preventDefault();
        finalizeSale();
      }
      // F4 - Novo cliente
      if (e.key === "F4") {
        e.preventDefault();
        setShowNewCustomer(true);
      }
      // ESC - Limpar carrinho
      if (e.key === "Escape" && cart.length > 0) {
        e.preventDefault();
        if (confirm("Deseja limpar o carrinho?")) {
          setCart([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [cart, selectedCustomerId]);

  // Mutation para gerar recibo
  const generateReceiptMutation = trpc.sales.generateReceipt.useMutation({
    onSuccess: (result) => {
      // Converter base64 para blob
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      
      // Criar URL e abrir em nova aba
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      
      toast.success("Recibo gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar recibo: " + error.message);
    },
  });

  // Imprimir comprovante
  const printReceipt = () => {
    if (!lastSaleId) {
      toast.error("Nenhuma venda selecionada");
      return;
    }
    
    generateReceiptMutation.mutate({ saleId: lastSaleId });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header com título */}
      <div className="mb-6">
        <PageHeader 
          title="Ponto de Venda (PDV)" 
          description="Sistema integrado de vendas"
          backTo="/dashboard"
        />
      </div>

      {/* Barra de controles (Varejo/Atacado + Atalhos) */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
        {/* Toggle Varejo/Atacado */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <button
            onClick={() => setSaleType("retail")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              saleType === "retail"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            🛍️ Varejo
          </button>
          <button
            onClick={() => setSaleType("wholesale")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              saleType === "wholesale"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            📦 Atacado
          </button>
        </div>
        
        {/* Atalhos de teclado */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-600 font-medium">Atalhos:</span>
          <span className="px-2 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono text-xs">F2</span>
          <span className="text-slate-500">Busca</span>
          <span className="text-slate-300">|</span>
          <span className="px-2 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono text-xs">F3</span>
          <span className="text-slate-500">Finalizar</span>
          <span className="text-slate-300">|</span>
          <span className="px-2 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono text-xs">F4</span>
          <span className="text-slate-500">Cliente</span>
          <span className="text-slate-300">|</span>
          <span className="px-2 py-1 bg-white rounded border border-slate-300 text-slate-700 font-mono text-xs">ESC</span>
          <span className="text-slate-500">Limpar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda - Busca e Produtos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Busca de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                ref={searchInputRef}
                placeholder="Digite o nome ou IMEI do iPhone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-lg"
                autoFocus
              />
            </CardContent>
          </Card>

          {/* Lista de Produtos Filtrados */}
          {searchTerm && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum produto encontrado
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            IMEI: {product.sku} | Estoque: {product.currentStock}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(product.salePrice || 0)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Carrinho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
                </div>
                {saleType === "wholesale" && savedAmount > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <span className="text-green-600">✓</span>
                    Economia: {formatCurrency(savedAmount)}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Busque e adicione produtos para iniciar a venda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Alerta de produtos próximos do atacado */}
                  {productsNearWholesale.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">
                        💡 Dica: Adicione mais unidades para ativar preço de atacado!
                      </p>
                      {productsNearWholesale.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const minWholesaleQty = (product as any)?.minWholesaleQty || 5;
                        const remaining = minWholesaleQty - item.quantity;
                        return (
                          <p key={item.productId} className="text-xs text-amber-700">
                            • {item.name}: adicione mais {remaining} {remaining === 1 ? 'unidade' : 'unidades'}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unitPrice)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right min-w-24">
                        <p className="font-bold text-lg">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita - Resumo e Finalização */}
        <div className="space-y-4">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={selectedCustomerId?.toString() || ""}
                onValueChange={(value) => setSelectedCustomerId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Cliente (F4)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createCustomerMutation.mutate({
                        name: formData.get("name") as string,
                        phone: formData.get("phone") as string,
                        email: formData.get("email") as string,
                        cpf: formData.get("cpf") as string,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input id="phone" name="phone" required />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input id="cpf" name="cpf" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Cadastrar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewCustomer(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="debito">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={subtotal / 100}
                  value={discount / 100}
                  onChange={(e) => setDiscount(Math.floor(Number(e.target.value) * 100))}
                />
              </div>

              {/* Opções Fiscais */}
              <div className="space-y-3 pt-2 border-t">
                {/* NF-e */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emitir-nfe"
                    checked={emitirNFe}
                    onChange={(e) => {
                      setEmitirNFe(e.target.checked);
                      if (e.target.checked) setEmitirCupom(false);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={!selectedCustomerId}
                  />
                  <Label htmlFor="emitir-nfe" className="cursor-pointer">
                    Emitir NF-e (Nota Grande)
                    {!selectedCustomerId && " (selecione um cliente)"}
                  </Label>
                </div>

                {/* NFC-e (Cupom) */}
                <div className="bg-blue-50 p-3 rounded-lg space-y-3 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emitir-cupom" className="text-base font-medium text-blue-900 cursor-pointer">
                        Emitir Cupom Fiscal (NFC-e)
                      </Label>
                      <p className="text-xs text-blue-700">
                        Gera o documento fiscal simplificado
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="emitir-cupom"
                      checked={emitirCupom}
                      onChange={(e) => {
                        setEmitirCupom(e.target.checked);
                        if (e.target.checked) setEmitirNFe(false);
                      }}
                      className="h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  {emitirCupom && (
                    <div className="pt-2 animate-in slide-in-from-top-2">
                      <Label htmlFor="cpf-nota" className="text-sm font-medium mb-1.5 block text-blue-900">
                        CPF na Nota (Opcional)
                      </Label>
                      <Input
                        id="cpf-nota"
                        placeholder="000.000.000-00"
                        value={cpfNota}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          if (v.length <= 11) {
                            setCpfNota(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
                          }
                        }}
                        className="bg-white border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-lg text-destructive">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Botão Finalizar */}
          <Button
            size="lg"
            className="w-full text-lg h-14"
            onClick={finalizeSale}
            disabled={cart.length === 0 || !selectedCustomerId || createSaleMutation.isPending}
          >
            <Receipt className="h-5 w-5 mr-2" />
            {createSaleMutation.isPending ? "Processando..." : "Finalizar Venda (F3)"}
          </Button>

          {cart.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (confirm("Deseja limpar o carrinho?")) {
                  setCart([]);
                }
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Carrinho (ESC)
            </Button>
          )}
        </div>
      </div>

      {/* Diálogo de Emissão de NF-e */}
      <NFeIssuanceDialog 
        open={showNFeDialog} 
        onOpenChange={setShowNFeDialog}
        saleId={lastSaleId}
      />

      {/* Dialog de Comprovante */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Venda Realizada com Sucesso!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✓</div>
              <p className="text-xl font-bold">Venda #{lastSaleId}</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {formatCurrency(total)}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={printReceipt} className="flex-1">
                <Receipt className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReceipt(false);
                  setLastSaleId(null);
                }}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
