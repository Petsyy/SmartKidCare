import { useAuthContext } from "@/src/context/auth-context";

export const useAuth = () => {
  const { user, token, role, loading, login, logout } = useAuthContext();

  return {
    user,
    token,
    role,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };
};
