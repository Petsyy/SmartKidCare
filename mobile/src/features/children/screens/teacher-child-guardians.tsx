import { View, Text, StatusBar, Pressable } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ShieldCheck } from "lucide-react-native";
import { TEACHER_HEADER_GRADIENT } from "@/src/components/ui";
import { GuardianList } from "@/src/features/children/components/guardian-list";

export default function TeacherChildGuardiansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { childId } = useLocalSearchParams();

  if (!childId || typeof childId !== "string") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text>Child ID is missing</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-teal-600 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* HEADER */}
      <LinearGradient
        colors={TEACHER_HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12 }}
        className="px-5 pb-6"
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3"
          >
            <ChevronLeft size={22} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-2xl font-extrabold text-white"
              numberOfLines={1}
            >
              Authorized Guardians
            </Text>
            <Text className="text-base text-teal-100 mt-0.5">
              Pickup verification
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-1 px-5 pt-6">
        <View className="mb-6 flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100">
            <ShieldCheck size={28} color="#0D9488" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              Approved Contacts
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5 leading-5">
              Only these individuals are authorized by the parent to pick up the
              child.
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <GuardianList childId={childId} readOnly={true} />
        </View>
      </View>
    </SafeAreaView>
  );
}
