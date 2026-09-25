import { Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { ALLOWED_MIME_TYPES } from "@/src/features/enrollment/constants";
import { validateDocument } from "@/src/features/enrollment/utils/enrollment-utils";

export const useDocumentPicker = () => {
  const pickDocument = async (
    type: "birthCertificate" | "parentId",
    mode: "image" | "file" = "file"
  ): Promise<DocumentPicker.DocumentPickerAsset | null> => {
    try {
      const mimeTypes = mode === "image" ? ["image/jpeg", "image/png"] : [...ALLOWED_MIME_TYPES];

      let file: DocumentPicker.DocumentPickerAsset | null;

      if (Platform.OS === "web") {
        const result = await DocumentPicker.getDocumentAsync({
          type: mimeTypes,
          copyToCacheDirectory: true,
        });
        file = result.canceled ? null : result.assets?.[0] ?? null;
      } else {
        const result = await File.pickFileAsync({ mimeTypes });
        if (result.canceled || !result.result) return null;

        const selectedFile = result.result;
        file = {
          uri: selectedFile.uri,
          name: selectedFile.name,
          size: selectedFile.size,
          mimeType: selectedFile.type || undefined,
          lastModified: selectedFile.lastModified ?? Date.now(),
        };
      }

      if (!file) return null;
      const error = validateDocument(file);
      if (error) {
        Alert.alert("Invalid Document", error);
        return null;
      }

      return file;
    } catch (error: any) {
      Alert.alert("Document Error", error?.message || "Failed to pick file.");
      return null;
    }
  };

  return {
    pickDocument,
  };
};
