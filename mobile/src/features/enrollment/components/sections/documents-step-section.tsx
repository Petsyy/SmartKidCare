import { FileText } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type * as DocumentPicker from "expo-document-picker";
import { DocumentUploadField } from "@/src/features/enrollment/components/form";
import {
  getVerificationDisplay,
  type VerificationView,
} from "@/src/features/enrollment/hooks/useDocumentVerification";

const VerificationMessage = ({
  value,
  onConfirm,
  onRetry,
  onReplace,
}: {
  value: VerificationView;
  onConfirm: () => void;
  onRetry: () => void;
  onReplace: () => void;
}) => {
  if (value.state === "idle") return null;
  const isPending = Boolean(value.pendingAction);
  if (
    value.state === "checking" ||
    value.state === "verified" ||
    value.result?.teacherConfirmed ||
    isPending
  )
    return null;

  return (
    <View className="mb-4 rounded-xl bg-gray-50 p-3">
      {value.message ? (
        <Text className="text-sm text-gray-600">{value.message}</Text>
      ) : null}
      {(value.state === "confirmation_required" ||
        value.state === "service_error") &&
      !value.result?.teacherConfirmed &&
      !isPending ? (
        <View className="mt-3 gap-2">
          {value.state === "service_error" ? (
            <Pressable
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry document verification"
              className="min-h-[44px] items-center justify-center rounded-xl bg-teal-700 px-4 py-3"
            >
              <Text className="font-bold text-white">Retry Verification</Text>
            </Pressable>
          ) : null}
          {value.state === "confirmation_required" && value.result ? (
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm document after inspecting the original"
              className="min-h-[44px] items-center justify-center rounded-xl bg-amber-600 px-4 py-3"
            >
              <Text className="text-center font-bold text-white">
                Complete Teacher Verification
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onReplace}
            accessibilityRole="button"
            accessibilityLabel="Replace document image"
            className="min-h-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3"
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
          className="mt-3 min-h-[44px] items-center justify-center rounded-xl bg-red-600 px-4 py-3"
        >
          <Text className="font-bold text-white">Replace Image</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

type Props = {
  isWide: boolean;
  birthCertificateFile: DocumentPicker.DocumentPickerAsset | null;
  parentIdFile: DocumentPicker.DocumentPickerAsset | null;
  onPickBirthCertificate: () => void;
  onPickParentId: () => void;
  onClearBirthCertificate: () => void;
  onClearParentId: () => void;
  birthVerification: VerificationView;
  parentVerification: VerificationView;
  onConfirmBirth: () => void;
  onConfirmParent: () => void;
  onRetryBirth: () => void;
  onRetryParent: () => void;
};

export function DocumentsStepSection(props: Props) {
  const fieldStyle = props.isWide ? { flex: 1 } : undefined;
  const birthDisplay = getVerificationDisplay(props.birthVerification);
  const parentDisplay = getVerificationDisplay(props.parentVerification);
  return (
    <View
      className="rounded-3xl border border-gray-200 bg-white p-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="mb-2 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <FileText size={20} color="#D97706" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">
          Required Documents
        </Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Choose a clear image of each required enrollment document from your
        gallery.
      </Text>
      <View
        className="mt-4"
        style={{ flexDirection: props.isWide ? "row" : "column", gap: 12 }}
      >
        <View style={fieldStyle}>
          <DocumentUploadField
            label="Birth Certificate *"
            file={props.birthCertificateFile}
            showPhotoOption={false}
            onUploadFile={props.onPickBirthCertificate}
            allowImagePreview
            onClear={props.onClearBirthCertificate}
            verificationBadge={birthDisplay}
            labelStyle={{ fontSize: 15, lineHeight: 22, fontWeight: "700" }}
          />
          <VerificationMessage
            value={props.birthVerification}
            onConfirm={props.onConfirmBirth}
            onRetry={props.onRetryBirth}
            onReplace={props.onClearBirthCertificate}
          />
        </View>
        <View style={fieldStyle}>
          <DocumentUploadField
            label="Parent ID *"
            file={props.parentIdFile}
            showPhotoOption={false}
            onUploadFile={props.onPickParentId}
            allowImagePreview
            onClear={props.onClearParentId}
            verificationBadge={parentDisplay}
            labelStyle={{ fontSize: 15, lineHeight: 22, fontWeight: "700" }}
          />
          <VerificationMessage
            value={props.parentVerification}
            onConfirm={props.onConfirmParent}
            onRetry={props.onRetryParent}
            onReplace={props.onClearParentId}
          />
        </View>
      </View>
      <View className="rounded-2xl bg-gray-100 p-4">
        <Text className="text-xl font-bold text-gray-900">
          Tips for uploading:
        </Text>
        <Text className="mt-2 text-base leading-6 text-gray-600">
          - Make sure all text is clearly readable
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Photos should be well-lit without glare
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Include all edges of the document
        </Text>
      </View>
    </View>
  );
}
