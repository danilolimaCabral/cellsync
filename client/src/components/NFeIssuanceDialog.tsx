import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";

interface NFeIssuanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number | null;
}

export default function NFeIssuanceDialog({ open, onOpenChange, saleId }: NFeIssuanceDialogProps) {
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  
  const generateMutation = trpc.fiscal.debugGenerateXML.useMutation({
    onSuccess: (data) => {
      setXmlContent(data.xml);
      toast.success("XML gerado e assinado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar XML: ${error.message}`);
    }
  });

  const handleGenerate = () => {
    if (!saleId) return;
    generateMutation.mutate({ saleId });
  };

  const handleDownload = () => {
    if (!xmlContent || !saleId) return;
    
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NFe_Venda_${saleId}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Emissão de Nota Fiscal Eletrônica (NF-e)
          </DialogTitle>
          <DialogDescription>
            Geração e assinatura do XML da nota fiscal para a venda #{saleId}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-1">
          {!xmlContent ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 border-2 border-dashed rounded-lg bg-slate-50">
              <div className="p-4 bg-blue-100 rounded-full">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center max-w-md px-4">
                <h3 className="font-medium text-slate-900">Pronto para emitir</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Clique no botão abaixo para gerar o XML da NF-e, assinar digitalmente e preparar para envio.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">XML Gerado e Assinado!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    O arquivo XML foi gerado com sucesso e assinado digitalmente.
                    Este é o arquivo que será enviado para a SEFAZ.
                  </p>
                </div>
              </div>
              
              <div className="flex-1 border rounded-md overflow-hidden bg-slate-900 text-slate-50">
                <div className="bg-slate-800 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center">
                  <span>XML Preview</span>
                  <span>UTF-8</span>
                </div>
                <ScrollArea className="h-[300px] w-full p-4 font-mono text-xs whitespace-pre">
                  {xmlContent}
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          
          {!xmlContent ? (
            <Button 
              onClick={handleGenerate} 
              disabled={generateMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generateMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando XML...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar e Assinar XML
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleDownload} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Baixar XML
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
