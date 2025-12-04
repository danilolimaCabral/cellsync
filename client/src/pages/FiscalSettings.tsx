import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, ShieldCheck, AlertTriangle, FileKey } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fiscalSchema = z.object({
  environment: z.enum(["homologacao", "producao"]),
  cscToken: z.string().optional(),
  cscId: z.string().optional(),
  nextNfeNumber: z.coerce.number().min(1),
  series: z.coerce.number().min(1),
  simpleNational: z.boolean(),
  defaultNcm: z.string().optional(),
});

export default function FiscalSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [certPassword, setCertPassword] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  const utils = trpc.useContext();
  const { data: settings, isLoading } = trpc.fiscal.getSettings.useQuery();

  const form = useForm<z.infer<typeof fiscalSchema>>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      environment: "homologacao",
      nextNfeNumber: 1,
      series: 1,
      simpleNational: true,
    },
    values: settings ? {
      environment: settings.environment as "homologacao" | "producao",
      cscToken: settings.cscToken || "",
      cscId: settings.cscId || "",
      nextNfeNumber: settings.nextNfeNumber,
      series: settings.series,
      simpleNational: settings.simpleNational,
      defaultNcm: settings.defaultNcm || "",
    } : undefined
  });

  const saveMutation = trpc.fiscal.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações fiscais salvas com sucesso!");
      utils.fiscal.getSettings.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });

  const uploadMutation = trpc.fiscal.uploadCertificate.useMutation({
    onSuccess: () => {
      toast.success("Certificado digital importado com sucesso!");
      setCertFile(null);
      setCertPassword("");
      utils.fiscal.getSettings.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao importar certificado: ${error.message}`);
    }
  });

  const onSubmit = (data: z.infer<typeof fiscalSchema>) => {
    saveMutation.mutate(data);
  };

  const handleUpload = async () => {
    if (!certFile || !certPassword) {
      toast.error("Selecione o arquivo e informe a senha");
      return;
    }

    setUploading(true);
    try {
      // Simulação de upload para S3
      // Em produção: usar presigned URL ou FormData
      const fakeUrl = `https://s3.amazonaws.com/bucket/${certFile.name}`;
      
      await uploadMutation.mutateAsync({
        fileName: certFile.name,
        fileUrl: fakeUrl,
        password: certPassword
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações Fiscais</h1>
          <p className="text-muted-foreground">
            Gerencie dados de emissão de NF-e e certificado digital.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="certificate">Certificado Digital</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros de Emissão</CardTitle>
              <CardDescription>
                Configure o ambiente e numeração das notas fiscais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="environment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ambiente de Emissão</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o ambiente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                              <SelectItem value="producao">Produção (Validade Jurídica)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Use Homologação para testes sem valor fiscal.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="simpleNational"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Simples Nacional</FormLabel>
                            <FormDescription>
                              Empresa optante pelo Simples Nacional?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nextNfeNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Próximo Número de NF-e</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="series"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Série</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cscId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID do CSC (Token)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 000001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cscToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código CSC</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Token de segurança" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saveMutation.isLoading}>
                      {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Configurações
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate">
          <div className="grid gap-6">
            {/* Status do Certificado */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Certificado</CardTitle>
                <CardDescription>
                  Informações sobre o certificado digital A1 atual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings?.hasCertificate ? (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                      <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-300">Certificado Ativo</h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Emitido por: {settings.certificateIssuer || "N/A"}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Válido até: {settings.certificateExpiration ? format(new Date(settings.certificateExpiration), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">Nenhum certificado configurado</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Você precisa enviar um certificado A1 (.pfx) para emitir notas fiscais.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload de Novo Certificado */}
            <Card>
              <CardHeader>
                <CardTitle>Atualizar Certificado</CardTitle>
                <CardDescription>
                  Envie um novo arquivo .pfx (Modelo A1) para substituir o atual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <FormLabel htmlFor="cert-file">Arquivo do Certificado (.pfx)</FormLabel>
                  <Input 
                    id="cert-file" 
                    type="file" 
                    accept=".pfx,.p12"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <FormLabel htmlFor="cert-pass">Senha do Certificado</FormLabel>
                  <Input 
                    id="cert-pass" 
                    type="password" 
                    value={certPassword}
                    onChange={(e) => setCertPassword(e.target.value)}
                    placeholder="Digite a senha do arquivo"
                  />
                </div>

                <Button 
                  onClick={handleUpload} 
                  disabled={!certFile || !certPassword || uploading || uploadMutation.isLoading}
                >
                  {(uploading || uploadMutation.isLoading) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Certificado
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
