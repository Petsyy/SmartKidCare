import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  IdCard,
  RefreshCw,
  XCircle,
} from "lucide-react-native";

export interface ParentInfo {
  firstName: string;
  lastName: string;
  hasIdDocument: boolean;
}

interface PickupParentIdCardProps {
  parent: ParentInfo;
  isLoadingParentId: boolean;
  parentIdLoadFailed: boolean;
  hasViewedParentId: boolean;
  isVisuallyVerified: boolean;
  onViewParentId: () => void;
  onToggleVisualVerification: (value: boolean) => void;
}

export function PickupParentIdCard({
  parent,
  isLoadingParentId,
  parentIdLoadFailed,
  hasViewedParentId,
  isVisuallyVerified,
  onViewParentId,
  onToggleVisualVerification,
}: PickupParentIdCardProps) {
  const isCheckboxDisabled =
    !parent.hasIdDocument ||
    parentIdLoadFailed ||
    isLoadingParentId ||
    !hasViewedParentId;

  return (
    <View className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <Text className="mb-2 text-sm font-black text-gray-800">
        Parent Verification Document
      </Text>

      {!parent.hasIdDocument ? (
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <View className="flex-row items-start">
            <AlertCircle size={18} color="#DC2626" />
            <Text className="ml-2 flex-1 text-sm font-semibold leading-5 text-red-700">
              No parent government-issued photo ID is stored. Manual release is
              blocked; use the pickup code or update the enrollment record.
            </Text>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={onViewParentId}
          disabled={isLoadingParentId}
          className={`flex-row items-center justify-center rounded-2xl border px-4 py-4 ${
            parentIdLoadFailed
              ? "border-amber-200 bg-amber-50"
              : "border-teal-200 bg-white"
          }`}
          accessibilityRole="button"
          accessibilityLabel={
            parentIdLoadFailed
              ? "Retry loading parent government-issued photo ID"
              : "View parent government-issued photo ID"
          }
          accessibilityState={{ disabled: isLoadingParentId }}
        >
          {isLoadingParentId ? (
            <ActivityIndicator color="#0D9488" />
          ) : parentIdLoadFailed ? (
            <RefreshCw size={20} color="#D97706" />
          ) : (
            <IdCard size={20} color="#0D9488" />
          )}
          <Text
            className={`ml-2 text-sm font-black ${
              parentIdLoadFailed ? "text-amber-700" : "text-teal-700"
            }`}
          >
            {isLoadingParentId
              ? "Loading Parent Government ID..."
              : parentIdLoadFailed
                ? "Retry Parent Government ID"
                : "View Parent Government ID"}
          </Text>
        </Pressable>
      )}

      {parent.hasIdDocument && !parentIdLoadFailed ? (
        <Text className="mt-3 text-xs font-semibold leading-5 text-gray-500">
          Open the stored government-issued photo ID and compare it with the
          physical government ID presented by the parent.
        </Text>
      ) : null}

      <Pressable
        onPress={() => onToggleVisualVerification(!isVisuallyVerified)}
        disabled={isCheckboxDisabled}
        className={`mt-4 flex-row items-center justify-center rounded-2xl border px-4 py-3 ${
          isVisuallyVerified
            ? "border-emerald-200 bg-emerald-50"
            : "border-gray-200 bg-white"
        }`}
        accessibilityRole="checkbox"
        accessibilityLabel="Confirm the parent and presented physical ID match the stored parent government-issued photo ID"
        accessibilityState={{
          checked: isVisuallyVerified,
          disabled: isCheckboxDisabled,
        }}
      >
        {isVisuallyVerified ? (
          <CheckCircle2 size={18} color="#059669" />
        ) : (
          <XCircle size={18} color="#6B7280" />
        )}
        <Text
          className={`ml-2 text-sm font-black ${
            isVisuallyVerified ? "text-emerald-700" : "text-gray-700"
          }`}
        >
          {isVisuallyVerified
            ? "Parent Government ID Match Confirmed"
            : hasViewedParentId
              ? "Confirm Parent Government ID Match"
              : "View Parent Government ID First"}
        </Text>
      </Pressable>
    </View>
  );
}

