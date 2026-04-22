import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "../config/config.api";
import { webQueryKeys } from "@/lib/query-keys";

type AuthSessionState = {
  isAuthenticated: boolean;
  user: {
    _id?: string;
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

type AuthSessionResult = {
  isChecking: boolean;
  isAuthenticated: boolean;
  user: AuthSessionState["user"];
  authCheckError: string | null;
  retryAuthCheck: () => Promise<unknown>;
};

const parseSessionError = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return (
    data?.message ||
    data?.error ||
    `Unable to verify session (HTTP ${response.status})`
  );
};

export function useAuthSession(): AuthSessionResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<AuthSessionState>({
    queryKey: webQueryKeys.authSession(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          user?: AuthSessionState["user"];
        };
        return {
          isAuthenticated: true,
          user: payload.user ?? null,
        };
      }

      if (response.status === 401) {
        return { isAuthenticated: false, user: null };
      }

      throw new Error(await parseSessionError(response));
    },
    retry: false,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  return {
    isChecking: isLoading,
    isAuthenticated: data?.isAuthenticated ?? false,
    user: data?.user ?? null,
    authCheckError: error instanceof Error ? error.message : null,
    retryAuthCheck: refetch,
  };
}
