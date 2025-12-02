import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "./useAuth";

/**
 * Hook para gerenciar o tenant ativo (para master admin)
 * Permite trocar entre tenants para manutenção remota
 */
export function useActiveTenant() {
  const { user } = useAuth();
  const [activeTenantId, setActiveTenantId] = useState<number | null>(null);
  const [activeTenantName, setActiveTenantName] = useState<string>("");

  // Carregar tenant ativo do localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem("activeTenantId");
      if (stored) {
        setActiveTenantId(Number(stored));
      } else {
        // Usar tenant do próprio usuário por padrão
        setActiveTenantId(user.tenantId);
      }
    }
  }, [user]);

  // Buscar lista de tenants para obter informações do ativo
  const { data: tenantsList } = trpc.tenantManagement.list.useQuery(
    {},
    { enabled: !!activeTenantId && user?.role === "master_admin" }
  );

  const tenantInfo = tenantsList?.tenants.find(t => t.id === activeTenantId);

  useEffect(() => {
    if (tenantInfo) {
      setActiveTenantName(tenantInfo.name);
    } else if (user) {
      setActiveTenantName("Meu Tenant");
    }
  }, [tenantInfo, user]);

  // Mutation para trocar de tenant
  const switchTenantMutation = trpc.tenantSwitching.switchTenant.useMutation({
    onSuccess: (data) => {
      setActiveTenantId(data.newTenantId);
      localStorage.setItem("activeTenantId", data.newTenantId.toString());
      
      // Recarregar página para aplicar mudanças
      window.location.reload();
    },
  });

  const switchTenant = (tenantId: number) => {
    switchTenantMutation.mutate({ tenantId });
  };

  const resetToOwnTenant = () => {
    if (user) {
      switchTenant(user.tenantId);
    }
  };

  const isInMaintenanceMode = user && activeTenantId !== user.tenantId;

  return {
    activeTenantId,
    activeTenantName,
    isInMaintenanceMode,
    switchTenant,
    resetToOwnTenant,
    isSwitching: switchTenantMutation.isPending,
  };
}
