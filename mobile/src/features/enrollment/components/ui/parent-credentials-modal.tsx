import { Modal, Pressable, Share, Text, View } from "react-native";
import { CheckCircle2, Copy, Share2 } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

export interface ParentCredentialsModalProps {
  visible: boolean;
  email: string;
  tempPassword?: string | null;
  onClose: () => void;
}

export function ParentCredentialsModal({
  visible,
  email,
  tempPassword,
  onClose,
}: ParentCredentialsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const message = tempPassword
        ? `SmartKidCare Login\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease change your password on first login.`
        : `SmartKidCare Login\nEmail: ${email}\n\nYour child has been enrolled. You can log in using your existing password.`;
      
      await Share.share({
        message,
        title: "SmartKidCare Parent Credentials",
      });
    } catch (error) {
      console.error("Error sharing credentials:", error);
    }
  };

  const handleCopy = async () => {
    try {
      const message = tempPassword
        ? `Email: ${email}\nTemporary Password: ${tempPassword}`
        : `Email: ${email}\n(Use existing password)`;
      
      await Clipboard.setStringAsync(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying credentials:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-teal-50 rounded-full items-center justify-center mb-4">
              <CheckCircle2 size={32} color="#0D9488" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Enrollment Successful
            </Text>
            <Text className="text-base text-gray-600 text-center leading-6">
              {tempPassword
                ? "A new parent account was created. Please share these credentials."
                : "The child was linked to an existing parent account."}
            </Text>
          </View>

          <View className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-500 mb-1">Login Email</Text>
              <Text className="text-base font-semibold text-gray-900">{email}</Text>
            </View>
            
            {tempPassword ? (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">Temporary Password</Text>
                <Text className="text-lg font-mono font-bold text-teal-700 tracking-wider">
                  {tempPassword}
                </Text>
                <Text className="text-xs text-rose-500 mt-2 font-medium">
                  * Must be changed on first login
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">Password</Text>
                <Text className="text-base font-medium text-gray-700 italic">
                  Parent already has an account. Use existing password.
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-3 mb-4">
            <Pressable
              onPress={handleCopy}
              className="flex-1 flex-row items-center justify-center gap-2 bg-gray-100 py-3.5 rounded-xl active:bg-gray-200"
            >
              <Copy size={20} color="#4B5563" />
              <Text className="text-gray-700 font-semibold">{copied ? "Copied!" : "Copy"}</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              className="flex-1 flex-row items-center justify-center gap-2 bg-teal-50 py-3.5 rounded-xl active:bg-teal-100"
            >
              <Share2 size={20} color="#0D9488" />
              <Text className="text-teal-700 font-semibold">Share</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onClose}
            className="w-full bg-teal-600 py-4 rounded-xl active:bg-teal-700 shadow-sm"
            style={{
              shadowColor: "#0D9488",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white text-center font-bold text-lg">Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
