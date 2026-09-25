import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Image, Alert } from "react-native";
import { ShieldCheck, QrCode, AlertCircle, CheckCircle2, XCircle } from "lucide-react-native";
import { PickupPersonSelector } from "./pickup-person-selector";
import type { Guardian } from "@/src/api/api.types";
import { ImageViewerModal } from "@/src/components/ui";

interface ParentInfo {
  firstName: string;
  lastName: string;
}

interface Props {
  parent: ParentInfo | null | undefined;
  guardians: Guardian[];
  selectedGuardianIndex: number | null;
  onSelectGuardian: (index: number | null) => void;
  onConfirm: () => void;
  isReleasing: boolean;
  onBack: () => void;
  isVisuallyVerified: boolean;
  onToggleVisualVerification: (value: boolean) => void;
}

export function PickupManualOverridePanel({
  parent,
  guardians,
  selectedGuardianIndex,
  onSelectGuardian,
  onConfirm,
  isReleasing,
  onBack,
  isVisuallyVerified,
  onToggleVisualVerification,
}: Props) {
  const selectedGuardian = useMemo(() => {
    if (selectedGuardianIndex === null || selectedGuardianIndex === undefined) return null;
    return guardians[selectedGuardianIndex] ?? null;
  }, [guardians, selectedGuardianIndex]);

  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  const confirmDisabled = isReleasing;

  const handleConfirmPress = () => {
    if (selectedGuardianIndex === null && !parent) {
      Alert.alert("Missing Guardian", "Please select an authorized person first.");
      return;
    }

    if (selectedGuardian && (!selectedGuardian.photoUrl || !selectedGuardian.idUrl)) {
      Alert.alert(
        "Missing Documents",
        "This guardian is missing required verification documents (Photo or ID). They cannot be verified for pickup.",
      );
      return;
    }

    if (!isVisuallyVerified) {
      Alert.alert(
        "Verification Required",
        "Please tap 'Confirm Visual Match' to acknowledge that the person's physical ID matches the records.",
      );
      return;
    }

    Alert.alert(
      "Confirm Release",
      "Are you sure you want to release the child to this person?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: onConfirm },
      ]
    );
  };

  return (
    <View
      className="bg-white p-6 rounded-3xl overflow-hidden"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      {/* Section Header */}
      <View className="flex-row items-center mb-2">
        <View className="h-10 w-10 rounded-xl bg-amber-50 items-center justify-center mr-3 border border-amber-200">
          <ShieldCheck size={22} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-black text-gray-900">
            Manual Override
          </Text>
          <Text className="text-sm font-semibold text-gray-500 mt-0.5">
            Verify using physical photo ID
          </Text>
        </View>
      </View>

      {/* Warning Banner */}
      <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 mt-4">
        <View className="flex-row items-start">
          <AlertCircle size={18} color="#D97706" />
          <Text className="text-amber-800 text-sm font-semibold ml-2 flex-1 leading-5">
            Check the person’s government-issued photo ID and confirm it matches
            one of the authorized persons below before releasing the child.
          </Text>
        </View>
      </View>

      {/* Person Selector */}
      <PickupPersonSelector
        parent={parent}
        guardians={guardians}
        selectedGuardianIndex={selectedGuardianIndex}
        onSelect={onSelectGuardian}
      />

      {selectedGuardian && (
        <View className="mt-5 border border-gray-200 rounded-2xl p-4 bg-gray-50">
          <Text className="text-sm font-black text-gray-800 mb-3">
            Guardian Verification Documents
          </Text>
          <View className="flex-row gap-3">
            {selectedGuardian.photoUrl ? (
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-500 mb-2">Photo</Text>
                <Pressable onPress={() => setSelectedImage({ url: selectedGuardian.photoUrl!, title: "Guardian Photo" })}>
                  <Image
                    source={{ uri: selectedGuardian.photoUrl }}
                    className="h-28 w-full rounded-2xl"
                    resizeMode="cover"
                  />
                </Pressable>
              </View>
            ) : null}
            {selectedGuardian.idUrl ? (
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-500 mb-2">Valid ID</Text>
                <Pressable onPress={() => setSelectedImage({ url: selectedGuardian.idUrl!, title: "Guardian ID" })}>
                  <Image
                    source={{ uri: selectedGuardian.idUrl }}
                    className="h-28 w-full rounded-2xl"
                    resizeMode="cover"
                  />
                </Pressable>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => onToggleVisualVerification(!isVisuallyVerified)}
            className={`mt-4 flex-row items-center justify-center rounded-2xl border px-4 py-3 ${
              isVisuallyVerified
                ? "bg-emerald-50 border-emerald-200"
                : "bg-white border-gray-200"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Confirm visual verification against guardian photo and ID"
          >
            {isVisuallyVerified ? (
              <CheckCircle2 size={18} color="#059669" />
            ) : (
              <XCircle size={18} color="#6B7280" />
            )}
            <Text
              className={`ml-2 font-black text-sm ${
                isVisuallyVerified ? "text-emerald-700" : "text-gray-700"
              }`}
            >
              {isVisuallyVerified ? "Visual Match Confirmed" : "Confirm Visual Match"}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={handleConfirmPress}
        disabled={confirmDisabled}
        className={`mt-4 py-5 rounded-2xl items-center active:opacity-90 ${isReleasing ? "bg-teal-400" : "bg-teal-600"}`}
        style={{
          shadowColor: "#14B8A6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel="Confirm manual release"
      >
        {isReleasing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-black text-xl tracking-wide">
            Confirm Manual Release
          </Text>
        )}
      </Pressable>

      {/* Back Link */}
      <Pressable
        onPress={onBack}
        className="py-4 items-center mt-2 flex-row justify-center"
        accessibilityRole="button"
        accessibilityLabel="Back to code verification"
      >
        <QrCode size={16} color="#6B7280" />
        <Text className="text-gray-600 font-black text-base ml-2">
          Back to Code Verification
        </Text>
      </Pressable>

      <ImageViewerModal
        visible={!!selectedImage}
        imageUrl={selectedImage?.url || null}
        title={selectedImage?.title}
        onClose={() => setSelectedImage(null)}
      />
    </View>
  );
}
