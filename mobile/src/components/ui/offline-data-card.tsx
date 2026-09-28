import { Pressable, Text, View } from "react-native";
import { CloudDownload, Database, RefreshCw } from "lucide-react-native";
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
      ? "Available"
      : offlineDataState === "downloading"
        ? "Downloading"
        : offlineDataState === "partiallyAvailable"
          ? "Update incomplete"
          : "Not downloaded";
  return (
    <View className="mx-5 mb-5 rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
          <Database size={20} color="#0F766E" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-gray-900">Offline Data</Text>
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
          Last synchronized: {formatDate(lastCompleteRecordSyncAt)}
        </Text>
        <Text className="text-sm text-gray-600">
          Resources ready: {verified}/{resourceStates.length || 0}
        </Text>
        <Text className="text-sm text-gray-600">
          Pending submissions: {pendingCount}
        </Text>
        <Text className="text-sm text-gray-600">
          Local drafts and work: {localWorkCount}
        </Text>
        <Text className="text-sm text-gray-600">
          Offline access expires: {formatDate(offlineExpiresAt)}
        </Text>
      </View>
      <Pressable
        disabled={!online || offlineDataState === "downloading"}
        onPress={() => void synchronizeRecords(true)}
        accessibilityRole="button"
        accessibilityLabel="Update offline data"
        className={`mt-4 min-h-12 flex-row items-center justify-center rounded-2xl ${online ? "bg-teal-600" : "bg-gray-300"}`}
      >
        {offlineDataState === "downloading" ? (
          <RefreshCw size={18} color="white" />
        ) : (
          <CloudDownload size={18} color="white" />
        )}
        <Text className="ml-2 font-semibold text-white">
          {offlineDataState === "downloading"
            ? "Updating…"
            : "Update Offline Data"}
        </Text>
      </Pressable>
    </View>
  );
}
