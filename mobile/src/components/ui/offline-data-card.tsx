import { Pressable, Text, View } from "react-native";
import {
  CloudDownload,
  Database,
  RefreshCw,
  WifiOff,
} from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not downloaded";

export function OfflineDataCard() {
  const { offlineExpiresAt } = useAuth();
  const {
    offlineDataState,
    lastCompleteRecordSyncAt,
    resourceStates,
    recordSyncProgress,
    pendingCount,
    localWorkCount,
    synchronizeRecords,
    isConnected,
    isInternetReachable,
  } = useOffline();
  const online = isConnected && isInternetReachable;
  const verified = resourceStates.filter((item) => item.verified).length;
  const stateLabel =
    offlineDataState === "ready"
      ? "Offline data is up to date"
      : offlineDataState === "downloading"
        ? "Updating offline data..."
        : offlineDataState === "partiallyAvailable"
          ? "Offline update incomplete"
          : offlineDataState === "failed"
            ? "Offline update failed"
            : offlineDataState === "authorizationExpired"
              ? "Offline access expired"
              : "Offline data is not downloaded";
  const actionLabel =
    offlineDataState === "downloading"
      ? "Updating..."
      : offlineDataState === "failed" ||
          offlineDataState === "partiallyAvailable"
        ? "Retry Update"
        : offlineDataState === "notDownloaded"
          ? "Download Offline Data"
          : "Refresh Offline Data";

  if (!online) {
    const hasOfflineData = Boolean(lastCompleteRecordSyncAt) && verified > 0;

    return (
      <View className="mx-5 mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <View className="flex-row items-start">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <WifiOff size={20} color="#B45309" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-amber-950">
              You are offline
            </Text>
            <Text className="mt-1 text-sm leading-5 text-amber-800">
              {hasOfflineData
                ? "Saved data is available on this device."
                : "Offline data is unavailable. Connect to the internet to download it."}
            </Text>
            {hasOfflineData ? (
              <Text className="mt-2 text-xs font-semibold text-amber-700">
                Last updated: {formatDate(lastCompleteRecordSyncAt)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mx-5 mb-5 rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
          <Database size={20} color="#0F766E" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-gray-900">Offline Access</Text>
          <Text className="text-xs text-gray-500">{stateLabel}</Text>
        </View>
      </View>
      {offlineDataState === "downloading" ? (
        <Text className="mt-4 text-sm text-teal-700">
          Preparing offline data · {recordSyncProgress.downloadedItems}/
          {recordSyncProgress.expectedItems} records
        </Text>
      ) : null}
      <View className="mt-4 gap-2">
        <Text className="text-sm text-gray-600">
          Last updated: {formatDate(lastCompleteRecordSyncAt)}
        </Text>
        <Text className="text-sm text-gray-600">
          Data categories ready: {verified}/{resourceStates.length || 0}
        </Text>
        <Text className="text-sm text-gray-600">
          Submissions waiting to sync: {pendingCount}
        </Text>
        <Text className="text-sm text-gray-600">
          Saved drafts and local work: {localWorkCount}
        </Text>
        <Text className="text-sm text-gray-600">
          Access available until: {formatDate(offlineExpiresAt)}
        </Text>
      </View>
      <Pressable
        disabled={!online || offlineDataState === "downloading"}
        onPress={() => void synchronizeRecords(true)}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        className={`mt-4 min-h-12 flex-row items-center justify-center rounded-2xl ${online ? "bg-teal-600" : "bg-gray-300"}`}
      >
        {offlineDataState === "downloading" ? (
          <RefreshCw size={18} color="white" />
        ) : (
          <CloudDownload size={18} color="white" />
        )}
        <Text className="ml-2 font-semibold text-white">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
