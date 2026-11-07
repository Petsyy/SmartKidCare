import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { ScreenShell } from "@/src/components/ui";

export interface TeacherDashboardErrorStateProps {
  hero: React.ReactNode;
  error: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export function TeacherDashboardErrorState({
  hero,
  error,
  refreshing,
  onRefresh,
}: TeacherDashboardErrorStateProps) {
  return (
    <ScreenShell withKeyboardAvoiding={false}>
      {hero}
      <View className="-mt-6 flex-1 items-center justify-center rounded-t-3xl bg-gray-50 px-6">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
          <AlertCircle size={40} color="#DC2626" />
        </View>
        <Text
          className="mt-5 text-center text-2xl font-extrabold text-gray-900"
          accessibilityRole="header"
        >
          Couldn&apos;t load your dashboard
        </Text>
        <Text className="mt-2 max-w-sm text-center text-base leading-6 text-gray-600">
          {error} Check your connection, then try again.
        </Text>
        <Pressable
          onPress={onRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel={
            refreshing ? "Retrying dashboard" : "Retry loading dashboard"
          }
          accessibilityState={{ disabled: refreshing, busy: refreshing }}
          className={`mt-6 min-h-12 flex-row items-center justify-center rounded-2xl px-6 py-3 ${
            refreshing ? "bg-teal-400" : "bg-teal-700 active:opacity-90"
          }`}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <RefreshCw size={18} color="#FFFFFF" />
          )}
          <Text className="ml-2 text-base font-bold text-white">
            {refreshing ? "Retrying..." : "Try Again"}
          </Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}
