import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  aberto: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  em_andamento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolvido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  fechado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const statusIcons = {
  aberto: AlertCircle,
  em_andamento: Clock,
  resolvido: CheckCircle2,
  fechado: XCircle,
};

const statusLabels = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

const priorityColors = {
  baixa: "bg-gray-100 text-gray-800",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  urgente: "bg-red-100 text-red-800",
};

const categoryLabels = {
  duvida: "Dúvida",
  problema_tecnico: "Problema Técnico",
  solicitacao_recurso: "Solicitação de Recurso",
  bug: "Bug",
};

export default function GerenciarChamados() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterPriority, setFilterPriority] = useState("todas");
  const [newMessage, setNewMessage] = useState("");

  // Queries
  const { data: stats } = trpc.supportTickets.getStats.useQuery();
  const { data: tickets, refetch } = trpc.supportTickets.listAll.useQuery({
    status: filterStatus === "todos" ? undefined : filterStatus || undefined,
    priority: filterPriority === "todas" ? undefined : filterPriority || undefined,
  });
  const { data: ticketMessages, refetch: refetchMessages } = trpc.supportTickets.getMessages.useQuery(
    { ticketId: selectedTicket?.id! },
    { enabled: !!selectedTicket }
  );

  // Mutations
  const updateStatusMutation = trpc.supportTickets.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
      if (selectedTicket) {
        // Atualizar ticket selecionado
        const updatedTicket = tickets?.find(t => t.id === selectedTicket.id);
        setSelectedTicket(updatedTicket);
      }
    },
  });

  const addMessageMutation = trpc.supportTickets.addMessage.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada!");
      setNewMessage("");
      refetchMessages();
      refetch();
    },
  });

  const handleUpdateStatus = (ticketId: number, status: string) => {
    updateStatusMutation.mutate({
      id: ticketId,
      status: status as any,
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;

    addMessageMutation.mutate({
      ticketId: selectedTicket.id,
      message: newMessage,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Gerenciar Chamados"
        description="Gerencie todos os tickets de suporte dos usuários"
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Abertos
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.abertos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats?.emAndamento || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Resolvidos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.resolvidos || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tickets */}
      <div className="grid grid-cols-1 gap-4">
        {tickets && tickets.length > 0 ? (
          tickets.map((ticket, index) => {
            const StatusIcon = statusIcons[ticket.status as keyof typeof statusIcons];
            
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <StatusIcon className="h-5 w-5" />
                          {ticket.subject}
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          #{ticket.id} • {categoryLabels[ticket.category as keyof typeof categoryLabels]} • 
                          Usuário ID: {ticket.userId}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                          {statusLabels[ticket.status as keyof typeof statusLabels]}
                        </Badge>
                        <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                      <span>Criado em {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <span>Atualizado {new Date(ticket.updatedAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Nenhum chamado encontrado
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Não há chamados com os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Detalhes do Ticket */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Chamado #{selectedTicket.id}</span>
                <div className="flex gap-2">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Informações do Ticket */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assunto:</span>
                    <span className="font-semibold">{selectedTicket.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Categoria:</span>
                    <span>{categoryLabels[selectedTicket.category as keyof typeof categoryLabels]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prioridade:</span>
                    <Badge className={priorityColors[selectedTicket.priority as keyof typeof priorityColors]}>
                      {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Descrição:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    {selectedTicket.description}
                  </p>
                </CardContent>
              </Card>

              {/* Mensagens */}
              <div className="space-y-3">
                <h4 className="font-semibold">Conversação</h4>
                {ticketMessages && ticketMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.userId === selectedTicket.userId
                        ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                        : "bg-green-50 dark:bg-green-900/20 mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        {msg.userName || msg.userEmail}
                        {msg.userId !== selectedTicket.userId && (
                          <Badge className="ml-2 bg-green-600 text-white">Suporte</Badge>
                        )}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                ))}

                <div className="flex gap-2 pt-4 border-t">
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={addMessageMutation.isPending || !newMessage.trim()}
                    className="self-end"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
