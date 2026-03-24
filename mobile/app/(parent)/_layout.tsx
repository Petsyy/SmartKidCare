import { Tabs, Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import ParentGate from "@/src/components/parent-gate";
import { Ionicons } from "@expo/vector-icons";

export default function ParentLayout() {
  const { user, role, loading } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const tabBarHeight = 64 + bottomInset;

  if (!rootNavigationState?.key) {
    return null;
  }

  if (!loading && (!user || role !== "parent")) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
    <ParentGate>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0D9488",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarHideOnKeyboard: true,
        tabBarActiveBackgroundColor: "#F0FDFA",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          height: tabBarHeight,
          paddingTop: 12,
          paddingBottom: bottomInset + 8,
          paddingHorizontal: 12,
          elevation: 8,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          marginHorizontal: 6,
          marginVertical: 4,
          borderRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={focused ? 22 : 20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: "My Child",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              color={color}
              size={focused ? 22 : 20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              color={color}
              size={focused ? 22 : 20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-outline"}
              color={color}
              size={focused ? 22 : 20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="parent-view-record"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="parent-child-details"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
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
