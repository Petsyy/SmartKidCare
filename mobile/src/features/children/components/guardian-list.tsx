import { ActivityIndicator, Text, View } from "react-native";
import { Phone, ShieldCheck, UserRound } from "lucide-react-native";
import { useGuardians } from "../hooks/useGuardian";

interface GuardianListProps {
  childId: string;
  readOnly?: boolean;
  hideAddButton?: boolean;
}

export function GuardianList({ childId }: GuardianListProps) {
  const { guardians, isLoading } = useGuardians(childId);
  const activeGuardians = guardians.filter(
    (guardian) => guardian.isActive !== false,
  );

  if (isLoading) {
    return (
      <View className="items-center justify-center py-6">
        <ActivityIndicator size="small" color="#0D9488" />
        <Text className="mt-2 text-xs text-gray-400">
          Loading authorized persons...
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-1">
      <View className="mb-4 flex-row items-center">
        <View className="mr-3 h-3 w-3 rounded-full bg-teal-500" />
        <Text className="text-sm font-bold uppercase tracking-wider text-gray-600">
          {activeGuardians.length}/5 Guardians Configured
        </Text>
      </View>

      {activeGuardians.length === 0 ? (
        <View className="items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8">
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <ShieldCheck size={24} color="#9CA3AF" />
          </View>
          <Text className="text-sm font-bold text-gray-700">
            No Guardians Configured
          </Text>
          <Text className="mt-1 text-center text-xs text-gray-400">
            No guardians have been authorized for pickup.
          </Text>
        </View>
      ) : (
        activeGuardians.map((guardian, index) => {
          const relationship =
            guardian.relationship === "Other" && guardian.customRelationship
              ? guardian.customRelationship
              : guardian.relationship;
          return (
            <View
              key={guardian._id || index}
              className="mb-3 flex-row rounded-2xl border border-gray-100 bg-white p-4"
            >
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-teal-50">
                <UserRound size={22} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900">
                  {[guardian.firstName, guardian.middleName, guardian.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
                <Text className="mt-0.5 text-sm text-gray-500">
                  {relationship}
                </Text>
                <View className="mt-2 flex-row items-center">
                  <Phone size={14} color="#6B7280" />
                  <Text className="ml-2 text-sm text-gray-700">
                    {guardian.phone}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
