import NetInfo from "@react-native-community/netinfo";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { useAuthContext } from "@/src/context/auth-context";
import { ApiError } from "@/src/api/client";
import { submitAttendance, submitFeeding } from "@/src/api/records.api";
import type {
  SubmitAttendanceData,
  SubmitFeedingData,
} from "@/src/api/api.types";
import { getOfflineDatabase } from "./offline-database";
import {
  hydrateAllowedQueries,
  persistAllowedQueries,
} from "./offline-query-cache";
import {
  listOutboxOperations,
  updateOutboxStatus,
} from "./offline-store";

type SyncState = "idle" | "syncing" | "paused" | "error";

type OfflineContextValue = {
  isConnected: boolean;
  isInternetReachable: boolean;
  syncState: SyncState;
  pendingCount: number;
  localWorkCount: number;
  synchronize: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

const retryableStatus = (error: unknown) =>
  !(error instanceof ApiError) || error.status >= 500 || error.status === 408;

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token, authState } = useAuthContext();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [localWorkCount, setLocalWorkCount] = useState(0);
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    if (!user?.id) {
      setPendingCount(0);
      return;
    }
    const operations = await listOutboxOperations(user.id);
    setPendingCount(operations.length);
    const { getLocalWorkCount } = await import("./offline-store");
    setLocalWorkCount(await getLocalWorkCount(user.id));
  }, [user]);

  const synchronize = useCallback(async () => {
    if (
      syncingRef.current ||
      !user?.id ||
      !token ||
      !isConnected ||
      !isInternetReachable
    ) {
      if (user?.id && !token) setSyncState("paused");
      return;
    }

    syncingRef.current = true;
    setSyncState("syncing");
    let terminalState: SyncState = "idle";
    try {
      const operations = await listOutboxOperations(user.id);
      for (const operation of operations) {
        if (operation.status === "needsAttention") continue;
        await updateOutboxStatus(operation.clientOperationId, "attempting");
        try {
          if (operation.operationType === "attendance.create") {
            await submitAttendance({
              ...(operation.frozenPayload as SubmitAttendanceData),
              clientOperationId: operation.clientOperationId,
            });
          } else {
            await submitFeeding({
              ...(operation.frozenPayload as SubmitFeedingData),
              clientOperationId: operation.clientOperationId,
            });
          }
          await updateOutboxStatus(operation.clientOperationId, "synced");
          await queryClient.invalidateQueries();
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await updateOutboxStatus(
              operation.clientOperationId,
              "pausedForAuthentication",
              error.code ?? "AUTHENTICATION_REQUIRED",
            );
            terminalState = "paused";
            break;
          }
          await updateOutboxStatus(
            operation.clientOperationId,
            retryableStatus(error) ? "failedRetryable" : "needsAttention",
            error instanceof ApiError ? error.code : "TRANSIENT_FAILURE",
          );
          if (!retryableStatus(error)) continue;
          terminalState = "error";
          break;
        }
      }
      setSyncState(terminalState);
    } finally {
      syncingRef.current = false;
      await refreshPendingCount();
    }
  }, [
    isConnected,
    isInternetReachable,
    queryClient,
    refreshPendingCount,
    token,
    user?.id,
  ]);

  useEffect(() => {
    void getOfflineDatabase();
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = Boolean(state.isConnected);
      const reachable = state.isInternetReachable !== false;
      setIsConnected(connected);
      setIsInternetReachable(reachable);
      onlineManager.setOnline(connected && reachable);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => void refreshPendingCount(), 0);
    return () => clearTimeout(timeout);
  }, [refreshPendingCount]);

  useEffect(() => {
    if (
      !user?.id ||
      (authState !== "onlineAuthenticated" &&
        authState !== "offlineAuthenticated")
    ) {
      return;
    }
    void hydrateAllowedQueries(queryClient, user.id);
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        void persistAllowedQueries(queryClient, user.id);
      }, 500);
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsubscribe();
    };
  }, [authState, queryClient, user?.id]);

  useEffect(() => {
    if (!isConnected || !isInternetReachable) return;
    const timeout = setTimeout(() => void synchronize(), 0);
    return () => clearTimeout(timeout);
  }, [isConnected, isInternetReachable, synchronize]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void synchronize();
    });
    return () => subscription.remove();
  }, [synchronize]);

  const value = useMemo(
    () => ({
      isConnected,
      isInternetReachable,
      syncState,
      pendingCount,
      localWorkCount,
      synchronize,
      refreshPendingCount,
    }),
    [
      isConnected,
      isInternetReachable,
      pendingCount,
      localWorkCount,
      refreshPendingCount,
      syncState,
      synchronize,
    ],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error("useOffline must be used within OfflineProvider");
  return context;
};
