import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasswordInput } from "@/src/components/ui";
import { PasswordStrengthFeedback } from "@/src/features/auth/components";

interface ProfileChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  currentPassword: string;
  onChangeCurrentPassword: (val: string) => void;
  newPassword: string;
  onChangeNewPassword: (val: string) => void;
  confirmPassword: string;
  onChangeConfirmPassword: (val: string) => void;
  passwordError: string | null;
  passwordLoading: boolean;
  isFormValid: boolean;
  onSubmit: () => void;
}

export function ProfileChangePasswordModal({
  visible,
  onClose,
  currentPassword,
  onChangeCurrentPassword,
  newPassword,
  onChangeNewPassword,
  confirmPassword,
  onChangeConfirmPassword,
  passwordError,
  passwordLoading,
  isFormValid,
  onSubmit,
}: ProfileChangePasswordModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-end bg-black/50">
        <View
          className="w-full rounded-t-3xl bg-white px-6 pt-6"
          style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
        >
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">
              Change Password
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close password modal"
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {passwordError ? (
            <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <Text className="text-sm font-medium text-red-700">
                {passwordError}
              </Text>
            </View>
          ) : null}

          <View className="mb-6 space-y-4">
            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Current Password
              </Text>
              <PasswordInput
                value={currentPassword}
                onChangeText={onChangeCurrentPassword}
                placeholder="Enter current password"
                inputClassName="rounded-2xl"
                editable={!passwordLoading}
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                New Password
              </Text>
              <PasswordInput
                value={newPassword}
                onChangeText={onChangeNewPassword}
                placeholder="Enter new password"
                inputClassName="rounded-2xl"
                editable={!passwordLoading}
              />
              <PasswordStrengthFeedback password={newPassword} />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Confirm Password
              </Text>
              <PasswordInput
                value={confirmPassword}
                onChangeText={onChangeConfirmPassword}
                placeholder="Confirm new password"
                inputClassName="rounded-2xl"
                editable={!passwordLoading}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-2xl bg-gray-100 p-4"
              disabled={passwordLoading}
              accessibilityRole="button"
              accessibilityLabel="Cancel change password"
            >
              <Text className="text-base font-semibold text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSubmit}
              className={`flex-1 items-center justify-center rounded-2xl p-4 ${
                passwordLoading || !isFormValid
                  ? "bg-gray-300"
                  : "bg-teal-600"
              }`}
              disabled={passwordLoading || !isFormValid}
              accessibilityRole="button"
              accessibilityLabel="Confirm change password"
            >
              {passwordLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  className={`text-base font-semibold ${
                    passwordLoading || !isFormValid
                      ? "text-gray-500"
                      : "text-white"
                  }`}
                >
                  Change Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

