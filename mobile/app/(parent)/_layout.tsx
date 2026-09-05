import { Tabs, Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import ParentGate from "@/src/components/ui/parent-gate";
import { ParentLoadingState } from "@/src/components/ui";
import {
  Bell,
  House,
  UserRound,
  Users,
  ShieldCheck,
} from "lucide-react-native";
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
          name="pickup"
          options={{
            title: "Pickup",
            tabBarIcon: ({ color, focused }) => (
              <ShieldCheck
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
          name="competencies/[childId]"
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
      {loading ? (
        <View
          pointerEvents="auto"
          style={[StyleSheet.absoluteFillObject, { zIndex: 100 }]}
          className="bg-gray-50"
        >
          <ParentLoadingState
            title="Loading your account"
            message="Getting your parent experience ready."
          />
        </View>
      ) : null}
    </>
  );
}
