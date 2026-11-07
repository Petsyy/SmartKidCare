import { Pressable, Text, View } from "react-native";
import { UsersRound } from "lucide-react-native";
import type { EditChildFormValues } from "../../validations/edit-child-validation";

interface EditChildParentSectionProps {
  watchParentRelationship: string;
  onSelectRelationship: (
    relationship: EditChildFormValues["parentRelationship"],
  ) => void;
}

const RELATIONSHIP_OPTIONS: EditChildFormValues["parentRelationship"][] = [
  "Mother",
  "Father",
  "Guardian",
  "Grandparent",
  "Other",
];

export function EditChildParentSection({
  watchParentRelationship,
  onSelectRelationship,
}: EditChildParentSectionProps) {
  return (
    <View className="mt-5 rounded-3xl border border-gray-200 bg-white p-5">
      <View className="mb-5 flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-sky-50">
          <UsersRound size={21} color="#0284C7" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-black text-gray-900">
            Parent Information
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            Primary relationship to the child
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <Text className="mb-2 text-sm font-semibold text-gray-700">
          Parent Relationship *
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {RELATIONSHIP_OPTIONS.map((rel) => {
            const isSelected = watchParentRelationship === rel;
            return (
              <Pressable
                key={rel}
                accessibilityRole="radio"
                accessibilityLabel={rel}
                accessibilityState={{ checked: isSelected }}
                onPress={() => onSelectRelationship(rel)}
                className={`min-h-11 justify-center rounded-xl border px-4 py-2.5 active:opacity-90 ${
                  isSelected
                    ? "border-teal-600 bg-teal-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    isSelected ? "text-teal-700" : "text-gray-600"
                  }`}
                >
                  {rel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

