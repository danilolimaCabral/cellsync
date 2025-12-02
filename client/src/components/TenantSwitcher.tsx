import { useAuth } from "@/hooks/useAuth";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * Componente de troca de tenant para master admin
 * Permite acessar outros clientes para manutenção remota
 */
export function TenantSwitcher() {
  const { user } = useAuth();
  const {
    activeTenantId,
    activeTenantName,
    isInMaintenanceMode,
    switchTenant,
    resetToOwnTenant,
    isSwitching,
  } = useActiveTenant();

  // Buscar lista de tenants (apenas para master admin)
  const { data: tenantsData } = trpc.tenantManagement.list.useQuery(
    {},
    { enabled: user?.role === "master_admin" }
  );

  // Não mostrar para usuários não-master
  if (!user || user.role !== "master_admin") {
    return null;
  }

  const tenants = tenantsData?.tenants || [];

  const handleTenantChange = (tenantIdStr: string) => {
    const tenantId = Number(tenantIdStr);
    if (tenantId === user.tenantId) {
      resetToOwnTenant();
    } else {
      toast.info(`Acessando tenant: ${tenants.find(t => t.id === tenantId)?.name}`);
      switchTenant(tenantId);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Badge de Modo Manutenção */}
      {isInMaintenanceMode && (
        <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1.5 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="font-semibold">Modo Manutenção</span>
        </Badge>
      )}

      {/* Dropdown de Seleção de Tenant */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select
          value={activeTenantId?.toString() || ""}
          onValueChange={handleTenantChange}
          disabled={isSwitching}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione um cliente">
              {activeTenantName || "Carregando..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Opção de voltar ao próprio tenant */}
            <SelectItem value={user.tenantId.toString()}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">🏠 Meu Tenant</span>
              </div>
            </SelectItem>

            {/* Separador */}
            {tenants.length > 0 && (
              <div className="border-t my-1"></div>
            )}

            {/* Lista de outros tenants */}
            {tenants
              .filter(t => t.id !== user.tenantId)
              .map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{tenant.name}</span>
                    {tenant.id === activeTenantId && (
                      <Badge variant="outline" className="text-xs">Ativo</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão de Voltar (apenas quando em modo manutenção) */}
      {isInMaintenanceMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetToOwnTenant}
          disabled={isSwitching}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Meu Tenant
        </Button>
      )}
    </div>
  );
}
