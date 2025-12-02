import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ImportarPlanilha() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Importar Planilha (CSV)"
        description="Importe dados em massa através de arquivos CSV ou Excel"
      />

      <Card>
        <CardContent className="p-12 text-center">
          <Table className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
          <p className="text-slate-600 mb-6">
            Em breve você poderá importar planilhas CSV/Excel diretamente para o sistema.
          </p>
          <Button
            variant="outline"
            onClick={() => toast.info("Esta funcionalidade estará disponível em breve")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Selecionar Planilha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
