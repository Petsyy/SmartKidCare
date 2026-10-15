import React from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { Award, TrendingUp, ShieldCheck, Edit3, Archive, ArchiveRestore } from "lucide-react-native";

interface ChildQuickActionsProps {
  childId: string;
  isInactive: boolean;
  isOffline: boolean;
  isUpdatingStatus: boolean;
  onEvaluate: () => void;
  onOpenHistory: () => void;
  onOpenGuardians: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

export function ChildQuickActions({
  isInactive,
  isOffline,
  isUpdatingStatus,
  onEvaluate,
  onOpenHistory,
  onOpenGuardians,
  onEdit,
  onArchive,
  onRestore,
}: ChildQuickActionsProps) {
  const showOfflineActionMessage = (actionName: string) =>
    Alert.alert("Connection required", `Connect to the internet to ${actionName}.`);

  return (
    <View className="flex-row justify-between mb-4 gap-3">
      {/* Evaluate */}
      <Pressable
        accessibilityRole="button"
        disabled={isInactive}
        onPress={onEvaluate}
        className={`flex-1 items-center justify-center rounded-3xl py-4 ${
          isInactive ? "bg-gray-100 opacity-60" : "bg-white active:bg-gray-50"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 mb-2">
          <Award size={24} color="#0D9488" />
        </View>
        <Text className="text-xs font-bold text-gray-700 text-center">
          {isInactive ? "Read only" : "Evaluate"}
        </Text>
      </Pressable>

      {/* History */}
      <Pressable
        onPress={onOpenHistory}
        className="flex-1 items-center justify-center bg-white rounded-3xl py-4 active:bg-gray-50"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 mb-2">
          <TrendingUp size={24} color="#047857" />
        </View>
        <Text className="text-xs font-bold text-gray-700 text-center">
          History
        </Text>
      </Pressable>

      {/* Guardians */}
      <Pressable
        onPress={onOpenGuardians}
        className="flex-1 items-center justify-center bg-white rounded-3xl py-4 active:bg-gray-50"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 mb-2">
          <ShieldCheck size={24} color="#0284C7" />
        </View>
        <Text className="text-xs font-bold text-gray-700 text-center">
          Guardians
        </Text>
      </Pressable>

      {/* Edit */}
      <Pressable
        accessibilityRole="button"
        disabled={isInactive || isOffline}
        onPress={() => {
          if (isOffline) {
            showOfflineActionMessage("update child information");
            return;
          }
          onEdit();
        }}
        accessibilityLabel={
          isOffline
            ? "Edit child unavailable offline"
            : "Edit child information"
        }
        accessibilityState={{ disabled: isInactive || isOffline }}
        className={`flex-1 items-center justify-center rounded-3xl py-4 ${
          isInactive || isOffline ? "bg-gray-100 opacity-60" : "bg-white active:bg-gray-50"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 mb-2">
          <Edit3 size={24} color={isOffline ? "#9CA3AF" : "#4F46E5"} />
        </View>
        <Text
          className={`text-xs font-bold text-center ${isOffline ? "text-gray-400" : "text-gray-700"}`}
        >
          Edit
        </Text>
      </Pressable>

      {/* Archive / Restore */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isInactive ? "Unarchive child" : "Archive child"
        }
        disabled={isUpdatingStatus}
        onPress={() => {
          if (isOffline) {
            showOfflineActionMessage("change the child’s status");
            return;
          }
          if (!isInactive) {
            onArchive();
            return;
          }
          Alert.alert(
            "Restore Child",
            "Restore this child to the active children list?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Restore", onPress: onRestore },
            ],
          );
        }}
        accessibilityState={{ disabled: isOffline || isUpdatingStatus }}
        className={`flex-1 items-center justify-center rounded-3xl py-4 ${
          isOffline
            ? "bg-gray-100 opacity-60"
            : "bg-white active:bg-gray-50"
        } ${isUpdatingStatus && !isOffline ? "opacity-60" : ""}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View
          className={`h-12 w-12 items-center justify-center rounded-2xl mb-2 ${
            isOffline
              ? "bg-gray-200"
              : isInactive
                ? "bg-emerald-50"
                : "bg-rose-50"
          }`}
        >
          {isUpdatingStatus ? (
            <ActivityIndicator color={isInactive ? "#047857" : "#E11D48"} />
          ) : isInactive ? (
            <ArchiveRestore
              size={24}
              color={isOffline ? "#9CA3AF" : "#047857"}
            />
          ) : (
            <Archive size={24} color={isOffline ? "#9CA3AF" : "#E11D48"} />
          )}
        </View>
        <Text
          className={`text-xs font-bold text-center ${isOffline ? "text-gray-400" : "text-gray-700"}`}
        >
          {isUpdatingStatus
            ? isInactive
              ? "Restoring..."
              : "Archiving..."
            : isInactive
              ? "Unarchive"
              : "Archive"}
        </Text>
      </Pressable>
    </View>
  );
}
