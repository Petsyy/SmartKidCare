import { UserPlus, FileText, CheckCircle2, Info } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function EnrollmentStartState({ onStart }: { onStart: () => void }) {
  return (
    <View className="gap-5">
      {/* Hero Section */}
      <View
        className="rounded-3xl bg-white p-8 items-center border border-gray-100"
        style={{
          shadowColor: "#0D9488",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 5,
        }}
      >
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-teal-50 border-4 border-teal-100/50">
          <UserPlus size={36} color="#0D9488" />
        </View>
        <Text className="text-3xl font-black text-gray-900 text-center mb-3 tracking-tight">
          Direct Enrollment
        </Text>
        <Text className="text-center text-base leading-6 text-gray-500 mb-8 px-2 font-medium">
          Enroll a child directly into your center. This will immediately create their profile and allow you to track their progress and care.
        </Text>
        <Pressable
          onPress={onStart}
          className="w-full rounded-2xl bg-teal-600 py-4 active:scale-[0.98] flex-row items-center justify-center"
          style={{
            shadowColor: "#0D9488",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-center text-lg font-extrabold text-white tracking-wide">
            Start Enrollment
          </Text>
        </Pressable>
      </View>

      {/* Requirements Section */}
      <View className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <View className="flex-row items-center mb-5 pb-4 border-b border-gray-100">
          <View className="h-10 w-10 bg-amber-50 rounded-xl items-center justify-center mr-3 border border-amber-100">
            <FileText size={20} color="#D97706" />
          </View>
          <Text className="text-xl font-bold text-gray-900">
            Required Information
          </Text>
        </View>

        <View className="gap-4">
          <RequirementRow text="Child's basic details and physical measurements (Height, Weight)" />
          <RequirementRow text="Child's birth certificate (photo or scan)" />
          <RequirementRow text="Parent or guardian's valid ID (photo or scan)" />
          <RequirementRow text="Parent's contact details for active communication" />
        </View>

        <View className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-4 flex-row items-start">
          <Info size={20} color="#2563EB" className="mt-0.5 shrink-0" />
          <Text className="ml-3 flex-1 text-sm leading-5 text-blue-900 font-semibold">
            Make sure you have all documents ready. You can take photos of the physical documents directly during the process.
          </Text>
        </View>
      </View>
    </View>
  );
}

function RequirementRow({ text }: { text: string }) {
  return (
    <View className="flex-row items-start">
      <View className="mt-0.5 mr-3 shrink-0">
        <CheckCircle2 size={20} color="#059669" />
      </View>
      <Text className="text-base leading-6 text-gray-700 font-semibold flex-1">
        {text}
      </Text>
    </View>
  );
}

