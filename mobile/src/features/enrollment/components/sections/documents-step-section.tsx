import { FileText } from "lucide-react-native";
import { Text, View } from "react-native";
import type * as DocumentPicker from "expo-document-picker";
import { DocumentUploadField } from "@/src/features/enrollment/components/form";
import {
  DocumentVerificationMessage,
  GovernmentIdUploadVerificationField,
} from "@/src/features/documents/components";
import {
  getVerificationDisplay,
  type VerificationView,
} from "@/src/features/documents/hooks";

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
  parentFirstName: string;
  parentLastName: string;
};

export function DocumentsStepSection(props: Props) {
  const fieldStyle = props.isWide ? { flex: 1 } : undefined;
  const birthDisplay = getVerificationDisplay(
    props.birthVerification,
    "birthCertificate",
  );
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
        Upload the complete documents presented during enrollment. AI provides a
        secondary check; uncertain birth certificates can be reviewed by the
        teacher.
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
          <DocumentVerificationMessage
            key={
              props.birthVerification.result?.verificationId ||
              props.birthVerification.state
            }
            value={props.birthVerification}
            documentType="birthCertificate"
            onConfirm={props.onConfirmBirth}
            onRetry={props.onRetryBirth}
            onReplace={props.onClearBirthCertificate}
            allowManualConfirmationOnServiceError
          />
        </View>
        <GovernmentIdUploadVerificationField
          holder="parent"
          label="Parent Government-Issued Photo ID *"
          file={props.parentIdFile}
          verification={props.parentVerification}
          expectedFirstName={props.parentFirstName}
          expectedLastName={props.parentLastName}
          onPick={props.onPickParentId}
          onClear={props.onClearParentId}
          onRetry={props.onRetryParent}
          onConfirm={props.onConfirmParent}
          allowManualConfirmationOnServiceError
          className={props.isWide ? "flex-1" : ""}
        />
      </View>
      <View className="rounded-2xl bg-gray-100 p-4">
        <Text className="text-xl font-bold text-gray-900">
          Tips for uploading:
        </Text>
        <Text className="mt-2 text-base leading-6 text-gray-600">
          - Capture the complete document with all four edges visible
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Use good lighting and avoid glare or heavy shadows
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Hold the camera directly above the document
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Use the original photo instead of a compressed screenshot
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Small text is acceptable if the document is recognizable
        </Text>
      </View>
    </View>
  );
}
