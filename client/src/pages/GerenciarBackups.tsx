import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Database, Download, Play, Clock, HardDrive, Calendar, CheckCircle2, XCircle, Loader2, TrendingUp, BarChart3, Activity } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function GerenciarBackups() {
  const [isRunning, setIsRunning] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<7 | 30 | 90>(30);

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

  // Processar dados para gráficos
  const chartData = useMemo(() => {
    if (!backups) return { timeline: [], frequency: [], statistics: null };

    // Filtrar por período
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodFilter);
    const filteredBackups = backups.filter(
      (b) => new Date(b.createdAt) >= cutoffDate
    );

    // Dados para gráfico de linha (tamanho ao longo do tempo)
    const timeline = filteredBackups
      .map((backup) => {
        const ageInDays = Math.floor((Date.now() - new Date(backup.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return {
          date: new Date(backup.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          tamanho: (backup.fileSize / 1024 / 1024).toFixed(2),
          tamanhoNum: backup.fileSize / 1024 / 1024,
          idade: ageInDays,
        };
      })
      .reverse();

    // Dados para gráfico de barras (frequência por dia)
    const frequencyMap = new Map<string, number>();
    filteredBackups.forEach((backup) => {
      const date = new Date(backup.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      frequencyMap.set(date, (frequencyMap.get(date) || 0) + 1);
    });

    const frequency = Array.from(frequencyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse();

    // Estatísticas gerais
    const totalSize = filteredBackups.reduce((sum, b) => sum + b.fileSize, 0);
    const avgSize = filteredBackups.length > 0 ? totalSize / filteredBackups.length : 0;
    const maxSize = Math.max(...filteredBackups.map((b) => b.fileSize), 0);
    const minSize = Math.min(...filteredBackups.map((b) => b.fileSize), 0);

    // Calcular taxa de crescimento (comparando primeiro e último backup)
    let growthRate = 0;
    if (timeline.length >= 2) {
      const firstSize = timeline[0].tamanhoNum;
      const lastSize = timeline[timeline.length - 1].tamanhoNum;
      growthRate = ((lastSize - firstSize) / firstSize) * 100;
    }

    const statistics = {
      total: filteredBackups.length,
      totalSize: totalSize / 1024 / 1024, // MB
      avgSize: avgSize / 1024 / 1024, // MB
      maxSize: maxSize / 1024 / 1024, // MB
      minSize: minSize / 1024 / 1024, // MB
      growthRate,
    };

    return { timeline, frequency, statistics };
  }, [backups, periodFilter]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  {chartData.statistics?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimos {periodFilter} dias
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
                <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
                <HardDrive className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {chartData.statistics?.totalSize.toFixed(2) || 0} MB
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
            transition={{ delay: 0.3 }}
          >
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamanho Médio</CardTitle>
                <Activity className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {chartData.statistics?.avgSize.toFixed(2) || 0} MB
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Por backup
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {chartData.statistics?.growthRate.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tendência de crescimento
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filtro de Período */}
        <div className="flex justify-end gap-2">
          <Button
            variant={periodFilter === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodFilter(7)}
          >
            7 dias
          </Button>
          <Button
            variant={periodFilter === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodFilter(30)}
          >
            30 dias
          </Button>
          <Button
            variant={periodFilter === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodFilter(90)}
          >
            90 dias
          </Button>
        </div>

        {/* Tabs com Gráficos e Lista */}
        <Tabs defaultValue="graficos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="graficos">
              <BarChart3 className="mr-2 h-4 w-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="lista">
              <Database className="mr-2 h-4 w-4" />
              Lista de Backups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="graficos" className="space-y-6">
            {/* Gráfico de Linha - Tamanho ao Longo do Tempo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tamanho dos Backups ao Longo do Tempo
                </CardTitle>
                <CardDescription>
                  Evolução do tamanho dos backups nos últimos {periodFilter} dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : chartData.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: "Tamanho (MB)", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        formatter={(value: any) => [`${value} MB`, "Tamanho"]}
                        labelStyle={{ color: "#000" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="tamanho"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6", r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Tamanho (MB)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum dado disponível para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Frequência por Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Frequência de Backups por Dia
                </CardTitle>
                <CardDescription>
                  Quantidade de backups realizados por dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : chartData.frequency.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.frequency}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: "Quantidade", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        formatter={(value: any) => [`${value}`, "Backups"]}
                        labelStyle={{ color: "#000" }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Backups" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum dado disponível para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Área - Crescimento Acumulado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Crescimento Acumulado
                </CardTitle>
                <CardDescription>
                  Volume total acumulado de backups ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : chartData.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={chartData.timeline.map((item, index, arr) => ({
                        ...item,
                        acumulado: arr
                          .slice(0, index + 1)
                          .reduce((sum, b) => sum + parseFloat(b.tamanho), 0)
                          .toFixed(2),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: "Total Acumulado (MB)", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        formatter={(value: any) => [`${value} MB`, "Acumulado"]}
                        labelStyle={{ color: "#000" }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="acumulado"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        name="Total Acumulado (MB)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum dado disponível para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lista">
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
                        key={backup.id}
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
                                {formatDate(backup.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatFileSize(backup.fileSize)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor((Date.now() - new Date(backup.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dias
                              </span>
                            </div>
                          </div>
                        </div>
                        {Math.floor((Date.now() - new Date(backup.createdAt).getTime()) / (1000 * 60 * 60 * 24)) <= 30 ? (
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
          </TabsContent>
        </Tabs>

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
              <strong>Monitoramento:</strong> Use os gráficos acima para acompanhar tendências de crescimento e identificar anomalias.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
