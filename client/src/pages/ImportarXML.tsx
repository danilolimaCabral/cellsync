import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { FileInput, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ImportarXML() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Importar XML (NF-e)"
        description="Importe notas fiscais eletrônicas em formato XML"
      />

      <Card>
        <CardContent className="p-12 text-center">
          <FileInput className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
          <p className="text-slate-600 mb-6">
            Em breve você poderá importar XMLs de NF-e diretamente para o sistema.
          </p>
          <Button
            variant="outline"
            onClick={() => toast.info("Esta funcionalidade estará disponível em breve")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Selecionar Arquivo XML
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
