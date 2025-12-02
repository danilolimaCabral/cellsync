import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  MessageCircle,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
} from "lucide-react";

export default function ChatbotAnalytics() {
  const { user } = useAuth();
  
  // Buscar métricas
  const { data: metrics, isLoading: metricsLoading } = trpc.chatAnalytics.getMetrics.useQuery({});
  const { data: frequentQuestions, isLoading: questionsLoading } = trpc.chatAnalytics.getFrequentQuestions.useQuery({ limit: 10 });
  const { data: conversationsByDate, isLoading: conversationsLoading } = trpc.chatAnalytics.getConversationsByDate.useQuery({ days: 30 });
  const { data: conversionsByType, isLoading: conversionsLoading } = trpc.chatAnalytics.getConversionsByType.useQuery();

  if (metricsLoading || questionsLoading || conversationsLoading || conversionsLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Conversas",
      value: metrics?.totalConversations || 0,
      icon: MessageCircle,
      gradient: "from-blue-500 to-cyan-500",
      description: "Conversas iniciadas",
    },
    {
      title: "Taxa de Conversão",
      value: `${(metrics?.conversionRate || 0).toFixed(1)}%`,
      icon: Target,
      gradient: "from-green-500 to-emerald-500",
      description: `${metrics?.conversions || 0} conversões`,
    },
    {
      title: "Tempo Médio de Resposta",
      value: `${((metrics?.avgResponseTime || 0) / 1000).toFixed(1)}s`,
      icon: Clock,
      gradient: "from-purple-500 to-pink-500",
      description: "Tempo de resposta do AI",
    },
    {
      title: "Mensagens por Conversa",
      value: metrics?.avgMessagesPerConversation || 0,
      icon: BarChart3,
      gradient: "from-orange-500 to-red-500",
      description: "Média de engajamento",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Analytics do Chatbot"
        description="Métricas de desempenho e engajamento do assistente virtual"
      />

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5`}></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient}`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {card.value}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Perguntas Mais Frequentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Perguntas Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {frequentQuestions && frequentQuestions.length > 0 ? (
                frequentQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                        {question.content}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {question.count} {question.count === 1 ? "pergunta" : "perguntas"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  Nenhuma pergunta registrada ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversões por Tipo */}
      {conversionsByType && conversionsByType.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Conversões por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionsByType.map((conversion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                        {conversion.type || "Não especificado"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {conversion.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Conversas por Data (últimos 30 dias) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Atividade dos Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversationsByDate && conversationsByDate.length > 0 ? (
              <div className="space-y-2">
                {conversationsByDate.slice(-7).map((day, index) => {
                  const maxConversations = Math.max(...conversationsByDate.map(d => d.count));
                  const percentage = (day.count / maxConversations) * 100;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {new Date(day.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {day.count} conversas ({day.conversions} conversões)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Nenhuma conversa registrada nos últimos 30 dias
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
