import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Search,
  Trash2,
  CreditCard,
  User,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function Vendas() {
  const [showNewSale, setShowNewSale] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [discount, setDiscount] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const { user } = useAuth();

  // Queries
  const { data: sales, refetch: refetchSales } = trpc.sales.list.useQuery({}, {
    enabled: !!user,
  });
  const { data: clients } = trpc.clients.list.useQuery({}, {
    enabled: !!user,
  });
  const { data: products } = trpc.products.list.useQuery({}, {
    enabled: !!user,
  });
  const { data: metrics } = trpc.sales.metrics.useQuery({}, {
    enabled: !!user,
  });

  // Mutation
  const createSaleMutation = trpc.sales.create.useMutation({
    onSuccess: () => {
      toast.success("Venda realizada com sucesso!");
      setShowNewSale(false);
      setCart([]);
      setSelectedClient("");
      setPaymentMethod("pix");
      setDiscount("0");
      refetchSales();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao realizar venda");
    },
  });

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast.error("Estoque insuficiente");
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
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.salePrice,
          quantity: 1,
          maxStock: product.currentStock,
        },
      ]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity > item.maxStock) {
            toast.error("Estoque insuficiente");
            return item;
          }
          if (newQuantity < 1) return item;
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountValue = parseFloat(discount) || 0;
  const total = subtotal - discountValue;

  const handleFinishSale = () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho");
      return;
    }

    createSaleMutation.mutate({
      clientId: parseInt(selectedClient),
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      paymentMethod,
      discount: Math.round(discountValue * 100),
      totalAmount: Math.round(total * 100),
    });
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter((s) =>
      s.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toString().includes(searchTerm)
    );
  }, [sales, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendas (PDV)" 
        description="Realize vendas e gerencie o histórico"
        backTo="/dashboard"
      />

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vendas Hoje
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.todayCount}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics.todayAmount)} em vendas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Médio
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.averageTicket)}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Mês
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.monthAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.monthCount} vendas realizadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.productsSold}</div>
              <p className="text-xs text-muted-foreground">
                Itens vendidos hoje
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Venda</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna da Esquerda: Seleção de Produtos */}
              <div className="space-y-4">
                <div>
                  <Label>Buscar Produto</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou IMEI..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum produto encontrado
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors gap-2"
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
              </div>

              {/* Coluna da Direita: Carrinho e Checkout */}
              <div className="space-y-6 border-l pl-6">
                <div>
                  <Label>Cliente</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Carrinho ({cart.length} itens)</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 border rounded-lg border-dashed">
                        Carrinho vazio
                      </p>
                    ) : (
                      cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-2 border rounded bg-background">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.price)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded">
                              <button
                                className="px-2 py-1 hover:bg-accent"
                                onClick={() => updateQuantity(item.productId, -1)}
                              >
                                -
                              </button>
                              <span className="px-2 text-sm">{item.quantity}</span>
                              <button
                                className="px-2 py-1 hover:bg-accent"
                                onClick={() => updateQuantity(item.productId, 1)}
                              >
                                +
                              </button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Desconto (R$)</Label>
                      <Input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Pagamento</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                          <SelectItem value="debit_card">Cartão Débito</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleFinishSale}
                    disabled={createSaleMutation.isPending}
                  >
                    {createSaleMutation.isPending ? "Processando..." : "Finalizar Venda"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">#{sale.id}</TableCell>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {sale.client?.name}
                        </div>
                      </TableCell>
                      <TableCell>{sale.items?.length || 0} itens</TableCell>
                      <TableCell className="capitalize">
                        {sale.paymentMethod === "credit_card" ? "Crédito" :
                         sale.paymentMethod === "debit_card" ? "Débito" :
                         sale.paymentMethod}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Concluído
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
