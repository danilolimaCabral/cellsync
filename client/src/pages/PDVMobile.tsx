import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign,
  User,
  UserCheck,
  Check,
  X,
  ScanBarcode
} from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  stock: number;
}

/**
 * PDV Mobile - Versão otimizada para celular
 * Foco em vendas rápidas com seleção de vendedor para comissão
 */
export default function PDVMobile() {
  // Estados principais
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("money");
  const [showCheckout, setShowCheckout] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [emitirCupom, setEmitirCupom] = useState(false);
  const [cpfNota, setCpfNota] = useState("");

  // Queries
  const { data: productsData, isLoading: loadingProducts } = trpc.products.list.useQuery({
    search: searchTerm,
    limit: 20,
    offset: 0,
  });

  const { data: usersData } = trpc.users.list.useQuery({});
  const { data: clientsData } = trpc.customers.list.useQuery({ limit: 100, offset: 0 });

  // Mutation para criar venda
  const createSaleMutation = trpc.sales.create.useMutation({
    onSuccess: () => {
      toast.success("Venda finalizada com sucesso!");
      // Limpar carrinho
      setCart([]);
      setSelectedVendorId(null);
      setSelectedClientId(null);
      setDiscount(0);
      setEmitirCupom(false);
      setCpfNota("");
      setShowCheckout(false);
    },
    onError: (error) => {
      toast.error(`Erro ao finalizar venda: ${error.message}`);
    },
  });

  const products = productsData || [];
  const vendors = (usersData || []).filter((u: any) => u.isVendor);
  const clients = clientsData || [];

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Adicionar produto ao carrinho
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error("Estoque insuficiente!");
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock <= 0) {
        toast.error("Produto sem estoque!");
        return;
      }
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        stock: product.stock,
      }]);
    }
    toast.success(`${product.name} adicionado!`);
  };

  // Remover produto do carrinho
  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast.info("Produto removido");
  };

  // Atualizar quantidade
  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stock) {
          toast.error("Estoque insuficiente!");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Finalizar venda
  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio!");
      return;
    }
    if (!selectedVendorId) {
      toast.error("Selecione um vendedor!");
      return;
    }
    setShowCheckout(true);
  };

  const confirmSale = () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente!");
      return;
    }
    
    createSaleMutation.mutate({
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      customerId: selectedClientId,
      paymentMethod,
      totalAmount: total,
      discount,
      saleType: "retail",
      appliedDiscount: discount,
      emitirNfce: emitirCupom,
      cpfNota: cpfNota.replace(/\D/g, ""),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-24">
      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PDV Mobile
          </h1>
          <p className="text-sm text-muted-foreground">Vendas Rápidas</p>
        </div>

        {/* Seleção de Vendedor */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Vendedor *</span>
          </div>
          <Select
            value={selectedVendorId?.toString() || ""}
            onValueChange={(value) => setSelectedVendorId(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o vendedor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor: any) => (
                <SelectItem key={vendor.id} value={vendor.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{vendor.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {vendor.commissionType === "percentage" && `${vendor.commissionValue}%`}
                      {vendor.commissionType === "fixed" && `R$ ${vendor.commissionValue}`}
                      {vendor.commissionType === "mixed" && "Mista"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Busca de Produtos */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome, código ou IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            <ScanBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="p-4 space-y-3">
        {loadingProducts && (
          <div className="text-center py-8 text-muted-foreground">
            Carregando produtos...
          </div>
        )}

        {!loadingProducts && products.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum produto encontrado
          </div>
        )}

        {products.map((product: any) => (
          <Card
            key={product.id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => addToCart(product)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {product.brand} • {product.model}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={product.stock > 0 ? "default" : "destructive"} className="text-xs">
                      Estoque: {product.stock}
                    </Badge>
                    {product.imei && (
                      <Badge variant="outline" className="text-xs">
                        IMEI: {product.imei}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-green-600">
                    R$ {product.price.toFixed(2)}
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carrinho Flutuante */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50">
          <div className="p-4">
            {/* Items do Carrinho */}
            <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-semibold w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right font-bold text-sm">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total e Finalizar */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{itemCount} itens</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {total.toFixed(2)}
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8"
                onClick={handleFinalizeSale}
                disabled={!selectedVendorId}
              >
                <Check className="h-5 w-5 mr-2" />
                Finalizar Venda
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cliente (Opcional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cliente (Opcional)
              </label>
              <Select
                value={selectedClientId?.toString() || ""}
                onValueChange={(value) => setSelectedClientId(value ? Number(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem cliente</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Forma de Pagamento *
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="money">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desconto */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Desconto (R$)
              </label>
              <Input
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>

            {/* Cupom Fiscal */}
            <div className="bg-blue-50 p-3 rounded-lg space-y-3 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emitir-cupom" className="text-base font-medium text-blue-900">
                    Emitir Cupom Fiscal (NFC-e)
                  </Label>
                  <p className="text-xs text-blue-700">
                    Gera o documento fiscal automaticamente
                  </p>
                </div>
                <Switch
                  id="emitir-cupom"
                  checked={emitirCupom}
                  onCheckedChange={setEmitirCupom}
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

            {/* Resumo */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto:</span>
                  <span className="font-semibold">- R$ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              disabled={createSaleMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-green-600 to-emerald-600"
              onClick={confirmSale}
              disabled={createSaleMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              {createSaleMutation.isPending ? "Finalizando..." : "Confirmar Venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
