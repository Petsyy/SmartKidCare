import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  XCircle,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  holder: "parent" | "guardian";
};

export function GovernmentPhotoIdGuidance({ holder }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const holderLabel = holder === "parent" ? "parent" : "guardian";

  return (
    <View className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
      <View className="flex-row items-start">
        <Info size={18} color="#2563EB" />
        <View className="ml-2 flex-1">
          <Text className="text-sm font-bold text-blue-900">
            Government-issued photo ID
          </Text>
          <Text className="mt-1 text-xs leading-5 text-blue-800">
            Present the original ID. The {holderLabel}&apos;s name and photo
            must be clearly visible.
          </Text>
        </View>
      </View>

      {isExpanded ? (
        <View className="mt-3 gap-3 border-t border-blue-200 pt-3">
          <View className="flex-row items-start">
            <CheckCircle2 size={16} color="#059669" />
            <View className="ml-2 flex-1">
              <Text className="text-xs font-bold text-gray-800">Accepted</Text>
              <Text className="mt-0.5 text-xs leading-5 text-gray-600">
                National ID/ePhilID, Digital National ID, Philippine passport,
                LTO driver&apos;s license or card student permit, UMID/SSS/GSIS,
                PRC ID, valid Postal ID, Senior Citizen ID, or PWD ID.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <XCircle size={16} color="#DC2626" />
            <View className="ml-2 flex-1">
              <Text className="text-xs font-bold text-gray-800">
                Not accepted
              </Text>
              <Text className="mt-0.5 text-xs leading-5 text-gray-600">
                Employee or school IDs, cedulas, barangay certificates,
                bank/membership cards, or documents without the holder&apos;s
                photo.
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => setIsExpanded((value) => !value)}
        className="mt-2 min-h-11 flex-row items-center justify-center rounded-lg active:bg-blue-100"
        accessibilityRole="button"
        accessibilityLabel={
          isExpanded ? "Hide accepted ID guidance" : "View accepted IDs"
        }
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text className="mr-1 text-sm font-bold text-blue-700">
          {isExpanded ? "Show less" : "View accepted IDs"}
        </Text>
        {isExpanded ? (
          <ChevronUp size={17} color="#1D4ED8" />
        ) : (
          <ChevronDown size={17} color="#1D4ED8" />
        )}
      </Pressable>
    </View>
  );
}
