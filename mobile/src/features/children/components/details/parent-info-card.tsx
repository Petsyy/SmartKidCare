import React from "react";
import { View, Text, Pressable } from "react-native";
import { User, Mail, Phone, ShieldCheck } from "lucide-react-native";
import { InfoRow } from "./info-row";
import type { Child } from "@/src/api/parent.api";

interface ParentInfoCardProps {
  child: Child;
  isOffline: boolean;
  isInactive: boolean;
  isLoadingCredentials?: boolean;
  isResettingPassword?: boolean;
  onViewCredentials: () => void;
  onResetPassword: () => void;
}

export function ParentInfoCard({
  child,
  isOffline,
  isInactive,
  isLoadingCredentials,
  isResettingPassword,
  onViewCredentials,
  onResetPassword,
}: ParentInfoCardProps) {
  if (!child.parent) {
    return (
      <View
        className="rounded-3xl bg-amber-50 p-5 border border-amber-200 mb-4"
        style={{
          shadowColor: "#F59E0B",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
            <User size={20} color="#D97706" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-amber-800">
              No Parent Linked
            </Text>
            <Text className="text-sm text-amber-700 mt-1">
              This child has not been linked to a parent account yet.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      className="rounded-3xl bg-white p-5 mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center mb-4 gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-sky-50">
          <User size={20} color="#0284C7" />
        </View>
        <Text className="text-xl font-bold text-gray-900">
          Parent Information
        </Text>
      </View>

      <View className="gap-1">
        <InfoRow
          icon={<User size={18} color="#0284C7" />}
          label="Name"
          value={`${child.parent.firstName} ${child.parent.lastName}`}
        />
        <InfoRow
          icon={<User size={18} color="#0284C7" />}
          label="Relationship"
          value={child.parentRelationship || "Not provided"}
        />
        <InfoRow
          icon={<Mail size={18} color="#0284C7" />}
          label="Email"
          value={child.parent.email}
        />
        {child.parent.phone && (
          <InfoRow
            icon={<Phone size={18} color="#0284C7" />}
            label="Contact Number"
            value={child.parent.phone}
          />
        )}
      </View>

      <View className="mt-4 flex-row gap-3">
        <Pressable
          onPress={onViewCredentials}
          disabled={isLoadingCredentials}
          accessibilityRole="button"
          accessibilityLabel={
            isOffline
              ? "View initial credentials unavailable offline"
              : "View initial credentials"
          }
          accessibilityState={{
            disabled: isOffline || isLoadingCredentials,
          }}
          className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${
            isOffline ? "bg-gray-100 opacity-60" : "bg-sky-50 active:bg-sky-100"
          }`}
        >
          <ShieldCheck
            size={20}
            color={isOffline ? "#9CA3AF" : "#0284C7"}
          />
          <Text
            className={`font-semibold text-center text-sm ${
              isOffline ? "text-gray-400" : "text-sky-700"
            }`}
          >
            {isLoadingCredentials
              ? "Loading..."
              : "View Initial Credentials"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onResetPassword}
          disabled={isInactive || isResettingPassword}
          accessibilityRole="button"
          accessibilityLabel={
            isOffline
              ? "Reset parent password unavailable offline"
              : "Reset parent password"
          }
          accessibilityState={{
            disabled: isInactive || isOffline || isResettingPassword,
          }}
          className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${
            isInactive || isOffline ? "bg-gray-100 opacity-60" : "bg-rose-50 active:bg-rose-100"
          }`}
        >
          <ShieldCheck
            size={20}
            color={isOffline ? "#9CA3AF" : "#E11D48"}
          />
          <Text
            className={`font-semibold text-center text-sm ${
              isOffline ? "text-gray-400" : "text-rose-700"
            }`}
          >
            {isResettingPassword ? "Resetting..." : "Reset Password"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
