import { useAuthContext } from "@/src/context/auth-context";

export const useAuth = () => {
  const context = useAuthContext();
  const { user, token, role, loading, login, logout } = context;

  return {
    user,
    token,
    role,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    authState: context.authState,
    lastOnlineVerifiedAt: context.lastOnlineVerifiedAt,
    offlineExpiresAt: context.offlineExpiresAt,
    lockApp: context.lockApp,
    unlockOffline: context.unlockOffline,
  };
};
