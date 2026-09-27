import { Text, View } from "react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";

export function OfflineStatusBanner() {
  const { authState } = useAuth();
  const { isConnected, isInternetReachable, pendingCount, syncState } =
    useOffline();
  const isOffline = !isConnected || !isInternetReachable;

  if (authState === "signedOut" || (!isOffline && pendingCount === 0)) {
    return null;
  }

  const message = isOffline
    ? pendingCount > 0
      ? `Offline \u2022 ${pendingCount} queued for synchronization`
      : "Offline \u2022 showing securely cached information"
    : syncState === "syncing"
      ? `Synchronizing ${pendingCount} submission${pendingCount === 1 ? "" : "s"}\u2026`
      : `${pendingCount} submission${pendingCount === 1 ? "" : "s"} waiting to synchronize`;

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
