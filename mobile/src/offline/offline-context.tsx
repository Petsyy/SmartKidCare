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
import { listOutboxOperations, updateOutboxStatus } from "./offline-store";
import { synchronizeOfflineRecords, type RecordSyncProgress } from "./offline-record-sync";
import { getActiveResourceStates, getRecordSyncMetadata, type OfflineResourceState } from "./offline-record-store";

type SyncState = "idle" | "syncing" | "paused" | "error";
export type OfflineDataState = "notDownloaded" | "downloading" | "ready" | "partiallyAvailable" | "failed" | "authorizationExpired";

type OfflineContextValue = {
  isConnected: boolean;
  isInternetReachable: boolean;
  syncState: SyncState;
  pendingCount: number;
  localWorkCount: number;
  synchronize: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  offlineDataState: OfflineDataState;
  recordSyncProgress: RecordSyncProgress;
  lastCompleteRecordSyncAt: string | null;
  snapshotGeneratedAt: string | null;
  resourceStates: OfflineResourceState[];
  synchronizeRecords: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

const retryableStatus = (error: unknown) =>
  !(error instanceof ApiError) || error.status >= 500 || error.status === 408;

export const OfflineProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, token, authState } = useAuthContext();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [localWorkCount, setLocalWorkCount] = useState(0);
  const syncingRef = useRef(false);
  const recordSyncingRef = useRef(false);
  const [offlineDataState, setOfflineDataState] = useState<OfflineDataState>("notDownloaded");
  const [recordSyncProgress, setRecordSyncProgress] = useState<RecordSyncProgress>({ downloadedItems: 0, expectedItems: 0 });
  const [lastCompleteRecordSyncAt, setLastCompleteRecordSyncAt] = useState<string | null>(null);
  const [snapshotGeneratedAt, setSnapshotGeneratedAt] = useState<string | null>(null);
  const [resourceStates, setResourceStates] = useState<OfflineResourceState[]>([]);
  const userId = user?.id;

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

  const synchronizeRecords = useCallback(async () => {
    if (recordSyncingRef.current || !userId || !token || !isConnected || !isInternetReachable || authState !== "onlineAuthenticated") return;
    recordSyncingRef.current = true;
    setOfflineDataState("downloading");
    try {
      await synchronizeOfflineRecords(userId, setRecordSyncProgress);
      const metadata = await getRecordSyncMetadata(userId);
      setLastCompleteRecordSyncAt(metadata?.last_complete_sync_at ?? null);
      setSnapshotGeneratedAt(metadata?.generated_at ?? null);
      setResourceStates(await getActiveResourceStates(userId));
      setOfflineDataState("ready");
      await queryClient.invalidateQueries();
    } catch {
      const metadata = await getRecordSyncMetadata(userId);
      setLastCompleteRecordSyncAt(metadata?.last_complete_sync_at ?? null);
      setOfflineDataState(metadata?.active_snapshot_id ? "partiallyAvailable" : "failed");
    } finally {
      recordSyncingRef.current = false;
    }
  }, [authState, isConnected, isInternetReachable, queryClient, token, userId]);

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
    const timeout = setTimeout(() => {
      if (!userId) {
        setOfflineDataState("notDownloaded");
        setLastCompleteRecordSyncAt(null);
        setSnapshotGeneratedAt(null);
        setResourceStates([]);
        return;
      }
      void getRecordSyncMetadata(userId).then((metadata) => {
        setLastCompleteRecordSyncAt(metadata?.last_complete_sync_at ?? null);
        setSnapshotGeneratedAt(metadata?.generated_at ?? null);
        void getActiveResourceStates(userId).then(setResourceStates);
        setOfflineDataState(
          metadata?.active_snapshot_id
            ? metadata.last_error_code ? "partiallyAvailable" : "ready"
            : metadata?.last_error_code ? "failed" : "notDownloaded",
        );
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [userId]);

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
    const timeout = setTimeout(() => {
      void synchronize().then(() => synchronizeRecords());
    }, 0);
    return () => clearTimeout(timeout);
  }, [isConnected, isInternetReachable, synchronize, synchronizeRecords]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void synchronize().then(() => synchronizeRecords());
    });
    return () => subscription.remove();
  }, [synchronize, synchronizeRecords]);

  const value = useMemo(
    () => ({
      isConnected,
      isInternetReachable,
      syncState,
      pendingCount,
      localWorkCount,
      synchronize,
      refreshPendingCount,
      offlineDataState,
      recordSyncProgress,
      lastCompleteRecordSyncAt,
      snapshotGeneratedAt,
      resourceStates,
      synchronizeRecords,
    }),
    [
      isConnected,
      isInternetReachable,
      pendingCount,
      localWorkCount,
      refreshPendingCount,
      syncState,
      synchronize,
      offlineDataState,
      recordSyncProgress,
      lastCompleteRecordSyncAt,
      snapshotGeneratedAt,
      resourceStates,
      synchronizeRecords,
    ],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context)
    throw new Error("useOffline must be used within OfflineProvider");
  return context;
};
