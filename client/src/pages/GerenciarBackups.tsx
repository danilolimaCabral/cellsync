import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Calendar,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function GerenciarBackups() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<string>("");

  // Queries
  const { data: tenants } = trpc.tenants.list.useQuery(undefined, {
    enabled: user?.role === "master_admin"
  });

  const { data: backups, isLoading, refetch } = trpc.backup.list.useQuery(
    { tenantId: selectedTenant && selectedTenant !== "0" ? Number(selectedTenant) : undefined },
    { enabled: !!user }
  );

  // Mutations
  const runBackupMutation = trpc.backup.runNow.useMutation({
    onSuccess: () => {
      toast.success("Backup iniciado com sucesso!", {
        description: "O processo pode levar alguns minutos.",
      });
      setIsRunning(false);
      refetch();
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
    runBackupMutation.mutate({ 
      tenantId: selectedTenant && selectedTenant !== "0" ? Number(selectedTenant) : undefined 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  if (user?.role !== "master_admin") {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-slate-600">
              Apenas administradores master podem acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Gerenciar Backups"
          description="Backups automáticos do banco de dados"
        />
        
        <div className="flex items-center gap-4">
          {user?.role === "master_admin" && (
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por empresa..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todas as empresas</SelectItem>
                {tenants?.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={String(tenant.id)}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleRunBackup}
            disabled={isRunning}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Backup Agora
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total de Backups
              </CardTitle>
              <Database className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {backups?.length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Backups armazenados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Último Backup
              </CardTitle>
              <Calendar className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900">
                {backups && backups.length > 0
                  ? formatDate(backups[0].createdAt)
                  : "Nenhum backup"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Data do último backup
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Espaço Total
              </CardTitle>
              <HardDrive className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {backups
                  ? formatFileSize(
                      backups.reduce((acc, b) => acc + (b.size || 0), 0)
                    )
                  : "0 MB"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Espaço utilizado
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Backups</CardTitle>
        </CardHeader>
        <CardContent>
          {!backups || backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                Nenhum backup encontrado. Execute o primeiro backup agora.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup, index) => (
                <motion.div
                  key={backup.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4 w-full md:w-auto">
                    {backup.status === "completed" ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {backup.filename}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(backup.createdAt)} •{" "}
                        {formatFileSize(backup.size || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-3 w-full md:w-auto">
                    <Badge
                      variant={backup.status === "completed" ? "default" : "destructive"}
                    >
                      {backup.status === "completed" ? "Sucesso" : "Erro"}
                    </Badge>
                    {(backup.s3Url || (backup as any).downloadUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(backup.s3Url || (backup as any).downloadUrl, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Backups Automáticos
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                O sistema executa backups automáticos diariamente às 3h AM (horário de Brasília).
                Os backups são armazenados no S3 e mantidos por 30 dias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
