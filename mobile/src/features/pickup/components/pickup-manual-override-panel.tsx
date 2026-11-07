import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  QrCode,
  ShieldCheck,
} from "lucide-react-native";
import { PickupPersonSelector } from "./pickup-person-selector";
import { PickupParentIdCard, type ParentInfo } from "./pickup-parent-id-card";
import { PickupGuardianIdCard } from "./pickup-guardian-id-card";
import type { Guardian } from "@/src/api/api.types";
import { ImageViewerModal } from "@/src/components/ui";
import { getParentIdDocumentUrl } from "@/src/api/pickup.api";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";

export type { ParentInfo };

interface Props {
  childId: string;
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
  childId,
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
    if (selectedGuardianIndex === null || selectedGuardianIndex === undefined)
      return null;
    return guardians[selectedGuardianIndex] ?? null;
  }, [guardians, selectedGuardianIndex]);

  const isParentSelected = selectedGuardianIndex === null;
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    kind: "parent" | "guardian";
  } | null>(null);
  const [isLoadingParentId, setIsLoadingParentId] = useState(false);
  const [parentIdLoadFailed, setParentIdLoadFailed] = useState(false);
  const [hasViewedParentId, setHasViewedParentId] = useState(false);

  const parentIdUnavailable = isParentSelected && !parent?.hasIdDocument;
  const confirmDisabled =
    isReleasing ||
    isLoadingParentId ||
    parentIdUnavailable ||
    parentIdLoadFailed ||
    (isParentSelected && !hasViewedParentId) ||
    !isVisuallyVerified;

  const handleViewParentId = async () => {
    if (!parent?.hasIdDocument || isLoadingParentId) return;
    setIsLoadingParentId(true);
    setParentIdLoadFailed(false);
    setHasViewedParentId(false);
    onToggleVisualVerification(false);
    try {
      const url = await getParentIdDocumentUrl(childId);
      setSelectedImage({
        url,
        title: "Parent Government-Issued Photo ID",
        kind: "parent",
      });
    } catch (error: unknown) {
      reportHandledError("pickup.parent-id.access", error);
      setParentIdLoadFailed(true);
      onToggleVisualVerification(false);
      Alert.alert(
        "Parent Government ID Unavailable",
        getUserFriendlyErrorMessage(
          error,
          "The parent government-issued photo ID could not be loaded. Please try again.",
        ),
      );
    } finally {
      setIsLoadingParentId(false);
    }
  };

  const handleImageError = () => {
    if (selectedImage?.kind !== "parent") return;
    setSelectedImage(null);
    setParentIdLoadFailed(true);
    setHasViewedParentId(false);
    onToggleVisualVerification(false);
    Alert.alert(
      "Parent Government ID Unavailable",
      "The parent government-issued photo ID could not be displayed. Request a fresh copy and try again.",
    );
  };

  const handleConfirmPress = () => {
    if (selectedGuardianIndex === null && !parent) {
      Alert.alert(
        "Missing Guardian",
        "Please select an authorized person first.",
      );
      return;
    }

    if (isParentSelected && !parent?.hasIdDocument) {
      Alert.alert(
        "Parent Government ID Required",
        "Manual release is unavailable because this parent has no stored government-issued photo ID. Use pickup-code verification or correct the enrollment record.",
      );
      return;
    }

    if (isParentSelected && parentIdLoadFailed) {
      Alert.alert(
        "Parent Government ID Required",
        "Reload and review the stored parent government-issued photo ID before confirming release.",
      );
      return;
    }

    if (selectedGuardian && !selectedGuardian.idUrl) {
      Alert.alert(
        "Missing Documents",
        "This guardian is missing a required government-issued photo ID. They cannot be verified for pickup.",
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
      ],
    );
  };

  return (
    <View
      className="overflow-hidden rounded-3xl bg-white p-6"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      {/* Section Header */}
      <View className="mb-2 flex-row items-center">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
          <ShieldCheck size={22} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-black text-gray-900">
            Manual Override
          </Text>
          <Text className="mt-0.5 text-sm font-semibold text-gray-500">
            Verify using physical photo ID
          </Text>
        </View>
      </View>

      {/* Warning Banner */}
      <View className="mb-6 mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <View className="flex-row items-start">
          <AlertCircle size={18} color="#D97706" />
          <Text className="ml-2 flex-1 text-sm font-semibold leading-5 text-amber-800">
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

      {isParentSelected && parent ? (
        <PickupParentIdCard
          parent={parent}
          isLoadingParentId={isLoadingParentId}
          parentIdLoadFailed={parentIdLoadFailed}
          hasViewedParentId={hasViewedParentId}
          isVisuallyVerified={isVisuallyVerified}
          onViewParentId={handleViewParentId}
          onToggleVisualVerification={onToggleVisualVerification}
        />
      ) : null}

      {selectedGuardian ? (
        <PickupGuardianIdCard
          guardian={selectedGuardian}
          isVisuallyVerified={isVisuallyVerified}
          onViewImage={setSelectedImage}
          onToggleVisualVerification={onToggleVisualVerification}
        />
      ) : null}

      <Pressable
        onPress={handleConfirmPress}
        disabled={confirmDisabled}
        className={`mt-4 items-center rounded-2xl py-5 active:opacity-90 ${isReleasing ? "bg-teal-400" : "bg-teal-600"}`}
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
          <Text className="text-xl font-black tracking-wide text-white">
            Confirm Manual Release
          </Text>
        )}
      </Pressable>

      {/* Back Link */}
      <Pressable
        onPress={onBack}
        className="mt-2 flex-row items-center justify-center py-4"
        accessibilityRole="button"
        accessibilityLabel="Back to code verification"
      >
        <QrCode size={16} color="#6B7280" />
        <Text className="ml-2 text-base font-black text-gray-600">
          Back to Code Verification
        </Text>
      </Pressable>

      <ImageViewerModal
        visible={!!selectedImage}
        imageUrl={selectedImage?.url || null}
        title={selectedImage?.title}
        onClose={() => setSelectedImage(null)}
        onImageError={handleImageError}
        onImageLoad={() => {
          if (selectedImage?.kind === "parent") setHasViewedParentId(true);
        }}
      />
    </View>
  );
}
