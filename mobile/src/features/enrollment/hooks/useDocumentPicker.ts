import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type * as DocumentPicker from "expo-document-picker";
import { validateDocument } from "@/src/features/enrollment/utils/enrollment-utils";

export const useDocumentPicker = () => {
  const pickDocument = async (
    _type: "birthCertificate" | "parentId",
    source: "camera" | "gallery" | "image" = "gallery",
  ): Promise<DocumentPicker.DocumentPickerAsset | null> => {
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          `Allow ${source === "camera" ? "camera" : "photo library"} access.`,
        );
        return null;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 1,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 1,
              selectionLimit: 1,
            });
      if (result.canceled || !result.assets[0]) return null;
      const image = result.assets[0];
      const file: DocumentPicker.DocumentPickerAsset = {
        uri: image.uri,
        name:
          image.fileName ||
          `document-${Date.now()}.${image.mimeType === "image/png" ? "png" : "jpg"}`,
        size: image.fileSize,
        mimeType: image.mimeType || "image/jpeg",
        lastModified: Date.now(),
      };
      const error = validateDocument(file);
      if (error) {
        Alert.alert("Invalid Image", error);
        return null;
      }
      return file;
    } catch (error: any) {
      Alert.alert("Image Error", error?.message || "Failed to select image.");
      return null;
    }
  };
  return { pickDocument };
};
