import { Text, View } from "react-native";
import { Search, ShieldCheck } from "lucide-react-native";

interface PickupEmptyStateProps {
  searchQuery?: string;
}

export function PickupEmptyState({ searchQuery }: PickupEmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-16">
      {searchQuery ? (
        <>
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Search size={40} color="#9CA3AF" />
          </View>
          <Text className="mb-2 text-center text-2xl font-black text-gray-800">
            No Children Found
          </Text>
          <Text className="text-center text-lg font-bold leading-7 text-gray-500">
            No children match your search.{"\n"}
            Try a different search term.
          </Text>
        </>
      ) : (
        <>
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-teal-50">
            <ShieldCheck size={56} color="#14B8A6" />
          </View>
          <Text className="mb-2 text-center text-2xl font-black text-gray-800">
            All Clear
          </Text>
          <Text className="text-center text-lg font-bold leading-7 text-gray-500">
            All present children have been picked up{"\n"}
            or none are currently signed in.
          </Text>
        </>
      )}
    </View>
  );
}

