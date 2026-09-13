import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { X, ShieldCheck, Edit2, Trash2, Phone, UserRound, IdCard } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGuardians } from "../hooks/useGuardian";
import type { Guardian } from "@/src/api/api.types";

interface ViewGuardiansBottomSheetProps {
  childId: string | null;
  childName: string;
  visible: boolean;
  onClose: () => void;
  onEditGuardian?: (guardian: Guardian, index: number) => void;
}

export function ViewGuardiansBottomSheet({
  childId,
  childName,
  visible,
  onClose,
  onEditGuardian,
}: ViewGuardiansBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const {
    guardians,
    isLoading,
    removeGuardian,
  } = useGuardians(childId || undefined);

  const activeGuardians = guardians.filter(
    (guardian) =>
      guardian.isActive !== false &&
      guardian.firstName?.trim() &&
      guardian.lastName?.trim() &&
      guardian.phone?.trim() &&
      guardian.relationship,
  );

  const handleRemove = (index: number, name: string) => {
    Alert.alert(
      "Remove Guardian",
      `Are you sure you want to remove ${name} from authorized pickup persons?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeGuardian(index),
        },
      ],
    );
  };

  if (!childId) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <Pressable className="flex-1" onPress={onClose} />
          
          <View
            className="bg-gray-50 rounded-t-3xl pt-5 shadow-lg"
            style={{ maxHeight: "85%", paddingBottom: Math.max(insets.bottom, 20) }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-2 border-b border-gray-200/60 pb-3 px-5">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="h-10 w-10 rounded-xl bg-teal-100 items-center justify-center mr-3">
                  <ShieldCheck size={20} color="#0D9488" />
                </View>
                <View>
                  <Text className="text-lg font-black text-gray-900">
                    Authorized Guardians
                  </Text>
                  <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
                    {activeGuardians.length}/5 Configured • {childName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                className="h-8 w-8 rounded-full bg-gray-200/80 items-center justify-center active:opacity-85"
              >
                <X size={18} color="#4B5563" />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 }}
            >
              {isLoading ? (
                <View className="py-10 items-center justify-center">
                  <ActivityIndicator size="small" color="#0D9488" />
                  <Text className="text-gray-400 text-xs mt-2">Loading guardians...</Text>
                </View>
              ) : activeGuardians.length === 0 ? (
                <View className="py-10 items-center justify-center">
                  <View className="h-16 w-16 rounded-2xl bg-amber-50 items-center justify-center mb-3">
                    <ShieldCheck size={28} color="#D97706" />
                  </View>
                  <Text className="text-base font-bold text-gray-700 mb-1">No Guardians Yet</Text>
                  <Text className="text-sm text-gray-500 text-center px-6">
                    Swipe a child card on the list to add an authorized guardian.
                  </Text>
                </View>
              ) : (
                activeGuardians.map((guardian) => {
                  const originalIndex = guardians.findIndex((g) => g === guardian);
                  const displayRelationship = guardian.relationship === "Other" && guardian.customRelationship
                    ? guardian.customRelationship
                    : guardian.relationship;

                  return (
                    <View
                      key={guardian._id || originalIndex}
                      className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden"
                    >
                      {/* Guardian Main Info */}
                      <View className="p-4">
                        <View className="flex-row">
                          {/* Photo Column */}
                          <View className="mr-3">
                            {guardian.photoUrl ? (
                              <Image
                                source={{ uri: guardian.photoUrl }}
                                className="h-12 w-12 rounded-full border border-gray-200 bg-gray-100 mt-1"
                                resizeMode="cover"
                              />
                            ) : (
                              <View className="h-12 w-12 rounded-full bg-gray-100 items-center justify-center border border-gray-200 mt-1">
                                <UserRound size={24} color="#9CA3AF" />
                              </View>
                            )}
                          </View>

                          {/* Info Column */}
                          <View className="flex-1">
                            {/* Name & Actions */}
                            <View className="flex-row items-start justify-between">
                              <Text className="text-lg font-bold text-gray-900 flex-1 mr-2 mt-1">
                                {guardian.firstName} {guardian.lastName}
                              </Text>
                              
                              <View className="flex-row gap-1">
                                {onEditGuardian && (
                                  <Pressable
                                    onPress={() => onEditGuardian(guardian, originalIndex)}
                                    className="p-2 rounded-full active:bg-gray-100"
                                  >
                                    <Edit2 size={18} color="#4B5563" />
                                  </Pressable>
                                )}
                                <Pressable
                                  onPress={() =>
                                    handleRemove(
                                      originalIndex,
                                      `${guardian.firstName} ${guardian.lastName}`
                                    )
                                  }
                                  className="p-2 rounded-full active:bg-red-50"
                                >
                                  <Trash2 size={18} color="#EF4444" />
                                </Pressable>
                              </View>
                            </View>

                            {/* Relationship */}
                            <Text className="text-sm text-gray-500 font-medium mb-1.5 -mt-1">
                              {displayRelationship}
                            </Text>
                            
                            {/* Phone */}
                            <View className="flex-row items-center">
                              <Phone size={14} color="#6B7280" />
                              <Text className="text-sm text-gray-700 font-medium ml-2">
                                {guardian.phone}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* ID Photo Section */}
                      {guardian.idUrl && (
                        <View className="border-t border-gray-100 px-4 py-4 bg-gray-50/50">
                          <View className="flex-row items-center mb-3">
                            <IdCard size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 ml-2 uppercase tracking-wider">
                              ID Document
                            </Text>
                          </View>
                          <View className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                            <Image
                              source={{ uri: guardian.idUrl }}
                              className="h-32 w-full"
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
