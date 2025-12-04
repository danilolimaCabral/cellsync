import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Minus } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  brand: string;
  model: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  currentStock: number;
  requiresImei: boolean;
}

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditProductDialog({ product, open, onOpenChange, onSuccess }: EditProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    model: "",
    sku: "",
    costPrice: "",
    salePrice: "",
    minStock: "",
    currentStock: "",
    requiresImei: false,
  });

  const [stockAdjustment, setStockAdjustment] = useState(0);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category,
        brand: product.brand,
        model: product.model,
        sku: product.sku,
        costPrice: (product.costPrice / 100).toFixed(2),
        salePrice: (product.salePrice / 100).toFixed(2),
        minStock: product.minStock.toString(),
        currentStock: product.currentStock.toString(),
        requiresImei: product.requiresImei,
      });
      setStockAdjustment(0);
    }
  }, [product]);

  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const newStock = parseInt(formData.currentStock) + stockAdjustment;

    // Remove currentStock from the mutation input as it's not part of the update schema
    // Instead, pass stockAdjustment which is handled by the backend
    updateProductMutation.mutate({
      id: product.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      sku: formData.sku,
      costPrice: Math.round(parseFloat(formData.costPrice) * 100),
      salePrice: Math.round(parseFloat(formData.salePrice) * 100),
      minStock: parseInt(formData.minStock),
      requiresImei: formData.requiresImei,
      stockAdjustment: stockAdjustment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome do Produto</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Marca</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div>
              <Label>Modelo</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <Label>SKU (Código)</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            <div>
              <Label>Preço de Custo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2 bg-muted/30 p-4 rounded-lg border">
              <Label className="text-base font-semibold mb-2 block">Ajuste de Estoque</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Estoque Atual</Label>
                  <div className="text-2xl font-bold">{formData.currentStock}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setStockAdjustment(prev => prev - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className={`w-16 text-center font-mono text-lg ${stockAdjustment > 0 ? 'text-green-600' : stockAdjustment < 0 ? 'text-red-600' : ''}`}>
                    {stockAdjustment > 0 ? `+${stockAdjustment}` : stockAdjustment}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setStockAdjustment(prev => prev + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 text-right">
                  <Label className="text-xs text-muted-foreground">Estoque Final</Label>
                  <div className="text-2xl font-bold text-primary">
                    {parseInt(formData.currentStock || "0") + stockAdjustment}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use os botões + e - para adicionar ou remover unidades do estoque.
              </p>
            </div>

            <div>
              <Label>Estoque Mínimo</Label>
              <Input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                checked={formData.requiresImei}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresImei: checked })}
              />
              <Label>Exigir IMEI na venda</Label>
            </div>

            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProductMutation.isPending}>
              {updateProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
