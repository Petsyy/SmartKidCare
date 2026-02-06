import { Tabs, Redirect } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { Home, Users, Bell, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ParentGate from "@/src/components/ParentGate";

export default function ParentLayout() {
  const { user, role, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) return null;
  if (!user || role !== "parent") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ParentGate>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#14B8A6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          height: 45 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: "Children",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="parent-view-record"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </ParentGate>
  );
}
