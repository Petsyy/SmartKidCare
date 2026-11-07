import { Image, Pressable, Text, View } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import type { Guardian } from "@/src/api/api.types";

interface PickupGuardianIdCardProps {
  guardian: Guardian;
  isVisuallyVerified: boolean;
  onViewImage: (image: {
    url: string;
    title: string;
    kind: "guardian";
  }) => void;
  onToggleVisualVerification: (value: boolean) => void;
}

export function PickupGuardianIdCard({
  guardian,
  isVisuallyVerified,
  onViewImage,
  onToggleVisualVerification,
}: PickupGuardianIdCardProps) {
  return (
    <View className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <Text className="mb-3 text-sm font-black text-gray-800">
        Guardian Verification Documents
      </Text>

      {guardian.idUrl ? (
        <View>
          <Text className="mb-2 text-xs font-bold text-gray-500">
            Guardian Government-Issued Photo ID
          </Text>
          <Pressable
            onPress={() =>
              onViewImage({
                url: guardian.idUrl!,
                title: "Guardian ID",
                kind: "guardian",
              })
            }
          >
            <Image
              source={{ uri: guardian.idUrl }}
              className="h-28 w-full rounded-2xl"
              resizeMode="cover"
            />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => onToggleVisualVerification(!isVisuallyVerified)}
        className={`mt-4 flex-row items-center justify-center rounded-2xl border px-4 py-3 ${
          isVisuallyVerified
            ? "border-emerald-200 bg-emerald-50"
            : "border-gray-200 bg-white"
        }`}
        accessibilityRole="button"
        accessibilityLabel="Confirm visual verification against the stored guardian ID"
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
            ? "Visual Match Confirmed"
            : "Confirm Visual Match"}
        </Text>
      </Pressable>
    </View>
  );
}

