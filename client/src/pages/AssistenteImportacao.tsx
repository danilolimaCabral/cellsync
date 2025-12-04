import { useState } from "react";
import { useLocation } from "wouter";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2, 
  ArrowRight, 
  Bot, 
  Sparkles,
  Database,
  Users,
  ShoppingCart,
  Package,
  Wrench,
  CreditCard,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de importação suportados
const IMPORT_TYPES = [
  { id: "products", label: "Produtos", icon: Package, description: "Importar catálogo de produtos" },
  { id: "customers", label: "Clientes", icon: Users, description: "Importar base de clientes" },
  { id: "sales", label: "Vendas", icon: ShoppingCart, description: "Importar histórico de vendas" },
  { id: "stock", label: "Estoque", icon: Database, description: "Importar níveis de estoque" },
  { id: "service_orders", label: "Ordens de Serviço", icon: Wrench, description: "Importar OSs antigas" },
  { id: "accounts_payable", label: "Contas a Pagar", icon: CreditCard, description: "Importar despesas" },
  { id: "accounts_receivable", label: "Contas a Receber", icon: Banknote, description: "Importar receitas" },
];

export default function AssistenteImportacao() {
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>("products");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mutations
  const analyzeMutation = trpc.aiAssistant.analyzeImportFile.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      setIsAnalyzing(false);
      setStep(3);
      toast.success("Análise concluída com sucesso!");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Erro na análise: ${error.message}`);
    }
  });

  const processMutation = trpc.aiAssistant.processImport.useMutation({
    onSuccess: (data) => {
      setIsImporting(false);
      setStep(4);
      toast.success("Importação realizada com sucesso!");
    },
    onError: (error) => {
      setIsImporting(false);
      toast.error(`Erro na importação: ${error.message}`);
    }
  });

  // Dropzone configuration
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    multiple: false
  });

  // Handlers
  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setStep(2);

    // Simular progresso
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    // Converter arquivo para base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const content = base64.split(',')[1]; // Remover prefixo data:application/...

      try {
        await analyzeMutation.mutateAsync({
          fileContent: content,
          fileName: file.name,
          fileType: file.type,
          importType
        });
        clearInterval(interval);
        setProgress(100);
      } catch (error) {
        clearInterval(interval);
        setProgress(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImport = async () => {
    if (!analysisResult) return;

    setIsImporting(true);
    
    try {
      await processMutation.mutateAsync({
        importId: analysisResult.importId,
        mappings: analysisResult.mappings
      });
    } catch (error) {
      // Erro já tratado no onError da mutation
    }
  };

  const resetImport = () => {
    setStep(1);
    setFile(null);
    setAnalysisResult(null);
    setProgress(0);
  };

  // Render helpers
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === s ? "bg-primary text-primary-foreground" : 
              step > s ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
            )}
          >
            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
          {s < 4 && (
            <div 
              className={cn(
                "w-12 h-1 mx-2 rounded-full transition-colors",
                step > s ? "bg-green-500" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Assistente de Importação IA</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Importe seus dados de planilhas Excel ou CSV de forma inteligente. 
            Nossa IA analisa, mapeia e ajusta automaticamente.
          </p>
        </div>

        {/* Usage Stats Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Uso Mensal</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                  Trial - Ilimitado
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Você está no período trial (14 dias restantes). Importações ilimitadas!
                </span>
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-primary opacity-50 hidden md:block" />
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid gap-8">
          {renderStepIndicator()}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração</CardTitle>
                  <CardDescription>Selecione o tipo de dado que deseja importar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Dados</label>
                      <Select value={importType} onValueChange={setImportType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {IMPORT_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {IMPORT_TYPES.find(t => t.id === importType)?.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivo</CardTitle>
                  <CardDescription>Arraste seu arquivo ou clique para selecionar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center gap-4",
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                      file ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30" : ""
                    )}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                          Trocar Arquivo
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Arraste seu arquivo aqui</p>
                          <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                        </div>
                        <Button variant="secondary" size="sm">
                          Selecionar Arquivo
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: .csv, .xlsx, .xls • Máximo: 10MB
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-2 flex justify-end">
                <Button 
                  size="lg" 
                  onClick={handleAnalyze} 
                  disabled={!file}
                  className="w-full md:w-auto"
                >
                  Iniciar Análise IA
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Analysis */}
          {step === 2 && (
            <Card className="max-w-2xl mx-auto w-full">
              <CardContent className="p-12 text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                  <div 
                    className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"
                  ></div>
                  <Bot className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Analisando seus dados...</h3>
                  <p className="text-muted-foreground">
                    Nossa IA está identificando colunas, tipos de dados e possíveis erros.
                  </p>
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{progress}%</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Preview & Confirm */}
          {step === 3 && analysisResult && (
            <div className="grid gap-6">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-300">Análise Concluída</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Identificamos {analysisResult.totalRows} registros. A IA mapeou {analysisResult.mappedColumns} colunas automaticamente com {analysisResult.confidence}% de confiança.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Mapeamento de Colunas</CardTitle>
                    <CardDescription>Verifique se a IA identificou corretamente seus dados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {analysisResult.mappings.map((mapping: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {mapping.sourceColumn.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{mapping.sourceColumn}</p>
                                <p className="text-xs text-muted-foreground">Coluna da Planilha</p>
                              </div>
                            </div>
                            
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <p className="font-medium text-sm text-primary">{mapping.targetField}</p>
                                <p className="text-xs text-muted-foreground">Campo do Sistema</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Registros</span>
                        <span className="font-medium">{analysisResult.totalRows}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Colunas Mapeadas</span>
                        <span className="font-medium">{analysisResult.mappedColumns}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Confiança IA</span>
                        <Badge variant={analysisResult.confidence > 80 ? "default" : "secondary"}>
                          {analysisResult.confidence}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-3">
                    <Button 
                      size="lg" 
                      className="w-full" 
                      onClick={handleImport}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          Confirmar Importação
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={resetImport} disabled={isImporting}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <Card className="max-w-md mx-auto text-center">
              <CardContent className="p-12 space-y-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">Sucesso!</h3>
                  <p className="text-muted-foreground">
                    Seus dados foram importados corretamente. Você já pode visualizá-los no sistema.
                  </p>
                </div>

                <div className="pt-4">
                  <Button onClick={resetImport} className="w-full">
                    Nova Importação
                  </Button>
                  <Button variant="link" className="mt-2" onClick={() => setLocation("/")}>
                    Voltar ao Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
