import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearSession,
  getToken,
  getUser,
  saveToken,
  saveUser,
  saveLastOnlineVerifiedAt,
  getLastOnlineVerifiedAt,
  clearLastOnlineVerifiedAt,
  saveAppLocked,
  getAppLocked,
  clearAppLocked,
} from "@/src/utils/auth-storage";
import { setAuthToken } from "@/src/api/client";
import { queryClient } from "@/src/lib/query-client";

type Role = "parent" | "teacher" | null;

export type User = {
  id: string;
  email: string;
  role: Role;
  needsToConfirmLink?: boolean;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  daycareCenterId?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  role: Role;
  loading: boolean;
  authState:
    | "signedOut"
    | "onlineAuthenticated"
    | "offlineLocked"
    | "offlineAuthenticated"
    | "reauthenticationRequired";
  lastOnlineVerifiedAt: string | null;
  offlineExpiresAt: string | null;
  lockApp: () => Promise<void>;
  unlockOffline: () => Promise<boolean>;
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
  const [authState, setAuthState] =
    useState<AuthContextType["authState"]>("signedOut");
  const [lastOnlineVerifiedAt, setLastOnlineVerifiedAt] = useState<
    string | null
  >(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the module-level token in the API client in sync.
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

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

        const [storedVerifiedAt, isAppLocked] = await Promise.all([
          getLastOnlineVerifiedAt(),
          getAppLocked(),
        ]);
        setLastOnlineVerifiedAt(storedVerifiedAt);

        if (storedToken && storedUser) {
          const expiresAt = decodeJwtExpMs(storedToken);
          setUser(storedUser);
          const offlineAccessValid =
            storedVerifiedAt &&
            Date.parse(storedVerifiedAt) + 7 * 24 * 60 * 60 * 1000 > Date.now();
          if (isAppLocked) {
            setToken(null);
            setAuthState(
              offlineAccessValid ? "offlineLocked" : "reauthenticationRequired",
            );
          } else if (!expiresAt || expiresAt > Date.now()) {
            setToken(storedToken);
            setAuthState("onlineAuthenticated");
          } else if (offlineAccessValid) {
            setToken(null);
            setAuthState("offlineLocked");
          } else {
            setToken(null);
            setAuthState("reauthenticationRequired");
          }
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

    const expireNow = () => {
      setToken(null);
      const stillEligible =
        lastOnlineVerifiedAt &&
        Date.parse(lastOnlineVerifiedAt) + 7 * 24 * 60 * 60 * 1000 > Date.now();
      setAuthState(
        stillEligible ? "offlineLocked" : "reauthenticationRequired",
      );
    };

    if (msUntilExpiry <= 0) {
      expireNow();
      return;
    }

    expiryTimerRef.current = setTimeout(expireNow, msUntilExpiry);
  }, [lastOnlineVerifiedAt, token]);

  const login = async (userData: User, authToken: string) => {
    const verifiedAt = new Date().toISOString();
    queryClient.clear();
    setUser(userData);
    setToken(authToken);
    setLastOnlineVerifiedAt(verifiedAt);
    setAuthState("onlineAuthenticated");

    await Promise.all([
      saveToken(authToken),
      saveUser(userData),
      saveLastOnlineVerifiedAt(verifiedAt),
      clearAppLocked(),
    ]);
  };

  const lockApp = async () => {
    if (
      !user ||
      !offlineExpiresAt ||
      // Eligibility must be checked at the moment the user requests a lock.
      // eslint-disable-next-line react-hooks/purity
      Date.parse(offlineExpiresAt) <= Date.now()
    ) {
      setToken(null);
      setAuthState("reauthenticationRequired");
      queryClient.clear();
      return;
    }

    await saveAppLocked();
    setToken(null);
    setAuthState("offlineLocked");
    queryClient.clear();
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthState("signedOut");
    setLastOnlineVerifiedAt(null);
    queryClient.clear();

    await Promise.all([
      clearSession(),
      clearLastOnlineVerifiedAt(),
      clearAppLocked(),
      AsyncStorage.removeItem("token"),
      AsyncStorage.removeItem("user"),
    ]);
  };

  const refreshUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await saveUser(updatedUser);
  };

  const offlineExpiresAt = lastOnlineVerifiedAt
    ? new Date(
        Date.parse(lastOnlineVerifiedAt) + 7 * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  const unlockOffline = async () => {
    if (
      !user ||
      !offlineExpiresAt ||
      Date.parse(offlineExpiresAt) <= Date.now()
    ) {
      setAuthState("reauthenticationRequired");
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock SmartKidCare",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    if (!result.success) return false;

    const storedToken = await getToken();
    const expiresAt = storedToken ? decodeJwtExpMs(storedToken) : null;
    if (storedToken && (!expiresAt || expiresAt > Date.now())) {
      setToken(storedToken);
      setAuthState("onlineAuthenticated");
    } else {
      setToken(null);
      setAuthState("offlineAuthenticated");
    }
    await clearAppLocked();
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role ?? null,
        loading,
        authState,
        lastOnlineVerifiedAt,
        offlineExpiresAt,
        lockApp,
        unlockOffline,
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
