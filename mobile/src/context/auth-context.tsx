import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearSession,
  getToken,
  getUser,
  saveToken,
  saveUser,
} from "@/src/utils/auth-storage";

type Role = "parent" | "teacher" | null;

export type User = {
  id: string;
  email: string;
  role: Role;
  needsToConfirmLink?: boolean;
  firstName?: string;
  lastName?: string;
  middleName?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  role: Role;
  loading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (user: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeJwtExpMs = (token: string): number | null => {
  try {
    const payloadPart = String(token).split(".")[1];
    if (!payloadPart || typeof globalThis.atob !== "function") {
      return null;
    }

    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");

    const payload = JSON.parse(globalThis.atob(normalizedPayload)) as {
      exp?: number;
    };

    if (typeof payload.exp !== "number") {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        let storedToken = await getToken();
        let storedUser = await getUser<User>();

        // Migrate legacy AsyncStorage session data to SecureStore.
        if (!storedToken) {
          const legacyToken = await AsyncStorage.getItem("token");
          if (legacyToken) {
            storedToken = legacyToken;
            await saveToken(legacyToken);
            await AsyncStorage.removeItem("token");
          }
        }

        if (!storedUser) {
          const legacyUser = await AsyncStorage.getItem("user");
          if (legacyUser) {
            try {
              const parsedLegacyUser = JSON.parse(legacyUser) as User;
              storedUser = parsedLegacyUser;
              await saveUser(parsedLegacyUser);
            } catch {
              // Drop invalid legacy user payload.
            } finally {
              await AsyncStorage.removeItem("user");
            }
          }
        }

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        } else {
          // Clear inconsistent auth leftovers.
          await clearSession();
        }
      } catch (error) {
        console.log("Failed to restore session", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    if (!token) {
      return;
    }

    const expiresAtMs = decodeJwtExpMs(token);
    if (!expiresAtMs) {
      return;
    }

    const msUntilExpiry = expiresAtMs - Date.now();

    if (msUntilExpiry <= 0) {
      setUser(null);
      setToken(null);
      void Promise.all([
        clearSession(),
        AsyncStorage.removeItem("token"),
        AsyncStorage.removeItem("user"),
      ]);
      return;
    }

    expiryTimerRef.current = setTimeout(() => {
      setUser(null);
      setToken(null);
      void Promise.all([
        clearSession(),
        AsyncStorage.removeItem("token"),
        AsyncStorage.removeItem("user"),
      ]);
    }, msUntilExpiry);
  }, [token]);

  const login = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);

    await Promise.all([saveToken(authToken), saveUser(userData)]);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);

    await Promise.all([
      clearSession(),
      AsyncStorage.removeItem("token"),
      AsyncStorage.removeItem("user"),
    ]);
  };

  const refreshUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await saveUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role ?? null,
        loading,
        login,
        logout,
        refreshUser,
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
