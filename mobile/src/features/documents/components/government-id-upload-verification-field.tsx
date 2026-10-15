import type * as DocumentPicker from "expo-document-picker";
import { Pressable, Text, View } from "react-native";
import { GovernmentPhotoIdGuidance } from "@/src/components/ui";
import { DocumentUploadField } from "@/src/features/enrollment/components/form";
import { getVerificationDisplay, type VerificationView } from "../hooks";
import { DocumentVerificationMessage } from "./document-verification-message";

interface GovernmentIdUploadVerificationFieldProps {
  holder: "parent" | "guardian";
  label: string;
  file: DocumentPicker.DocumentPickerAsset | null;
  verification: VerificationView;
  expectedFirstName: string;
  expectedLastName: string;
  onPick: () => void;
  onClear: () => void;
  onRetry: () => void;
  onConfirm: () => void;
  allowManualConfirmationOnServiceError?: boolean;
  className?: string;
}

export function GovernmentIdUploadVerificationField({
  holder,
  label,
  file,
  verification,
  expectedFirstName,
  expectedLastName,
  onPick,
  onClear,
  onRetry,
  onConfirm,
  allowManualConfirmationOnServiceError = false,
  className = "",
}: GovernmentIdUploadVerificationFieldProps) {
  const hasValidName = Boolean(
    expectedFirstName.trim() && expectedLastName.trim(),
  );
  const verificationType = holder === "parent" ? "parentId" : "guardianId";
  const display = getVerificationDisplay(verification, verificationType);
  const needsReverification = Boolean(file) && verification.state === "idle";

  return (
    <View className={className}>
      <DocumentUploadField
        label={label}
        file={file}
        showPhotoOption={false}
        onUploadFile={onPick}
        allowImagePreview
        onClear={onClear}
        verificationBadge={display}
        labelStyle={{ fontSize: 15, lineHeight: 22, fontWeight: "700" }}
      />
      {needsReverification ? (
        <View className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Text className="text-sm leading-5 text-amber-900">
            {hasValidName
              ? "The name changed after this image was selected. Verify the ID again before saving."
              : `Enter the ${holder}'s first and last names before verification.`}
          </Text>
          {hasValidName ? (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel={`Verify ${holder} ID again`}
              className="mt-3 min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-3"
            >
              <Text className="font-bold text-white">Verify Again</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <DocumentVerificationMessage
        key={verification.result?.verificationId || verification.state}
        value={verification}
        documentType={verificationType}
        onConfirm={onConfirm}
        onRetry={onRetry}
        onReplace={onClear}
        allowManualConfirmationOnServiceError={
          allowManualConfirmationOnServiceError
        }
      />
      <GovernmentPhotoIdGuidance holder={holder} />
    </View>
  );
}
