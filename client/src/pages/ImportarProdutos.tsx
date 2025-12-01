import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ParsedProduct {
  name: string;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  requiresImei: boolean;
}

export default function ImportarProdutos() {
  const [csvData, setCsvData] = useState("");
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const importMutation = trpc.products.importBulk.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setIsImporting(false);
      
      if (data.failed === 0) {
        toast.success(`✅ ${data.success} produtos importados com sucesso!`);
        setCsvData("");
        setParsedProducts([]);
      } else {
        toast.warning(`⚠️ ${data.success} importados, ${data.failed} com erro`);
      }
    },
    onError: (error) => {
      toast.error("Erro ao importar produtos: " + error.message);
      setIsImporting(false);
    },
  });

  const parseCSV = () => {
    try {
      const lines = csvData.trim().split("\n");
      
      if (lines.length < 2) {
        toast.error("Dados insuficientes. Cole pelo menos o cabeçalho e uma linha de dados.");
        return;
      }

      // Primeira linha é o cabeçalho
      const headers = lines[0].split("\t").map(h => h.trim().toLowerCase());
      
      const products: ParsedProduct[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split("\t");
        
        if (values.length < 2) continue; // Pular linhas vazias
        
        const product: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || "";
          
          // Mapear colunas
          if (header.includes("nome") || header.includes("produto") || header.includes("descrição")) {
            product.name = value;
          } else if (header.includes("categoria")) {
            product.category = value;
          } else if (header.includes("marca")) {
            product.brand = value;
          } else if (header.includes("modelo")) {
            product.model = value;
          } else if (header.includes("sku") || header.includes("código")) {
            product.sku = value;
          } else if (header.includes("barcode") || header.includes("ean") || header.includes("gtin")) {
            product.barcode = value;
          } else if (header.includes("custo") || header.includes("compra")) {
            const price = parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));
            product.costPrice = isNaN(price) ? 0 : Math.round(price * 100);
          } else if (header.includes("venda") || header.includes("preço") || header.includes("preco")) {
            const price = parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));
            product.salePrice = isNaN(price) ? 0 : Math.round(price * 100);
          } else if (header.includes("estoque") || header.includes("mínimo") || header.includes("minimo")) {
            product.minStock = parseInt(value) || 10;
          }
        });
        
        // Validar campos obrigatórios
        if (product.name && product.costPrice >= 0 && product.salePrice >= 0) {
          products.push({
            name: product.name,
            category: product.category || "",
            brand: product.brand || "",
            model: product.model || "",
            sku: product.sku || "",
            barcode: product.barcode || "",
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            minStock: product.minStock || 10,
            requiresImei: false,
          });
        }
      }
      
      if (products.length === 0) {
        toast.error("Nenhum produto válido encontrado. Verifique os dados.");
        return;
      }
      
      setParsedProducts(products);
      toast.success(`✅ ${products.length} produtos prontos para importar`);
    } catch (error) {
      toast.error("Erro ao processar dados: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  };

  const handleImport = () => {
    if (parsedProducts.length === 0) {
      toast.error("Nenhum produto para importar");
      return;
    }
    
    setIsImporting(true);
    setImportResult(null);
    importMutation.mutate({ products: parsedProducts });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Importar Produtos"
        description="Importe produtos em lote copiando dados do Excel"
      />

      <Card>
        <CardHeader>
          <CardTitle>Como Importar</CardTitle>
          <CardDescription>
            1. Abra sua planilha Excel com os produtos<br />
            2. Selecione todas as células (incluindo cabeçalho)<br />
            3. Copie (Ctrl+C)<br />
            4. Cole no campo abaixo (Ctrl+V)<br />
            5. Clique em "Processar Dados"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Dados da Planilha (Cole aqui)</Label>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Cole aqui os dados copiados do Excel (com cabeçalho)..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={parseCSV} disabled={!csvData || isImporting}>
              <Upload className="w-4 h-4 mr-2" />
              Processar Dados
            </Button>
            {parsedProducts.length > 0 && (
              <Button onClick={handleImport} disabled={isImporting} variant="default">
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Importar {parsedProducts.length} Produtos
                  </>
                )}
              </Button>
            )}
          </div>

          {importResult && (
            <Alert variant={importResult.failed === 0 ? "default" : "destructive"}>
              <AlertDescription>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.failed === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {importResult.success} importados, {importResult.failed} com erro
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm space-y-1">
                    {importResult.errors.slice(0, 5).map((error, idx) => (
                      <div key={idx}>• {error}</div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div>... e mais {importResult.errors.length - 5} erros</div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {parsedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Produtos ({parsedProducts.length})</CardTitle>
            <CardDescription>Confira os dados antes de importar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-right">Estoque Mín</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedProducts.slice(0, 10).map((product, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.brand || "-"}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>{product.sku || "-"}</TableCell>
                      <TableCell className="text-right">
                        R$ {(product.costPrice / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(product.salePrice / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{product.minStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedProducts.length > 10 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  ... e mais {parsedProducts.length - 10} produtos
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
