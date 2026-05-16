import { FileText } from "lucide-react-native";
import { Text, View } from "react-native";
import type * as DocumentPicker from "expo-document-picker";
import { DocumentUploadField } from "@/src/features/enrollment/components/form";


export function DocumentsStepSection({
  isWide,
  birthCertificateFile,
  parentIdFile,
  onPickBirthCertificate,
  onPickParentId,
  onClearBirthCertificate,
  onClearParentId,
}: {
  isWide: boolean;
  birthCertificateFile: DocumentPicker.DocumentPickerAsset | null;
  parentIdFile: DocumentPicker.DocumentPickerAsset | null;
  onPickBirthCertificate: () => void;
  onPickParentId: () => void;
  onClearBirthCertificate: () => void;
  onClearParentId: () => void;
}) {
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
        Upload clear photos or scans of the supporting enrollment documents.
      </Text>

      <View
        className="mt-4"
        style={{
          flexDirection: isWide ? "row" : "column",
          gap: 12,
        }}
      >
        <DocumentUploadField
          label="Birth Certificate *"
          fileName={birthCertificateFile?.name || null}
          showPhotoOption={false}
          onUploadFile={onPickBirthCertificate}
          onClear={onClearBirthCertificate}
          containerStyle={isWide ? { flex: 1 } : undefined}
          labelStyle={{
            fontSize: 15,
            lineHeight: 22,
            fontWeight: "700",
          }}
        />

        <DocumentUploadField
          label="Parent ID *"
          fileName={parentIdFile?.name || null}
          showPhotoOption={false}
          onUploadFile={onPickParentId}
          onClear={onClearParentId}
          containerStyle={isWide ? { flex: 1 } : undefined}
          labelStyle={{
            fontSize: 15,
            lineHeight: 22,
            fontWeight: "700",
          }}
        />
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

