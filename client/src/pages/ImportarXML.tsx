import { useState, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  FileCode,
  Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface ProcessedInvoice {
  accessKey: string;
  number: string;
  series: string;
  emitterName: string;
  emitterCnpj: string;
  totalValue: number;
  issueDate: string;
  status: "success" | "error";
  message?: string;
}

export default function ImportarXML() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedInvoices, setProcessedInvoices] = useState<ProcessedInvoice[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation para processar XML
  const importXmlMutation = trpc.nfe.importXml.useMutation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "text/xml" || file.name.endsWith(".xml")
    );
    
    if (droppedFiles.length === 0) {
      toast.error("Por favor, selecione apenas arquivos XML.");
      return;
    }

    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type === "text/xml" || file.name.endsWith(".xml")
      );
      
      if (selectedFiles.length === 0) {
        toast.error("Por favor, selecione apenas arquivos XML.");
        return;
      }

      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessedInvoices([]);

    const totalFiles = files.length;
    const results: ProcessedInvoice[] = [];

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const reader = new FileReader();

      try {
        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });

        // Enviar para o backend
        const result = await importXmlMutation.mutateAsync({ xmlContent: content });
        
        results.push({
          accessKey: result.accessKey,
          number: result.number,
          series: result.series,
          emitterName: result.emitterName,
          emitterCnpj: result.emitterCnpj,
          totalValue: result.totalValue,
          issueDate: result.issueDate,
          status: "success"
        });

      } catch (error: any) {
        results.push({
          accessKey: "",
          number: "-",
          series: "-",
          emitterName: "-",
          emitterCnpj: "-",
          totalValue: 0,
          issueDate: "-",
          status: "error",
          message: error.message || "Erro ao processar arquivo"
        });
      }

      setProgress(((i + 1) / totalFiles) * 100);
    }

    setProcessedInvoices(results);
    setIsProcessing(false);
    setFiles([]); // Limpar lista após processamento
    
    const successCount = results.filter(r => r.status === "success").length;
    if (successCount > 0) {
      toast.success(`${successCount} notas importadas com sucesso!`);
    }
    if (results.length > successCount) {
      toast.warning(`${results.length - successCount} arquivos falharam.`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <PageHeader
        title="Importar XML (NF-e)"
        description="Importe notas fiscais eletrônicas arrastando os arquivos XML"
        backTo="/notas-fiscais"
      />

      <div className="grid gap-8 md:grid-cols-3">
        {/* Área de Upload */}
        <div className="md:col-span-2 space-y-6">
          <Card 
            className={`border-2 border-dashed transition-all duration-300 ${
              isDragging 
                ? "border-blue-500 bg-blue-50 scale-[1.02]" 
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".xml,text/xml"
                onChange={handleFileSelect}
              />
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
              }`}>
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isDragging ? "Solte os arquivos aqui" : "Arraste e solte seus arquivos XML"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Ou clique para selecionar arquivos do seu computador. Suporta múltiplos arquivos simultaneamente.
              </p>
              <Button variant="outline" className="pointer-events-none">
                Selecionar Arquivos
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Arquivos Selecionados */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Arquivos Selecionados ({files.length})
                  </h3>
                  <Button 
                    onClick={processFiles} 
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Importar {files.length} Notas
                      </>
                    )}
                  </Button>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="bg-white rounded-lg border divide-y max-h-[300px] overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 truncate max-w-[200px] md:max-w-[300px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      {!isProcessing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resultados do Processamento */}
          <AnimatePresence>
            {processedInvoices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Resultado da Importação
                </h3>
                
                <Card>
                  <CardContent className="p-0 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Número</TableHead>
                          <TableHead>Emitente</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Mensagem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedInvoices.map((invoice, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {invoice.status === "success" ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                  Sucesso
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                                  Erro
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {invoice.number !== "-" ? `#${invoice.number}` : "-"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {invoice.emitterName}
                            </TableCell>
                            <TableCell>
                              {invoice.totalValue > 0 ? formatCurrency(invoice.totalValue) : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {invoice.status === "success" ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Importada
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> {invoice.message}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button onClick={() => window.location.href = "/notas-fiscais"}>
                    Ver Notas Importadas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar de Informações */}
        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Como funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-3">
              <p>
                1. Selecione ou arraste os arquivos XML das notas fiscais que você recebeu ou emitiu.
              </p>
              <p>
                2. O sistema irá ler automaticamente os dados do emitente, destinatário, produtos e impostos.
              </p>
              <p>
                3. As notas serão salvas no sistema e estarão disponíveis na listagem geral.
              </p>
              <p className="font-medium pt-2 border-t border-blue-200">
                Formatos suportados: XML de NF-e (modelo 55) e NFC-e (modelo 65).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dicas de Importação</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <ul className="list-disc pl-4 space-y-2">
                <li>Verifique se o XML é válido e possui assinatura digital.</li>
                <li>Notas canceladas também podem ser importadas para histórico.</li>
                <li>Produtos novos serão cadastrados automaticamente se não existirem.</li>
                <li>Evite importar arquivos duplicados (o sistema irá alertar).</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
