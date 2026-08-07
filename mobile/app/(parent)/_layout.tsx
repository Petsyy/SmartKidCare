import { Tabs, Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import ParentGate from "@/src/components/ui/parent-gate";
import { Bell, House, UserRound, Users } from "lucide-react-native";
import { getTabBarScreenOptions } from "@/src/config/tab-bar";

export default function ParentLayout() {
  const { user, role, loading } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  if (!rootNavigationState?.key) {
    return null;
  }

  if (!loading && (!user || role !== "parent")) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <ParentGate>
        <Tabs screenOptions={getTabBarScreenOptions(bottomInset)}>
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }) => (
                <House
                  color={color}
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.4 : 2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="children"
            options={{
              title: "My Child",
              tabBarIcon: ({ color, focused }) => (
                <Users
                  color={color}
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.4 : 2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: "Notifications",
              tabBarIcon: ({ color, focused }) => (
                <Bell
                  color={color}
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.4 : 2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, focused }) => (
                <UserRound
                  color={color}
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.4 : 2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{ href: null, tabBarStyle: { display: "none" } }}
          />
          <Tabs.Screen
            name="parent-view-record"
            options={{ href: null, tabBarStyle: { display: "none" } }}
          />
          <Tabs.Screen
            name="parent-child-details"
            options={{ href: null, tabBarStyle: { display: "none" } }}
          />
        </Tabs>
      </ParentGate>
      {loading ? (
        <View
          pointerEvents="auto"
          style={[StyleSheet.absoluteFillObject, { zIndex: 100 }]}
          className="items-center justify-center bg-white"
        >
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </>
  );
}
