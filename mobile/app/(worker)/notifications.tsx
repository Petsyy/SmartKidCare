import { View, Text, ScrollView } from "react-native";

export default function NotificationsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 pt-16 pb-6 px-6">
      <Text className="text-3xl font-bold text-gray-800">Notifications</Text>
      <Text className="text-base text-gray-500 mt-2">Your notifications appear here</Text>
    </ScrollView>
  );
}
