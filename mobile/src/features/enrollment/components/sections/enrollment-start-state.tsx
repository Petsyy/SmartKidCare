import { Plus } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";


export function EnrollmentStartState({ onStart }: { onStart: () => void }) {
  return (
    <>
      <View
        className="mb-4 rounded-3xl border border-dashed border-teal-200 bg-teal-50 p-6"
        style={{
          shadowColor: "#0D9488",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View className="items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <Plus size={32} color="#0F766E" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            Start a New Enrollment
          </Text>
          <Text className="mt-3 text-center text-lg leading-7 text-gray-600">
            Create a child enrollment request for review and help families
            complete their registration.
          </Text>
          <Pressable
            onPress={onStart}
            className="mt-6 w-full rounded-2xl bg-teal-600 px-5 py-3.5 active:scale-95"
            style={{
              shadowColor: "#0D9488",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-center text-lg font-bold text-white">
              Start Enrollment
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="rounded-2xl border border-gray-200 bg-white p-5">
        <Text className="text-2xl font-bold text-gray-900">
          What You&apos;ll Need
        </Text>
        <Text className="mt-3 text-lg leading-7 text-gray-600">
          • Child&apos;s birth certificate (photo or scan)
        </Text>
        <Text className="text-lg leading-7 text-gray-600">
          • Parent or guardian valid ID / supporting residency document
        </Text>
        <Text className="text-lg leading-7 text-gray-600">
          • Parent contact details for account setup and follow-ups
        </Text>
        <Text className="mt-4 text-base leading-6 text-gray-500">
          Use this form when assisting a family with a new center enrollment
          request.
        </Text>
      </View>
    </>
  );
}

