import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react-native";
import type { VerificationView } from "../hooks";

interface DocumentVerificationMessageProps {
  value: VerificationView;
  documentType: "birthCertificate" | "parentId" | "guardianId";
  onConfirm: () => void;
  onRetry: () => void;
  onReplace: () => void;
  allowManualConfirmationOnServiceError?: boolean;
}

export function DocumentVerificationMessage({
  value,
  documentType,
  onConfirm,
  onRetry,
  onReplace,
  allowManualConfirmationOnServiceError = false,
}: DocumentVerificationMessageProps) {
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  if (value.state === "idle") return null;
  const isPending = Boolean(value.pendingAction);
  if (
    value.state === "checking" ||
    value.state === "verified" ||
    value.result?.teacherConfirmed ||
    isPending
  )
    return null;

  const canManuallyConfirm =
    Boolean(value.result) &&
    (value.state === "confirmation_required" ||
      (value.state === "service_error" &&
        allowManualConfirmationOnServiceError));

  if (canManuallyConfirm) {
    const documentName =
      documentType === "birthCertificate"
        ? "birth certificate"
        : documentType === "parentId"
          ? "parent ID"
          : "guardian ID";
    const isManualFallback = value.state === "service_error";
    return (
      <View className="mb-4 gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <View className="flex-row items-start gap-2">
          <AlertTriangle size={18} color="#92400E" />
          <View className="flex-1">
            <Text className="font-semibold text-amber-900">
              Review the original {documentName}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-amber-900">
              {isManualFallback
                ? "AI verification is unavailable. Check the original ID manually."
                : "Confirm it matches the enrollment details."}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setReviewAcknowledged((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: reviewAcknowledged }}
          accessibilityLabel={`Confirm review of the original ${documentName}`}
          className="min-h-11 flex-row items-center rounded-lg border border-amber-300 bg-white px-3 py-2"
        >
          {reviewAcknowledged ? (
            <CheckCircle2 size={20} color="#059669" />
          ) : (
            <Circle size={20} color="#92400E" />
          )}
          <Text className="ml-2 flex-1 text-sm font-semibold leading-5 text-gray-800">
            The {documentName} matches the provided details.
          </Text>
        </Pressable>

        <View className="flex-row gap-2">
          <Pressable
            onPress={onReplace}
            accessibilityRole="button"
            accessibilityLabel={`Replace ${documentName} image`}
            className="min-h-11 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <Text className="text-center font-semibold text-gray-700">
              Replace Image
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={!reviewAcknowledged}
            accessibilityRole="button"
            accessibilityLabel={`Confirm ${documentName} after inspecting the original`}
            accessibilityState={{ disabled: !reviewAcknowledged }}
            className={`min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2 ${
              reviewAcknowledged ? "bg-amber-600" : "bg-gray-300"
            }`}
          >
            <Text className="text-center font-bold text-white">
              Confirm Details
            </Text>
          </Pressable>
        </View>

        {isManualFallback ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry guardian ID verification"
            className="min-h-11 items-center justify-center rounded-lg px-3 py-2"
          >
            <Text className="font-semibold text-teal-700">Retry AI Check</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mb-4 rounded-xl bg-gray-50 p-3">
      {value.message ? (
        <Text className="text-sm text-gray-600">{value.message}</Text>
      ) : null}
      {(value.state === "confirmation_required" ||
        value.state === "service_error") &&
      !value.result?.teacherConfirmed ? (
        <View className="mt-3 gap-2">
          {value.state === "service_error" ? (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry document verification"
              className="min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-3"
            >
              <Text className="font-bold text-white">Retry Verification</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onReplace}
            accessibilityRole="button"
            accessibilityLabel="Replace document image"
            className="min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3"
          >
            <Text className="font-bold text-gray-700">Replace Image</Text>
          </Pressable>
        </View>
      ) : null}

      {value.state === "rejected" ? (
        <Pressable
          onPress={onReplace}
          accessibilityRole="button"
          accessibilityLabel="Replace rejected document image"
          className="mt-3 min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-3"
        >
          <Text className="font-bold text-white">Replace Image</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
