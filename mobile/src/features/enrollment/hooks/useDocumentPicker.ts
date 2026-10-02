import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import type * as DocumentPicker from "expo-document-picker";
import { validateDocument } from "@/src/features/enrollment/utils/enrollment-utils";

const MAX_DOCUMENT_EDGE = 2000;
const DOCUMENT_JPEG_QUALITY = 0.82;

const optimizeDocumentImage = async (image: ImagePicker.ImagePickerAsset) => {
  const longestEdge = Math.max(image.width, image.height);
  const actions: ImageManipulator.Action[] = [];

  if (longestEdge > MAX_DOCUMENT_EDGE) {
    actions.push({
      resize:
        image.width >= image.height
          ? { width: MAX_DOCUMENT_EDGE }
          : { height: MAX_DOCUMENT_EDGE },
    });
  }

  return ImageManipulator.manipulateAsync(image.uri, actions, {
    compress: DOCUMENT_JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
};

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
              quality: 0.9,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.9,
              selectionLimit: 1,
            });
      if (result.canceled || !result.assets[0]) return null;
      const image = result.assets[0];
      const optimized = await optimizeDocumentImage(image);
      const file: DocumentPicker.DocumentPickerAsset = {
        uri: optimized.uri,
        name: `document-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
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
