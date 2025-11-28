import { trpc } from "@/lib/trpc";

/**
 * Hook customizado para autenticação local
 * Substitui o useAuth do Manus OAuth
 */
export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();
  
  return {
    user: user || null,
    loading: isLoading,
    error: error?.message,
    isAuthenticated: !!user,
  };
}

/**
 * Retorna URL de login local (não usa OAuth)
 */
export function getLoginUrl() {
  return "/login";
}
