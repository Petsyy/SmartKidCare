import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  CheckCircle2,
  Eye,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";

export interface DocumentUploadFieldProps {
  label: string;
  file: { uri: string; name: string; mimeType?: string } | null;
  onUploadFile: () => void;
  onClear: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  showPhotoOption?: boolean;
  onUploadImage?: () => void;
  verificationBadge?: {
    label: string;
    tone: "success" | "pending" | "warning" | "error" | "neutral";
    loading?: boolean;
  };
  allowImagePreview?: boolean;
}

export function DocumentUploadField({
  label,
  file,
  onUploadFile,
  onClear,
  containerStyle,
  labelStyle,
  showPhotoOption = true,
  onUploadImage,
  verificationBadge,
  allowImagePreview = false,
}: DocumentUploadFieldProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const hasPhotoOption = showPhotoOption && typeof onUploadImage === "function";

  const isRequired = label.endsWith(" *");
  const bareLabel = isRequired ? label.slice(0, -2) : label;

  return (
    <>
      <View className="mb-[18px]" style={containerStyle}>
        <Text
          className="mb-2 text-[13px] font-bold uppercase tracking-[0.6px] text-[#374151]"
          style={labelStyle}
        >
          {bareLabel}
          {isRequired ? (
            <Text className="font-bold text-[#EF4444]"> *</Text>
          ) : null}
        </Text>

        <View
          className={`w-full ${hasPhotoOption && !file ? "flex-row gap-3" : "flex-col"}`}
        >
          {!file && hasPhotoOption ? (
            <Pressable
              onPress={onUploadImage}
              accessibilityRole="button"
              accessibilityLabel={`Take photo for ${bareLabel}`}
              className="min-h-[100px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-[#10B981] bg-[#ECFDF5] px-[14px] py-[18px]"
            >
              <Camera size={26} color="#047857" />
              <Text
                numberOfLines={1}
                className="mt-2 text-[14px] font-bold text-[#047857]"
              >
                Take Photo
              </Text>
            </Pressable>
          ) : null}

          {file ? (
            file.mimeType?.startsWith("image/") ||
            file.name.match(/\.(jpg|jpeg|png)$/i) ? (
              <View className="relative items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <Pressable
                  onPress={() => allowImagePreview && setPreviewVisible(true)}
                  disabled={!allowImagePreview}
                  accessibilityRole={allowImagePreview ? "button" : undefined}
                  accessibilityLabel={
                    allowImagePreview
                      ? `View full ${bareLabel} image`
                      : undefined
                  }
                  className="w-full"
                >
                  <Image
                    source={{ uri: file.uri }}
                    style={{ width: "100%", height: 160 }}
                    resizeMode="cover"
                    accessibilityLabel={`${bareLabel} preview`}
                  />
                </Pressable>
                <View
                  pointerEvents="none"
                  className="absolute inset-0 bg-black/20"
                />
                {allowImagePreview ? (
                  <View
                    pointerEvents="none"
                    className="absolute left-3 top-3 flex-row items-center rounded-lg bg-black/60 px-2.5 py-2"
                  >
                    <Eye size={15} color="white" />
                    <Text className="ml-1.5 text-xs font-bold text-white">
                      View Full Image
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={onClear}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${bareLabel} image`}
                  className="absolute right-2 top-2 h-11 w-11 items-center justify-center rounded-full bg-black/60 active:bg-black/70"
                >
                  <Trash2 size={16} color="white" />
                </Pressable>
                <View
                  pointerEvents="none"
                  className={`absolute bottom-3 left-3 max-w-[80%] flex-row items-center rounded-lg px-3 py-2 ${
                    verificationBadge?.tone === "success"
                      ? "bg-emerald-100"
                      : verificationBadge?.tone === "error"
                        ? "bg-red-100"
                        : verificationBadge?.tone === "warning"
                          ? "bg-amber-100"
                          : verificationBadge?.tone === "pending"
                            ? "bg-teal-100"
                            : "bg-white/90"
                  }`}
                >
                  {verificationBadge?.loading ? (
                    <ActivityIndicator size="small" color="#0F766E" />
                  ) : verificationBadge?.tone === "success" ? (
                    <CheckCircle2 size={14} color="#047857" />
                  ) : null}
                  <Text
                    numberOfLines={2}
                    className={`text-xs font-bold ${
                      verificationBadge?.loading ||
                      verificationBadge?.tone === "success"
                        ? "ml-1.5"
                        : ""
                    } ${
                      verificationBadge?.tone === "success"
                        ? "text-emerald-800"
                        : verificationBadge?.tone === "error"
                          ? "text-red-800"
                          : verificationBadge?.tone === "warning"
                            ? "text-amber-800"
                            : verificationBadge?.tone === "pending"
                              ? "text-teal-800"
                              : "text-gray-800"
                    }`}
                  >
                    {verificationBadge?.label ||
                      "Image Uploaded - Not Yet Verified"}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="min-h-[100px] w-full items-center justify-between rounded-[14px] border-[1.5px] border-dashed border-[#10B981] bg-[#ECFDF5] px-[14px] py-[18px]">
                <Pressable
                  onPress={onUploadFile}
                  accessibilityRole="button"
                  accessibilityLabel="Choose from Gallery"
                  className="w-full items-center justify-center"
                >
                  <Upload size={26} color="#047857" />
                  <Text
                    numberOfLines={1}
                    className="mt-2 text-[14px] font-bold text-[#047857]"
                  >
                    Choose from Gallery
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-[11px] font-medium text-[#059669]"
                  >
                    Tap to replace file
                  </Text>
                </Pressable>

                <View className="mt-2.5 w-full flex-row items-center border-t border-[#A7F3D0] pt-2.5">
                  <Text
                    numberOfLines={1}
                    className="mr-2 flex-1 text-[12px] font-semibold text-[#065F46]"
                  >
                    {file.name}
                  </Text>
                  <Pressable
                    onPress={onClear}
                    accessibilityRole="button"
                    accessibilityLabel="Remove file"
                    className="rounded-lg bg-[#FFFFFF] px-2.5 py-1.5"
                  >
                    <Text className="text-[11px] font-bold text-[#DC2626]">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            )
          ) : (
            <Pressable
              onPress={onUploadFile}
              accessibilityRole="button"
              accessibilityLabel="Choose from Gallery"
              className={`min-h-[100px] items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-[#10B981] bg-[#ECFDF5] px-[14px] py-[18px] ${
                hasPhotoOption ? "flex-1" : "w-full"
              }`}
            >
              <Upload size={26} color="#047857" />
              <Text
                numberOfLines={1}
                className="mt-2 text-[14px] font-bold text-[#047857]"
              >
                Choose from Gallery
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={previewVisible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="min-h-[60px] flex-row items-center justify-between border-b border-white/20 px-4">
            <Text
              className="flex-1 text-lg font-bold text-white"
              numberOfLines={1}
            >
              {bareLabel}
            </Text>
            <Pressable
              onPress={() => setPreviewVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close full image preview"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
            >
              <X size={26} color="white" />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center p-3">
            {file ? (
              <Image
                source={{ uri: file.uri }}
                className="h-full w-full"
                resizeMode="contain"
                accessibilityLabel={`Full ${bareLabel} image`}
              />
            ) : null}
          </View>
          <Text className="px-4 pb-4 text-center text-sm text-white/70">
            Review the complete image, then close this preview to continue.
          </Text>
        </SafeAreaView>
      </Modal>
    </>
  );
}

