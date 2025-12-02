import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Database, Download, Play, Clock, HardDrive, Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function GerenciarBackups() {
  const [isRunning, setIsRunning] = useState(false);

  // Query para listar backups
  const { data: backups, isLoading, refetch } = trpc.backup.list.useQuery();

  // Mutation para executar backup manual
  const runBackup = trpc.backup.runNow.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Backup executado com sucesso!", {
          description: `Arquivo: ${result.backupResult?.filename}`,
        });
        refetch();
      } else {
        toast.error("Falha ao executar backup", {
          description: result.error || "Erro desconhecido",
        });
      }
      setIsRunning(false);
    },
    onError: (error) => {
      toast.error("Erro ao executar backup", {
        description: error.message,
      });
      setIsRunning(false);
    },
  });

  const handleRunBackup = () => {
    setIsRunning(true);
    toast.info("Executando backup...", {
      description: "Isso pode levar alguns minutos",
    });
    runBackup.mutate();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gerenciar Backups
            </h1>
            <p className="text-muted-foreground mt-1">
              Backups automáticos diários às 3h AM com retenção de 30 dias
            </p>
          </div>
          <Button
            onClick={handleRunBackup}
            disabled={isRunning}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Executar Backup Agora
              </>
            )}
          </Button>
        </motion.div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
                <Database className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {backups?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Armazenados no S3
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agendamento</CardTitle>
                <Clock className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  3h AM
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diariamente (horário de Brasília)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retenção</CardTitle>
                <Calendar className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  30 dias
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Limpeza automática
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lista de Backups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Backups Disponíveis
            </CardTitle>
            <CardDescription>
              Histórico de backups armazenados no S3
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : backups && backups.length > 0 ? (
              <div className="space-y-3">
                {backups.map((backup, index) => (
                  <motion.div
                    key={backup.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{backup.filename}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(backup.uploadedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(backup.size)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {backup.ageInDays} {backup.ageInDays === 1 ? "dia" : "dias"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {backup.ageInDays <= 30 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-orange-600" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum backup encontrado
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Execute o primeiro backup clicando no botão acima
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader>
            <CardTitle className="text-lg">ℹ️ Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Agendamento Automático:</strong> O sistema executa backups automaticamente todos os dias às 3h AM (horário de Brasília).
            </p>
            <p>
              <strong>Retenção:</strong> Backups com mais de 30 dias são removidos automaticamente para economizar espaço.
            </p>
            <p>
              <strong>Notificações:</strong> Você receberá um email após cada backup (sucesso ou falha) com detalhes da operação.
            </p>
            <p>
              <strong>Armazenamento:</strong> Todos os backups são armazenados de forma segura no S3 com criptografia.
            </p>
            <p>
              <strong>Restauração:</strong> Para restaurar um backup, entre em contato com o suporte técnico.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
