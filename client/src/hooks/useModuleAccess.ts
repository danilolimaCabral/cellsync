import { trpc } from "@/lib/trpc";
import { useAuth } from "./useAuth";

/**
 * Hook para verificar acesso a módulos
 */
export function useModuleAccess() {
  const { user } = useAuth();
  
  // Master admin tem acesso a tudo
  if (user?.role === "master_admin") {
    return {
      hasAccess: () => true,
      modules: [],
      isLoading: false,
    };
  }

  const { data: modules, isLoading } = trpc.modules.getMyModules.useQuery(undefined, {
    enabled: !!user,
  });

  const hasAccess = (moduleCode: string): boolean => {
    if (!modules) return false;
    const module = modules.find(m => m.code === moduleCode);
    if (!module) return false;
    
    // Verificar se está ativo
    if (!module.enabled) return false;
    
    // Verificar se não expirou
    if (module.expiresAt && new Date(module.expiresAt) < new Date()) {
      return false;
    }
    
    return true;
  };

  return {
    hasAccess,
    modules: modules || [],
    isLoading,
  };
}

/**
 * Mapeamento de rotas para códigos de módulos
 */
export const ROUTE_MODULE_MAP: Record<string, string> = {
  "/vendas": "pdv",
  "/estoque": "estoque",
  "/ordem-servico": "os",
  "/financeiro": "financeiro",
  "/controle-comissoes": "comissoes",
  "/clientes": "clientes",
  "/dashboard-bi": "relatorios",
  "/relatorios": "relatorios",
  "/notas-fiscais": "nfe",
  "/emitir-nfe": "nfe",
};

/**
 * Verificar se uma rota requer módulo específico
 */
export function getModuleForRoute(path: string): string | null {
  return ROUTE_MODULE_MAP[path] || null;
}
