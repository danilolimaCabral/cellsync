import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Building2, Mail, Calendar, Users, HardDrive, Globe } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TenantDetailsDialogProps {
  tenantId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantDetailsDialog({ tenantId, open, onOpenChange }: TenantDetailsDialogProps) {
  const { data: tenant, isLoading } = trpc.system.getTenantDetails.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId && open }
  );

  if (!tenantId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detalhes da Empresa
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o cliente selecionado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tenant ? (
          <div className="space-y-6">
            {/* Cabeçalho com Status */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{tenant.name}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  CNPJ: {tenant.cnpj || "Não informado"}
                </p>
              </div>
              <Badge 
                className={
                  tenant.status === "active" ? "bg-green-500" :
                  tenant.status === "trial" ? "bg-blue-500" :
                  "bg-red-500"
                }
              >
                {tenant.status === "active" ? "Ativo" :
                 tenant.status === "trial" ? "Trial" : "Inativo"}
              </Badge>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Subdomínio
                </span>
                <p className="font-medium text-sm">{tenant.subdomain}.cellsync.com.br</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Criado em
                </span>
                <p className="font-medium text-sm">
                  {format(new Date(tenant.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Usuários
                </span>
                <p className="font-medium text-sm">
                  {tenant.stats.usersCount} / {tenant.plan?.maxUsers || "∞"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" /> Plano
                </span>
                <p className="font-medium text-sm">{tenant.plan?.name || "Básico"}</p>
              </div>
            </div>

            {/* Dono da Conta */}
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Proprietário
              </h4>
              {tenant.owner ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{tenant.owner.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {tenant.owner.email}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum proprietário identificado.</p>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => toast.info("Funcionalidade de login como cliente em breve")}
              >
                Acessar Painel
              </Button>
              <Button 
                className="w-full" 
                variant="destructive"
                onClick={() => toast.info("Funcionalidade de bloqueio em breve")}
              >
                Bloquear Acesso
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Não foi possível carregar os detalhes.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
