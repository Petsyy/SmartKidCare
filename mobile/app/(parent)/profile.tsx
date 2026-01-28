import { View, Text, ScrollView, Touchable, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthContext } from "../../src/context/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    router.push("/(auth)/login");
  }
  return (
    <View className="flex-1 bg-gray-50 pt-16 pb-6 px-6">
      <Text className="text-3xl font-bold text-gray-800">Profile</Text>
      <Text className="text-base text-gray-500 mt-2">Your profile information</Text>

      <View className="flex-1 justify-center items-center">
        <TouchableOpacity
          className=" bg-white rounded-lg p-4 shadow"
          onPress={handleLogout}
        >
          <Text className="text-red-600 font-semibold text-lg">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
