import { View, Text, ScrollView, StatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <Text className="text-3xl font-extrabold text-white">
          Notifications
        </Text>
        <Text className="text-lg text-teal-100 mt-1">
          Your notifications appear here
        </Text>
      </View>

      {/* Notifications coming soon */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-2xl">No notifications yet</Text>
      </View>
    </SafeAreaView>
  );
}
