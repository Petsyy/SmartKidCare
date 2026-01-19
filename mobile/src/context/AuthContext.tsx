import React, { createContext, useContext, useEffect, useState } from "react";

type Role = "parent" | "worker" | null;

export type User = {
  id: string;
  email: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  role: Role;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate restoring session (AsyncStorage / SecureStore)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // TODO: load user from storage or API
        // const storedUser = await AsyncStorage.getItem("user")
        // if (storedUser) setUser(JSON.parse(storedUser))

      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    // AsyncStorage.setItem("user", JSON.stringify(userData))
  };

  

  const logout = () => {
    setUser(null);
    // AsyncStorage.removeItem("user")
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
