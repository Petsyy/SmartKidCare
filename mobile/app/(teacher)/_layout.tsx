import { Tabs, Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { House, UserPlus, UserRound, Users } from "lucide-react-native";
import { getTabBarScreenOptions, getTabBarStyle } from "@/src/config/tab-bar";

export default function TeacherLayout() {
  const { user, role, loading } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  if (!rootNavigationState?.key) {
    return null;
  }

  if (!loading && (!user || role !== "teacher")) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
    <Tabs screenOptions={getTabBarScreenOptions(bottomInset)}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <House color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: "Children",
          tabBarIcon: ({ color, focused }) => (
            <Users color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="enroll"
        options={({ route }: any) => ({
          title: "Enroll",
          tabBarStyle: route.params?.hideTabBar
            ? { display: "none" as const }
            : getTabBarStyle(bottomInset),
          tabBarIcon: ({ color, focused }) => (
            <UserPlus color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.4 : 2} />
          ),
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <UserRound color={color} size={focused ? 22 : 20} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen name="teacher-record-data" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="child-details" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
    {loading ? (
      <View pointerEvents="auto" style={[StyleSheet.absoluteFillObject, { zIndex: 100 }]} className="items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    ) : null}
    </>
  );
}
