import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import {
  ShieldCheck,
  QrCode,
  AlertCircle,
  CheckCircle2,
  XCircle,
  IdCard,
  RefreshCw,
} from "lucide-react-native";
import { PickupPersonSelector } from "./pickup-person-selector";
import type { Guardian } from "@/src/api/api.types";
import { ImageViewerModal } from "@/src/components/ui";
import { getParentIdDocumentUrl } from "@/src/api/pickup.api";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";

interface ParentInfo {
  firstName: string;
  lastName: string;
  hasIdDocument: boolean;
}

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
      setSelectedImage({ url, title: "Parent ID", kind: "parent" });
    } catch (error: unknown) {
      reportHandledError("pickup.parent-id.access", error);
      setParentIdLoadFailed(true);
      onToggleVisualVerification(false);
      Alert.alert(
        "Parent ID Unavailable",
        getUserFriendlyErrorMessage(
          error,
          "The parent ID could not be loaded. Please try again.",
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
      "Parent ID Unavailable",
      "The parent ID could not be displayed. Request a fresh copy and try again.",
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
        "Parent ID Required",
        "Manual release is unavailable because this parent has no stored ID. Use pickup-code verification or correct the enrollment record.",
      );
      return;
    }

    if (isParentSelected && parentIdLoadFailed) {
      Alert.alert(
        "Parent ID Required",
        "Reload and review the stored parent ID before confirming release.",
      );
      return;
    }

    if (selectedGuardian && !selectedGuardian.idUrl) {
      Alert.alert(
        "Missing Documents",
        "This guardian is missing a required valid ID. They cannot be verified for pickup.",
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

      {isParentSelected && parent && (
        <View className="mt-5 border border-gray-200 rounded-2xl p-4 bg-gray-50">
          <Text className="text-sm font-black text-gray-800 mb-2">
            Parent Verification Document
          </Text>
          {!parent.hasIdDocument ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <View className="flex-row items-start">
                <AlertCircle size={18} color="#DC2626" />
                <Text className="text-red-700 text-sm font-semibold ml-2 flex-1 leading-5">
                  No parent ID is stored. Manual release is blocked; use the
                  pickup code or update the enrollment record.
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handleViewParentId}
              disabled={isLoadingParentId}
              className={`flex-row items-center justify-center rounded-2xl border px-4 py-4 ${
                parentIdLoadFailed
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-teal-200"
              }`}
              accessibilityRole="button"
              accessibilityLabel={
                parentIdLoadFailed
                  ? "Retry loading parent ID"
                  : "View parent ID"
              }
              accessibilityState={{ disabled: isLoadingParentId }}
            >
              {isLoadingParentId ? (
                <ActivityIndicator color="#0D9488" />
              ) : parentIdLoadFailed ? (
                <RefreshCw size={20} color="#D97706" />
              ) : (
                <IdCard size={20} color="#0D9488" />
              )}
              <Text
                className={`ml-2 font-black text-sm ${parentIdLoadFailed ? "text-amber-700" : "text-teal-700"}`}
              >
                {isLoadingParentId
                  ? "Loading Parent ID..."
                  : parentIdLoadFailed
                    ? "Retry Parent ID"
                    : "View Parent ID"}
              </Text>
            </Pressable>
          )}

          {parent.hasIdDocument && !parentIdLoadFailed && (
            <Text className="text-xs font-semibold text-gray-500 mt-3 leading-5">
              Open the stored ID and compare it with the physical government ID
              presented by the parent.
            </Text>
          )}

          <Pressable
            onPress={() => onToggleVisualVerification(!isVisuallyVerified)}
            disabled={
              !parent.hasIdDocument ||
              parentIdLoadFailed ||
              isLoadingParentId ||
              !hasViewedParentId
            }
            className={`mt-4 flex-row items-center justify-center rounded-2xl border px-4 py-3 ${
              isVisuallyVerified
                ? "bg-emerald-50 border-emerald-200"
                : "bg-white border-gray-200"
            }`}
            accessibilityRole="checkbox"
            accessibilityLabel="Confirm the parent and presented physical ID match the stored parent ID"
            accessibilityState={{
              checked: isVisuallyVerified,
              disabled:
                !parent.hasIdDocument ||
                parentIdLoadFailed ||
                isLoadingParentId ||
                !hasViewedParentId,
            }}
          >
            {isVisuallyVerified ? (
              <CheckCircle2 size={18} color="#059669" />
            ) : (
              <XCircle size={18} color="#6B7280" />
            )}
            <Text
              className={`ml-2 font-black text-sm ${isVisuallyVerified ? "text-emerald-700" : "text-gray-700"}`}
            >
              {isVisuallyVerified
                ? "Parent ID Match Confirmed"
                : hasViewedParentId
                  ? "Confirm Parent ID Match"
                  : "View Parent ID First"}
            </Text>
          </Pressable>
        </View>
      )}

      {selectedGuardian && (
        <View className="mt-5 border border-gray-200 rounded-2xl p-4 bg-gray-50">
          <Text className="text-sm font-black text-gray-800 mb-3">
            Guardian Verification Documents
          </Text>
          <View>
            {selectedGuardian.idUrl ? (
              <View>
                <Text className="text-xs font-bold text-gray-500 mb-2">
                  Valid ID
                </Text>
                <Pressable
                  onPress={() =>
                    setSelectedImage({
                      url: selectedGuardian.idUrl!,
                      title: "Guardian ID",
                      kind: "guardian",
                    })
                  }
                >
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
            accessibilityLabel="Confirm visual verification against the stored guardian ID"
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
              {isVisuallyVerified
                ? "Visual Match Confirmed"
                : "Confirm Visual Match"}
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
        onImageError={handleImageError}
        onImageLoad={() => {
          if (selectedImage?.kind === "parent") setHasViewedParentId(true);
        }}
      />
    </View>
  );
}
