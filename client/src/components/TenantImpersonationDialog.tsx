import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LogIn, AlertCircle } from "lucide-react";

interface TenantImpersonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantImpersonationDialog({
  open,
  onOpenChange,
}: TenantImpersonationDialogProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Get list of all tenants
  const { data: tenantsList, isLoading: isLoadingTenants } =
    trpc.system.getAllTenants.useQuery(undefined, {
      enabled: open,
    });

  // Impersonation mutation
  const impersonateMutation = trpc.system.impersonateTenant.useMutation({
    onSuccess: (data) => {
      // Store the impersonation token in localStorage
      localStorage.setItem("impersonationToken", data.token);
      localStorage.setItem("impersonationExpiresAt", String(Date.now() + data.expiresIn * 1000));
      
      toast.success("Impersonação iniciada! Redirecionando...");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao iniciar impersonação");
    },
  });

  const filteredTenants = tenantsList?.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.cnpj?.includes(searchTerm) ||
    tenant.subdomain?.includes(searchTerm)
  );

  const handleImpersonate = () => {
    if (!selectedTenantId) {
      toast.error("Selecione uma empresa");
      return;
    }

    impersonateMutation.mutate({
      tenantId: Number(selectedTenantId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Assumir Identidade de Cliente
          </DialogTitle>
          <DialogDescription>
            Selecione uma empresa para acessar como administrador e realizar manutenção
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Card */}
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">Aviso de Segurança</p>
                <p>
                  Você está prestes a assumir a identidade de um cliente. Todas as ações serão registradas para auditoria.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Empresa</Label>
            <Input
              id="search"
              placeholder="Digite o nome, CNPJ ou subdomínio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tenant Selection */}
          <div className="space-y-2">
            <Label htmlFor="tenant">Selecione a Empresa</Label>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger id="tenant" disabled={isLoadingTenants}>
                <SelectValue placeholder="Carregando empresas..." />
              </SelectTrigger>
              <SelectContent>
                {filteredTenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={String(tenant.id)}>
                    <div className="flex items-center gap-2">
                      <span>{tenant.name}</span>
                      {tenant.cnpj && (
                        <span className="text-xs text-slate-500">
                          ({tenant.cnpj})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Tenant Details */}
          {selectedTenantId && filteredTenants && (
            <Card className="bg-slate-50 dark:bg-slate-900">
              <CardContent className="p-4 space-y-2">
                {(() => {
                  const tenant = filteredTenants.find(
                    (t) => String(t.id) === selectedTenantId
                  );
                  return tenant ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Nome
                          </p>
                          <p className="font-semibold">{tenant.name}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            CNPJ
                          </p>
                          <p className="font-semibold">{tenant.cnpj || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Plano
                          </p>
                          <p className="font-semibold">{tenant.planName}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Status
                          </p>
                          <p className="font-semibold capitalize">
                            {tenant.status}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={impersonateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImpersonate}
              disabled={!selectedTenantId || impersonateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {impersonateMutation.isPending
                ? "Iniciando..."
                : "Assumir Identidade"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
