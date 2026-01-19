import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Baby, Users, ChevronRight } from "lucide-react-native";

export default function RoleSelection() {
    const router = useRouter();

    const RoleButton = ({ title, description, icon: Icon, colorClass, onPress }: any) => (
        <Pressable
            onPress={onPress}
            className={`w-[85%] mt-6 p-5 rounded-2xl flex-row items-center border border-gray-100 shadow-sm ${colorClass}`}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, elevation: 2 }]}
        >
            <View className="bg-white/20 p-3 rounded-xl mr-4">
                <Icon size={32} color="white" />
            </View>

            <View className="flex-1">
                <Text className="text-white text-lg font-bold">{title}</Text>
                <Text className="text-white/80 text-xs leading-4 mt-1">
                    {description}
                </Text>
            </View>

            <ChevronRight size={20} color="white" opacity={0.6} />
        </Pressable>
    );

    return (
        <View className="flex-1 bg-gray-50 items-center justify-center px-4">
            {/* Header Section */}
            <View className="items-center mb-8">
                <View className="bg-green-100 p-3 rounded-full mb-3">
                    <Baby size={40} color="#16a34a" />
                </View>
                <Text className="text-3xl font-extrabold text-gray-900">SmartKidCare</Text>
                <Text className="text-gray-500 text-base mt-1">Choose your account type</Text>
            </View>

            {/* Buttons */}
            <RoleButton
                title="I am a Parent"
                description="Monitor your child's progress and stay connected with caregivers."
                icon={Baby}
                colorClass="bg-green-600"
                onPress={() => router.push("/(auth)/parent-registration")}
            />

            <RoleButton
                title="I am a Worker"
                description="Manage your daily tasks, logs, and communicate with parents."
                icon={Users}
                colorClass="bg-sky-600"
                onPress={() => router.push("/(auth)/worker-registration")}
            />

            <View className="mt-12">
                <Pressable onPress={() => router.back()}>
                    <Text className="text-green-400 font-medium">Go Back</Text>
                </Pressable>
            </View>
        </View>
    );
}