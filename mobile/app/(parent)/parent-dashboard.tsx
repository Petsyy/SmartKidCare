import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@/src/hooks/useAuth";

export default function ParentDashboard() {
    const { logout } = useAuth();

    return (
        <View className="flex-1 items-center justify-center">
            <Text className="text-xl font-semibold text-sky-600">Parent Dashboard</Text>

            <TouchableOpacity
                className="mt-4 rounded bg-red-500 px-4 py-2"
                onPress={logout}
            >
                <Text className="text-black">Log out</Text>
            </TouchableOpacity>
        </View>
    );
}