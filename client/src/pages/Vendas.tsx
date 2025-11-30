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
import { Search, ShoppingCart, Trash2, Plus, Minus, UserPlus, Receipt, X } from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  imei: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

export default function Vendas() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [discount, setDiscount] = useState(0);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [emitirNFe, setEmitirNFe] = useState(false);
  const [emitindoNFe, setEmitindoNFe] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();

  // Mutations
  const createSaleMutation = trpc.sales.create.useMutation({
    onSuccess: async (result) => {
      toast.success("Venda realizada com sucesso!");
      setLastSaleId(result.saleId);
      
      // Emitir NF-e se solicitado
      if (emitirNFe && selectedCustomerId) {
        await emitirNFeParaVenda(result.saleId, selectedCustomerId);
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
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      // Recarregar lista de clientes
      setShowNewCustomer(false);
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
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.imei?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionar produto ao carrinho
  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast.error("Estoque insuficiente!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.currentStock < 1) {
        toast.error("Produto sem estoque!");
        return;
      }
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          imei: product.sku || "",
          quantity: 1,
          unitPrice: product.salePrice,
          stock: product.currentStock,
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
        emitterName: "OkCells",
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ponto de Venda (PDV)</h1>
          <p className="text-muted-foreground">Sistema integrado de vendas</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Atalhos: F2 (Busca) | F3 (Finalizar) | F4 (Cliente) | ESC (Limpar)</p>
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
                            R$ {(product.salePrice / 100).toFixed(2)}
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
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
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
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {(item.unitPrice / 100).toFixed(2)} x {item.quantity}
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
                          R$ {((item.unitPrice * item.quantity) / 100).toFixed(2)}
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

              <div className="flex items-center space-x-2 pt-2 border-t">
                <input
                  type="checkbox"
                  id="emitir-nfe"
                  checked={emitirNFe}
                  onChange={(e) => setEmitirNFe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={!selectedCustomerId}
                />
                <Label htmlFor="emitir-nfe" className="cursor-pointer">
                  Emitir NF-e automaticamente
                  {!selectedCustomerId && " (selecione um cliente)"}
                </Label>
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
                <span>R$ {(subtotal / 100).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-lg text-destructive">
                  <span>Desconto:</span>
                  <span>- R$ {(discount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">R$ {(total / 100).toFixed(2)}</span>
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
                R$ {(total / 100).toFixed(2)}</p>
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
