import { Building2, Home, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

/**
 * Componente TenantSwitcher
 * Permite master_admin trocar entre tenants para manutenção remota
 * Exibe badge de "Modo Manutenção" quando acessando outro tenant
 */
export function TenantSwitcher() {
  const {
    activeTenant,
    isLoading,
    isMasterAdmin,
    isImpersonating,
    switchTenant,
    exitImpersonation,
    isSwitching,
  } = useActiveTenant();

  // Buscar lista de todos os tenants
  const { data: tenantsData } = trpc.tenantManagement.list.useQuery(
    {
      page: 1,
      limit: 100,
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      enabled: isMasterAdmin,
    }
  );

  // Se não for master admin, não mostrar nada
  if (!isMasterAdmin) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Badge de Modo Manutenção */}
      {isImpersonating && activeTenant?.tenant && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 bg-white rounded-full"
          />
          Modo Manutenção
        </motion.div>
      )}

      {/* Dropdown de Seleção de Tenant */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isSwitching}
          >
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            {isImpersonating && activeTenant?.tenant
              ? activeTenant.tenant.name
              : "Selecionar Cliente"}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Clientes (Tenants)</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Botão para voltar ao tenant próprio */}
          {isImpersonating && (
            <>
              <DropdownMenuItem
                onClick={exitImpersonation}
                disabled={isSwitching}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Meu Tenant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Lista de Tenants */}
          {tenantsData?.tenants && tenantsData.tenants.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {tenantsData.tenants.map((tenant: any) => {
                const isCurrentTenant =
                  isImpersonating && activeTenant?.tenant?.id === tenant.id;

                return (
                  <DropdownMenuItem
                    key={tenant.id}
                    onClick={() => {
                      if (!isCurrentTenant) {
                        switchTenant(tenant.id);
                      }
                    }}
                    disabled={isSwitching || isCurrentTenant}
                    className={
                      isCurrentTenant
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : ""
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm">{tenant.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {tenant.subdomain}
                          </span>
                        </div>
                      </div>
                      {isCurrentTenant && (
                        <span className="text-xs text-blue-600 font-semibold">
                          Ativo
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ) : (
            <div className="px-2 py-4 text-sm text-center text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
