import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Activity, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SystemLogsDialog({ open, onOpenChange }: SystemLogsDialogProps) {
  const { data: logs, isLoading } = trpc.system.getSystemLogs.useQuery(undefined, {
    enabled: open,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs do Sistema
          </DialogTitle>
          <DialogDescription>
            Registro de atividades recentes e eventos importantes do sistema.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] mt-4 pr-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {logs?.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="mt-1">{getIcon(log.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">{log.category}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.message}
                    </p>
                  </div>
                </div>
              ))}
              {logs?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log registrado recentemente.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
