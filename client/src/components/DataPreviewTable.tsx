import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transformation?: string;
}

interface DataPreviewTableProps {
  data: Record<string, any>[];
  mapping: ColumnMapping[];
  maxRows?: number;
}

export function DataPreviewTable({
  data,
  mapping,
  maxRows = 10
}: DataPreviewTableProps) {
  const previewData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {confidence}%
        </Badge>
      );
    } else if (confidence >= 70) {
      return (
        <Badge variant="secondary" className="gap-1">
          {confidence}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {confidence}%
        </Badge>
      );
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      name: "Nome",
      description: "Descrição",
      sku: "SKU",
      category: "Categoria",
      brand: "Marca",
      model: "Modelo",
      retailPrice: "Preço Varejo",
      wholesalePrice: "Preço Atacado",
      costPrice: "Preço Custo",
      currentStock: "Estoque Atual",
      supplier: "Fornecedor",
      barcode: "Código de Barras",
      email: "Email",
      phone: "Telefone",
      cpf: "CPF",
      cnpj: "CNPJ",
      address: "Endereço",
      city: "Cidade",
      state: "Estado",
      zipCode: "CEP",
    };
    return labels[fieldName] || fieldName;
  };

  return (
    <div className="space-y-4">
      {/* Mapeamento de Colunas */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Mapeamento de Colunas</h3>
        <div className="space-y-2">
          {mapping.map((map, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            >
              <span className="text-sm font-medium flex-1 truncate">
                {map.sourceColumn}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm flex-1 truncate">
                {getFieldLabel(map.targetField)}
              </span>
              {getConfidenceBadge(map.confidence)}
              {map.transformation && (
                <Badge variant="outline" className="text-xs">
                  {map.transformation}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Preview dos Dados */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold">
            Preview dos Dados
            <span className="text-sm text-muted-foreground ml-2">
              (mostrando {previewData.length} de {data.length} linhas)
            </span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                {mapping.map((map, idx) => (
                  <TableHead key={idx} className="min-w-[150px]">
                    {getFieldLabel(map.targetField)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  <TableCell className="font-medium text-muted-foreground">
                    {rowIdx + 1}
                  </TableCell>
                  {mapping.map((map, colIdx) => (
                    <TableCell key={colIdx}>
                      {row[map.sourceColumn] || (
                        <span className="text-muted-foreground italic">vazio</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {hasMore && (
          <div className="p-4 border-t text-center text-sm text-muted-foreground">
            + {data.length - maxRows} linhas adicionais serão importadas
          </div>
        )}
      </Card>
    </div>
  );
}
