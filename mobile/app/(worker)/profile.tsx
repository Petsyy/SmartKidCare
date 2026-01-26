import { View, Text, ScrollView } from "react-native";

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 pt-16 pb-6 px-6">
      <Text className="text-3xl font-bold text-gray-800">Profile</Text>
      <Text className="text-base text-gray-500 mt-2">Your profile information</Text>
    </ScrollView>
  );
}
