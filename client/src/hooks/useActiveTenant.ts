import { trpc } from "@/lib/trpc";
import { useAuth } from "./useAuth";

/**
 * Hook para gerenciar o tenant ativo no sistema multi-tenant
 * Permite master_admin trocar entre tenants para manutenção remota
 */
export function useActiveTenant() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Busca o tenant ativo atual (se houver impersonação)
  const { data: activeTenant, isLoading } = trpc.tenantSwitching.getCurrentTenant.useQuery(
    undefined,
    {
      enabled: !!user && user.role === "master_admin",
      refetchOnWindowFocus: false,
    }
  );

  // Mutation para trocar de tenant
  const switchTenantMutation = trpc.tenantSwitching.switchTenant.useMutation({
    onSuccess: () => {
      // Invalida todas as queries para forçar reload com novo tenant
      utils.invalidate();
      // Recarrega a página para aplicar novo contexto
      window.location.reload();
    },
  });

  // Mutation para voltar ao tenant próprio
  const exitImpersonationMutation = trpc.tenantSwitching.exitImpersonation.useMutation({
    onSuccess: () => {
      utils.invalidate();
      window.location.reload();
    },
  });

  const switchTenant = (tenantId: number) => {
    switchTenantMutation.mutate({ tenantId });
  };

  const exitImpersonation = () => {
    exitImpersonationMutation.mutate();
  };

  const isMasterAdmin = user?.role === "master_admin";
  const isImpersonating = !!activeTenant?.isImpersonating;

  return {
    activeTenant,
    isLoading,
    isMasterAdmin,
    isImpersonating,
    switchTenant,
    exitImpersonation,
    isSwitching: switchTenantMutation.isPending || exitImpersonationMutation.isPending,
  };
}
