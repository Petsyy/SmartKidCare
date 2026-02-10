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
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-white">Notifications</Text>
            <Text className="text-lg text-teal-100 mt-1">
              Your notifications appear here
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: 24,
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl text-gray-500 text-center">
          No notifications yet.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
