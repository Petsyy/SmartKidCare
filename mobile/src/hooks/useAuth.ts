import { useAuthContext } from "@/src/context/AuthContext";

export const useAuth = () => {
  const { user, role, loading, login, logout } = useAuthContext();

  return {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
};
