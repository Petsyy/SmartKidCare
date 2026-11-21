import { useQuery } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";
import { authService, type AuthSessionState, type AuthUser } from "@/features/auth";

type AuthSessionResult = {
  isChecking: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  authCheckError: string | null;
  retryAuthCheck: () => Promise<unknown>;
};

export function useAuthSession(): AuthSessionResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<AuthSessionState>({
    queryKey: webQueryKeys.authSession(),
    queryFn: () => authService.getAuthSession(),
    retry: false,
    staleTime: Infinity,
  });

  return {
    isChecking: isLoading,
    isAuthenticated: data?.isAuthenticated ?? false,
    user: data?.user ?? null,
    authCheckError: error instanceof Error ? error.message : null,
    retryAuthCheck: refetch,
  };
}
