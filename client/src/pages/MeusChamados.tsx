import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
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

export default function MeusChamados() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  
  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("media");
  const [description, setDescription] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Queries
  const { data: tickets, isLoading, refetch } = trpc.supportTickets.myTickets.useQuery();
  const { data: ticketMessages } = trpc.supportTickets.getMessages.useQuery(
    { ticketId: selectedTicket! },
    { enabled: !!selectedTicket }
  );

  // Mutations
  const createTicketMutation = trpc.supportTickets.create.useMutation({
    onSuccess: () => {
      toast.success("Chamado criado com sucesso!", {
        description: "Nossa equipe irá responder em breve.",
      });
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar chamado", {
        description: error.message,
      });
    },
  });

  const addMessageMutation = trpc.supportTickets.addMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada!");
      setNewMessage("");
      refetch();
    },
  });

  const resetForm = () => {
    setSubject("");
    setCategory("");
    setPriority("media");
    setDescription("");
  };

  const handleCreateTicket = () => {
    if (!subject || !category || !description) {
      toast.error("Campos obrigatórios", {
        description: "Preencha todos os campos antes de enviar.",
      });
      return;
    }

    createTicketMutation.mutate({
      subject,
      category: category as any,
      priority: priority as any,
      description,
    });
  };

  const handleSendMessage = (ticketId: number) => {
    if (!newMessage.trim()) return;

    addMessageMutation.mutate({
      ticketId,
      message: newMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 gap-4">
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
      <div className="flex items-center justify-between">
        <PageHeader
          title="Meus Chamados"
          description="Acompanhe seus tickets de suporte"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Abrir Novo Chamado</DialogTitle>
              <DialogDescription>
                Descreva seu problema ou dúvida e nossa equipe irá te ajudar.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  placeholder="Resumo do problema"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="duvida">Dúvida</SelectItem>
                      <SelectItem value="problema_tecnico">Problema Técnico</SelectItem>
                      <SelectItem value="solicitacao_recurso">Solicitação de Recurso</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade *</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente seu problema ou dúvida..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? "Enviando..." : "Criar Chamado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                  onClick={() => setSelectedTicket(ticket.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <StatusIcon className="h-5 w-5" />
                          {ticket.subject}
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          #{ticket.id} • {categoryLabels[ticket.category as keyof typeof categoryLabels]}
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
                Nenhum chamado aberto
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
                Você ainda não abriu nenhum chamado. Clique em "Novo Chamado" para solicitar suporte.
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
              <DialogTitle>Detalhes do Chamado #{selectedTicket}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {ticketMessages && ticketMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.userId === user?.id
                      ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                      : "bg-slate-50 dark:bg-slate-800/50 mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">
                      {msg.userName || msg.userEmail}
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
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(selectedTicket);
                    }
                  }}
                />
                <Button
                  onClick={() => handleSendMessage(selectedTicket)}
                  disabled={addMessageMutation.isPending || !newMessage.trim()}
                >
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
