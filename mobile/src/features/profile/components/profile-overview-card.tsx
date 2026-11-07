import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ProfileRole } from "../hooks/useProfileScreen";

interface ProfileOverviewCardProps {
  role: ProfileRole;
  roleLabel: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  showAssignedCenter?: boolean;
  employeeId?: string;
}

export function ProfileOverviewCard({
  role,
  roleLabel,
  fullName,
  firstName,
  lastName,
  isActive,
  showAssignedCenter,
  employeeId,
}: ProfileOverviewCardProps) {
  return (
    <LinearGradient
      colors={
        role === "teacher"
          ? ["#134E4A", "#0F766E", "#047857"]
          : ["#115E59", "#0F766E", "#059669"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24 }}
      className="mx-5 mt-5 overflow-hidden rounded-3xl p-6 shadow-lg"
    >
      <View className="flex-row items-center">
        <View className="h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-white/40 bg-white">
          <Text className="text-3xl font-bold text-teal-700">
            {firstName?.[0]}
            {lastName?.[0]}
          </Text>
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-teal-100">
            Account overview
          </Text>
          <Text className="mt-1 text-2xl font-bold text-white">
            {fullName || "Your profile"}
          </Text>
          <Text className="mt-1 text-sm text-teal-100">{roleLabel}</Text>
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between border-t border-white/20 pt-4">
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-emerald-300" />
          <Text className="ml-2 text-sm font-medium text-white">
            {isActive === false ? "Inactive account" : "Active account"}
          </Text>
        </View>
        {showAssignedCenter && employeeId ? (
          <Text className="text-xs font-medium text-teal-100">
            ID {employeeId}
          </Text>
        ) : null}
      </View>
    </LinearGradient>
  );
}

