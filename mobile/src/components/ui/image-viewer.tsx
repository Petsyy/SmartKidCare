import React from "react";
import { Modal, View, Pressable, Image, Text, SafeAreaView } from "react-native";
import { X } from "lucide-react-native";

export interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function ImageViewerModal({
  visible,
  imageUrl,
  title = "View Image",
  onClose,
}: ImageViewerModalProps) {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/95">
        <SafeAreaView className="flex-row justify-between items-center px-4 py-3 bg-black/40 absolute top-0 left-0 right-0 z-10">
          <Text className="text-white text-base font-bold ml-2" numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
          >
            <X size={24} color="#FFF" />
          </Pressable>
        </SafeAreaView>
        
        <View className="flex-1 justify-center items-center">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}
