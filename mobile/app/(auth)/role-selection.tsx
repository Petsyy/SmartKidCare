import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Baby, Users, ChevronRight, ChevronLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelection() {
    const router = useRouter();

    const RoleCard = ({
        title,
        description,
        icon: Icon,
        colors,
        onPress,
    }: any) => (
        <Pressable
            onPress={onPress}
            className="w-full mb-5 rounded-3xl shadow-lg"
            style={({ pressed }) => [
                {
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    elevation: 4,
                },
            ]}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    borderRadius: 24,
                    paddingVertical: 22,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <View className="bg-white/25 p-3 rounded-2xl mr-4">
                    <Icon size={32} color="white" />
                </View>

                <View className="flex-1">
                    <Text className="text-white text-lg font-bold">
                        {title}
                    </Text>
                    <Text className="text-white/80 text-sm mt-1 leading-5">
                        {description}
                    </Text>
                </View>

                <ChevronRight size={20} color="white" opacity={0.7} />
            </LinearGradient>
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Back Button - Top Left */}
            <View className="px-6 pt-4">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center shadow-md"
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                    <ChevronLeft size={20} color="#16a34a" />
                </Pressable>
            </View>

            <View className="flex-1 items-center justify-center px-6">
                {/* Header */}
                <View className="items-center mb-10">
                    <View className="bg-green-100 p-4 rounded-full mb-4">
                        <Baby size={42} color="#16a34a" />
                    </View>

                    <Text className="text-3xl font-extrabold text-gray-900">
                        SmartKidCare
                    </Text>

                    <Text className="text-gray-500 text-sm mt-2 text-center">
                        Choose your account type to continue
                    </Text>
                </View>

                {/* Role Cards */}
                <RoleCard
                    title="I am a Parent"
                    description="Monitor your child’s progress and stay connected with caregivers."
                    icon={Baby}
                    colors={["#16a34a", "#22c55e"]}
                    onPress={() => router.push("/(auth)/parent-registration")}
                />

                <RoleCard
                    title="I am a Worker"
                    description="Manage daily tasks, logs, and communicate with parents."
                    icon={Users}
                    colors={["#0284c7", "#38bdf8"]}
                    onPress={() => router.push("/(auth)/worker-registration")}
                />

            </View>
        </SafeAreaView>
    );
}
