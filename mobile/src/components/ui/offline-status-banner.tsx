import { Text, View } from "react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";

export function OfflineStatusBanner() {
  const { authState } = useAuth();
  const {
    isConnected,
    isInternetReachable,
    pendingCount,
    syncState,
    offlineDataState,
    recordSyncProgress,
    lastCompleteRecordSyncAt,
  } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;

  const showRecordStatus =
    offlineDataState === "downloading" ||
    offlineDataState === "failed" ||
    offlineDataState === "partiallyAvailable";

  if (
    authState === "signedOut" ||
    (!isOffline && pendingCount === 0 && !showRecordStatus && offlineDataState !== "ready")
  ) {
    return null;
  }

  const updatedLabel = lastCompleteRecordSyncAt
    ? new Date(lastCompleteRecordSyncAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;
  const message = isOffline
    ? pendingCount > 0
      ? `Offline \u2022 ${pendingCount} queued for synchronization`
      : offlineDataState === "ready" || offlineDataState === "partiallyAvailable"
        ? `Offline \u2022 showing data from ${updatedLabel ?? "the last synchronization"}`
        : "Offline records are not ready \u2022 connect to synchronize"
    : offlineDataState === "downloading"
      ? `Preparing offline records \u2022 ${recordSyncProgress.downloadedItems}/${recordSyncProgress.expectedItems}`
      : offlineDataState === "failed"
        ? "Offline records are incomplete \u2022 reconnect to retry"
        : offlineDataState === "partiallyAvailable"
        ? `Update incomplete \u2022 showing data from ${updatedLabel ?? "the previous synchronization"}`
    : syncState === "syncing"
      ? `Synchronizing ${pendingCount} submission${pendingCount === 1 ? "" : "s"}\u2026`
      : pendingCount > 0
        ? `${pendingCount} submission${pendingCount === 1 ? "" : "s"} waiting to synchronize`
        : `Available offline${updatedLabel ? ` \u2022 updated ${updatedLabel}` : ""}`;

  return (
    <View
      className="border-b border-gray-700 bg-gray-900 px-4 py-2.5"
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Text className="text-center text-sm font-semibold text-white">
        {message}
      </Text>
    </View>
  );
}
