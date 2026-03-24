import { Text, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import type { TeacherEnrollmentRequest } from "@/src/api/teacher.api";
import {
  getBlockchainStatusInfo,
  getBlockchainStatusPalette,
  shortenHash,
} from "@/src/utils/blockchain-status";

export function EnrollmentRequestBlockchainStatus({
  request,
}: {
  request: TeacherEnrollmentRequest;
}) {
  if (request.status === "rejected") {
    return null;
  }

  if (request.status === "pending") {
    return (
      <View className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
        <View className="flex-row items-center">
          <ShieldCheck size={18} color="#6B7280" />
          <Text className="ml-2 text-sm font-semibold text-gray-700">
            Blockchain status will appear after admin approval.
          </Text>
        </View>
      </View>
    );
  }

  const statusInfo = getBlockchainStatusInfo(
    request.createdChild?.documentIntegrity,
  );
  const palette = getBlockchainStatusPalette(statusInfo.key);

  return (
    <View
      className="mt-3 rounded-2xl border p-3.5"
      style={{
        borderColor: palette.borderColor,
        backgroundColor: palette.backgroundColor,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center pr-3">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: palette.dotColor }}
          />
          <Text
            className="ml-2 text-sm font-semibold"
            style={{ color: palette.textColor }}
          >
            {statusInfo.label}
          </Text>
        </View>

        {request.createdChild?.studentId ? (
          <Text className="text-xs font-semibold text-gray-500">
            {request.createdChild.studentId}
          </Text>
        ) : null}
      </View>

      <Text className="mt-2 text-sm text-gray-700">{statusInfo.detail}</Text>

      {statusInfo.txHash ? (
        <Text className="mt-2 text-xs font-medium text-gray-500">
          Tx: {shortenHash(statusInfo.txHash)}
        </Text>
      ) : null}
    </View>
  );
}
