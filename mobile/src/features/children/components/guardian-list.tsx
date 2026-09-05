import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import {
  UserPlus,
  Edit2,
  Trash2,
  X,
  Check,
  ShieldCheck,
  Phone,
  UserCheck,
} from "lucide-react-native";
import { useGuardians } from "../hooks/useGuardian";
import type { Guardian } from "@/src/api/api.types";

interface GuardianListProps {
  childId: string;
  readOnly?: boolean;
}

export function GuardianList({ childId, readOnly = false }: GuardianListProps) {
  const {
    guardians,
    isLoading,
    isAdding,
    setIsAdding,
    editingIndex,
    setEditingIndex,
    addGuardian,
    updateGuardian,
    removeGuardian,
    isMutating,
  } = useGuardians(childId);

  const [formData, setFormData] = useState<Partial<Guardian>>({
    firstName: "",
    lastName: "",
    relationship: "Guardian",
    customRelationship: null,
    phone: "",
  });

  const activeGuardians = guardians.filter((g) => g.isActive !== false);

  const handleSave = async () => {
    try {
      if (
        !formData.firstName?.trim() ||
        !formData.lastName?.trim() ||
        !formData.phone?.trim()
      ) {
        Alert.alert(
          "Required Fields",
          "Please provide a first name, last name, and contact phone number.",
        );
        return;
      }

      if (
        formData.relationship === "Other" &&
        !formData.customRelationship?.trim()
      ) {
        Alert.alert(
          "Required Field",
          "Please specify the relationship when selecting 'Other'.",
        );
        return;
      }

      if (editingIndex !== null) {
        await updateGuardian({ index: editingIndex, data: formData });
      } else {
        await addGuardian(formData as Guardian);
      }
      resetForm();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save guardian.");
    }
  };

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

  const resetForm = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setFormData({
      firstName: "",
      lastName: "",
      relationship: "Guardian",
      customRelationship: null,
      phone: "",
    });
  };

  const startEdit = (guardian: Guardian, index: number) => {
    setFormData(guardian);
    setEditingIndex(index);
    setIsAdding(false);
  };

  if (isLoading) {
    return (
      <View className="py-6 items-center justify-center">
        <ActivityIndicator size="small" color="#0D9488" />
        <Text className="text-gray-400 text-xs mt-2">
          Loading authorized persons...
        </Text>
      </View>
    );
  }

  const isFormOpen = isAdding || editingIndex !== null;

  return (
    <View className="mt-1">
      {!isFormOpen && (
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="h-3 w-3 rounded-full bg-teal-500 mr-3" />
            <Text className="text-gray-600 font-bold text-sm uppercase tracking-wider">
              {activeGuardians.length}/5 Guardians Configured
            </Text>
          </View>
          {!readOnly && activeGuardians.length < 5 && (
            <Pressable
              onPress={() => setIsAdding(true)}
              className="flex-row items-center bg-teal-50 px-4 py-2 rounded-full border border-teal-200 active:opacity-85"
              accessibilityRole="button"
              accessibilityLabel="Add new guardian"
            >
              <UserPlus size={18} color="#0D9488" />
              <Text className="ml-2 text-teal-800 font-extrabold text-sm">
                Add Guardian
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Add / Edit Form */}
      {isFormOpen && !readOnly && (
        <View className="bg-gray-50 border border-teal-200/60 rounded-3xl p-5 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-5 border-b border-gray-200/60 pb-3">
            <View className="flex-row items-center">
              <View className="h-10 w-10 rounded-xl bg-teal-100 items-center justify-center mr-3">
                <UserCheck size={20} color="#0D9488" />
              </View>
              <Text className="text-lg font-black text-gray-900">
                {isAdding ? "Add Authorized Guardian" : "Edit Guardian Details"}
              </Text>
            </View>
            <Pressable
              onPress={resetForm}
              className="h-8 w-8 rounded-full bg-gray-200/80 items-center justify-center active:opacity-85"
            >
              <X size={18} color="#4B5563" />
            </Pressable>
          </View>

          <Text className="text-sm font-extrabold text-gray-700 mb-2 ml-2">
            First Name *
          </Text>
          <TextInput
            value={formData.firstName}
            onChangeText={(t) => setFormData({ ...formData, firstName: t })}
            placeholder="Jane"
            placeholderTextColor="#9CA3AF"
            className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 text-base text-gray-900 font-semibold"
          />

          <Text className="text-sm font-extrabold text-gray-700 mb-2 ml-2">
            Last Name *
          </Text>
          <TextInput
            value={formData.lastName}
            onChangeText={(t) => setFormData({ ...formData, lastName: t })}
            placeholder="Doe"
            placeholderTextColor="#9CA3AF"
            className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 text-base text-gray-900 font-semibold"
          />

          <Text className="text-sm font-extrabold text-gray-700 mb-3 ml-2">
            Relationship to Child
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {["Mother", "Father", "Guardian", "Grandparent", "Other"].map(
              (rel) => {
                const isSelected = formData.relationship === rel;
                return (
                  <Pressable
                    key={rel}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        relationship: rel as any,
                        customRelationship:
                          rel === "Other" ? formData.customRelationship : null,
                      })
                    }
                    className={`mr-3 px-5 py-3 rounded-xl border active:opacity-85 ${
                      isSelected
                        ? "bg-teal-600 border-teal-600 shadow-sm"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-black text-sm ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {rel}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </ScrollView>

          {formData.relationship === "Other" && (
            <>
              <Text className="text-sm font-extrabold text-gray-700 mb-2 ml-2">
                Specify Relationship *
              </Text>
              <TextInput
                value={formData.customRelationship || ""}
                onChangeText={(t) =>
                  setFormData({ ...formData, customRelationship: t })
                }
                placeholder="e.g. Uncle, Nanny, Family Friend"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 text-base text-gray-900 font-semibold"
              />
            </>
          )}

          <Text className="text-sm font-extrabold text-gray-700 mb-2 ml-2">
            Contact Phone Number *
          </Text>
          <TextInput
            value={formData.phone}
            onChangeText={(t) => setFormData({ ...formData, phone: t })}
            placeholder="0912 345 6789"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 text-base text-gray-900 font-semibold"
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={resetForm}
              className="flex-1 items-center justify-center py-4 rounded-2xl border border-gray-300 bg-white active:opacity-85"
            >
              <Text className="text-gray-700 font-black text-base">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isMutating}
              className={`flex-1 items-center justify-center py-4 rounded-2xl shadow-sm active:opacity-90 ${
                isMutating ? "bg-teal-400" : "bg-teal-600"
              }`}
            >
              {isMutating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-black text-base">
                  Save Guardian
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Empty State */}
      {activeGuardians.length === 0 && !isFormOpen && (
        <View className="py-8 px-4 items-center justify-center bg-gray-50/80 rounded-2xl border border-dashed border-gray-200">
          <View className="h-12 w-12 rounded-full bg-gray-100 items-center justify-center mb-2">
            <ShieldCheck size={24} color="#9CA3AF" />
          </View>
          <Text className="text-gray-700 font-bold text-sm">
            No Guardians Configured
          </Text>
          <Text className="text-gray-400 text-xs text-center mt-1">
            {readOnly
              ? "No guardians have been authorized by the parent for pickup."
              : 'Tap "Add Guardian" above to authorize family members or guardians for pickup.'}
          </Text>
        </View>
      )}

      {/* Guardian List */}
      {!isFormOpen &&
        activeGuardians.map((guardian, idx) => {
          const originalIndex = guardians.findIndex((g) => g === guardian);
          const initials =
            `${guardian.firstName?.[0] || ""}${guardian.lastName?.[0] || ""}`.toUpperCase();

          return (
            <View
              key={idx}
              className="flex-row items-center justify-between bg-white border border-gray-200/80 p-4 rounded-2xl mb-3 shadow-sm"
            >
              <View className="h-12 w-12 rounded-2xl bg-teal-50 items-center justify-center mr-4 border border-teal-100">
                <Text className="text-teal-800 font-black text-base">
                  {initials || "G"}
                </Text>
              </View>

              <View className="flex-1 mr-2">
                <Text className="text-lg font-black text-gray-900">
                  {guardian.firstName} {guardian.lastName}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="bg-teal-50 px-3 py-1 rounded-lg mr-3 border border-teal-100">
                    <Text className="text-teal-800 font-bold text-xs">
                      {guardian.relationship === "Other" &&
                      guardian.customRelationship
                        ? guardian.customRelationship
                        : guardian.relationship}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Phone size={13} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-2 font-medium">
                      {guardian.phone}
                    </Text>
                  </View>
                </View>
              </View>

              {!readOnly && (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => startEdit(guardian, originalIndex)}
                    className="p-2.5 bg-blue-50 rounded-xl active:opacity-85"
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${guardian.firstName} ${guardian.lastName}`}
                  >
                    <Edit2 size={18} color="#2563EB" />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      handleRemove(
                        originalIndex,
                        `${guardian.firstName} ${guardian.lastName}`,
                      )
                    }
                    className="p-2.5 bg-red-50 rounded-xl active:opacity-85"
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${guardian.firstName} ${guardian.lastName}`}
                  >
                    <Trash2 size={18} color="#DC2626" />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
    </View>
  );
}
