import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { ALLOWED_MIME_TYPES } from "@/src/features/enrollment/constants";
import { validateDocument } from "@/src/features/enrollment/utils";

export const useDocumentPicker = () => {
  const pickDocument = async (
    type: "birthCertificate" | "parentId",
    mode: "image" | "file" = "file"
  ): Promise<DocumentPicker.DocumentPickerAsset | null> => {
    try {
      const mimeTypes = mode === "image" ? ["image/jpeg", "image/png"] : [...ALLOWED_MIME_TYPES];

      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;

      const file = result.assets?.[0] ?? null;
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
