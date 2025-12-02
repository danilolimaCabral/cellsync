import { useState } from "react";
import { FileUploadZone } from "../components/FileUploadZone";
import { ImportChatBox } from "../components/ImportChatBox";
import { DataPreviewTable } from "../components/DataPreviewTable";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sparkles,
  Upload,
  MessageSquare,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

type Step = "upload" | "analyzing" | "preview" | "importing" | "completed";

type ModuleType = "products" | "customers" | "sales" | "stock" | "service_orders" | "accounts_payable" | "accounts_receivable";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transformation?: string;
}

export default function AssistenteImportacao() {
  // Toast já importado do sonner
  const [step, setStep] = useState<Step>("upload");
  const [moduleType, setModuleType] = useState<ModuleType>("products");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // tRPC mutations
  const analyzeMutation = trpc.aiAssistant.analyzeFile.useMutation();
  const chatMutation = trpc.aiAssistant.chat.useMutation();
  const importMutation = trpc.aiAssistant.executeImport.useMutation();
  
  // tRPC queries
  const { data: limitStatus } = trpc.aiAssistant.checkLimits.useQuery();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setStep("analyzing");

    try {
      // Ler arquivo como base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;

        // Analisar com IA
        const result = await analyzeMutation.mutateAsync({
          fileContent: content,
          fileName: file.name,
          moduleType,
        });

        if (result.success) {
          setParsedData(result.analysis.sampleData);
          setMapping(result.analysis.suggestedMapping);
          setStep("preview");

          // Adicionar mensagem da IA
          setMessages([
            {
              role: "assistant",
              content: `✅ Arquivo analisado com sucesso!\n\nEncontrei ${result.analysis.totalRows} linhas e ${result.analysis.columns.length} colunas.\n\nMapeei automaticamente as colunas para os campos do sistema. Você pode revisar o mapeamento abaixo ou me pedir ajustes!`,
              timestamp: new Date(),
            },
          ]);

          if (result.analysis.warnings.length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `⚠️ Avisos:\n${result.analysis.warnings.join("\n")}`,
                timestamp: new Date(),
              },
            ]);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Erro ao analisar arquivo",
        description: error.message,
        variant: "destructive",
      });
      setStep("upload");
    }
  };

  const handleSendMessage = async (message: string) => {
    // Adicionar mensagem do usuário
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message, timestamp: new Date() },
    ]);

    try {
      const result = await chatMutation.mutateAsync({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        currentData: parsedData,
        currentMapping: mapping,
      });

      // Adicionar resposta da IA
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.message, timestamp: new Date() },
      ]);
    } catch (error: any) {
      toast({
        title: "Erro no chat",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmImport = async () => {
    setStep("importing");

    try {
      const result = await importMutation.mutateAsync({
        moduleType,
        data: parsedData,
        mapping,
        saveMapping: true, // Salvar mapeamento na memória da IA
      });

      if (result.success) {
        setStep("completed");
        toast({
          title: "Importação concluída!",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setParsedData([]);
    setMapping([]);
    setMessages([]);
  };

  const getModuleLabel = (type: ModuleType): string => {
    const labels: Record<ModuleType, string> = {
      products: "Produtos",
      customers: "Clientes",
      sales: "Vendas",
      stock: "Estoque",
      service_orders: "Ordens de Serviço",
      accounts_payable: "Contas a Pagar",
      accounts_receivable: "Contas a Receber",
    };
    return labels[type];
  };

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Assistente de Importação IA</h1>
        </div>
        <p className="text-muted-foreground">
          Importe seus dados de forma inteligente. A IA analisa, mapeia e ajusta automaticamente.
        </p>
      </div>

      {/* Indicador de Limites */}
      {limitStatus && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Uso Mensal</p>
                <p className="text-sm text-muted-foreground">
                  {limitStatus.isInTrial ? (
                    <Badge variant="default">Trial - Ilimitado</Badge>
                  ) : limitStatus.importsLimit === -1 ? (
                    <Badge variant="default">Ilimitado</Badge>
                  ) : (
                    `${limitStatus.importsUsed} / ${limitStatus.importsLimit} importações`
                  )}
                </p>
              </div>
            </div>
            {limitStatus.message && (
              <p className="text-sm text-muted-foreground max-w-md">
                {limitStatus.message}
              </p>
            )}
          </div>
          {!limitStatus.isInTrial && limitStatus.importsLimit !== -1 && (
            <Progress
              value={(limitStatus.importsUsed / limitStatus.importsLimit) * 100}
              className="mt-3"
            />
          )}
        </Card>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[
          { id: "upload", icon: Upload, label: "Upload" },
          { id: "analyzing", icon: Sparkles, label: "Análise" },
          { id: "preview", icon: Eye, label: "Preview" },
          { id: "importing", icon: CheckCircle, label: "Importar" },
        ].map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isPast =
            ["upload", "analyzing", "preview", "importing", "completed"].indexOf(step) >
            ["upload", "analyzing", "preview", "importing", "completed"].indexOf(s.id);

          return (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              {idx < 3 && (
                <div className="w-8 h-px bg-border mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Upload e Seletor */}
        <div className="lg:col-span-1 space-y-6">
          {step === "upload" && (
            <>
              <Card className="p-4">
                <label className="block text-sm font-medium mb-2">
                  Tipo de Dados
                </label>
                <Select
                  value={moduleType}
                  onValueChange={(value) => setModuleType(value as ModuleType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products">Produtos</SelectItem>
                    <SelectItem value="customers">Clientes</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="stock">Estoque</SelectItem>
                    <SelectItem value="service_orders">Ordens de Serviço</SelectItem>
                    <SelectItem value="accounts_payable">Contas a Pagar</SelectItem>
                    <SelectItem value="accounts_receivable">Contas a Receber</SelectItem>
                  </SelectContent>
                </Select>
              </Card>

              <FileUploadZone onFileSelect={handleFileSelect} />
            </>
          )}

          {step === "analyzing" && (
            <Card className="p-8 text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="font-semibold mb-2">Analisando arquivo...</h3>
              <p className="text-sm text-muted-foreground">
                A IA está identificando colunas e mapeando campos
              </p>
            </Card>
          )}

          {(step === "preview" || step === "importing" || step === "completed") && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Informações</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arquivo:</span>
                  <span className="font-medium">{selectedFile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{getModuleLabel(moduleType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linhas:</span>
                  <span className="font-medium">{parsedData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Colunas:</span>
                  <span className="font-medium">{mapping.length}</span>
                </div>
              </div>

              {step === "completed" ? (
                <Button onClick={handleReset} className="w-full mt-4">
                  Nova Importação
                </Button>
              ) : step === "preview" ? (
                <Button
                  onClick={handleConfirmImport}
                  className="w-full mt-4"
                  disabled={importMutation.isPending}
                >
                  Confirmar Importação
                </Button>
              ) : null}
            </Card>
          )}

          {step === "completed" && (
            <Card className="p-6 text-center bg-primary/5">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">
                Importação Concluída!
              </h3>
              <p className="text-sm text-muted-foreground">
                Seus dados foram importados com sucesso
              </p>
            </Card>
          )}
        </div>

        {/* Coluna Direita - Preview e Chat */}
        <div className="lg:col-span-2 space-y-6">
          {(step === "preview" || step === "importing" || step === "completed") && (
            <DataPreviewTable data={parsedData} mapping={mapping} />
          )}

          {(step === "preview" || step === "importing" || step === "completed") && (
            <ImportChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
