import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff, Lock } from "lucide-react-native";
import { resetForgotPassword } from "@/src/api/authentication.api";
import { validatePasswordRules, getPasswordStrengthFeedback } from "@/src/validations/password-validation";
import PasswordStrengthFeedback from "@/src/components/password-feedback/password-strength-feedback";

export default function ForgotPasswordResetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resetToken?: string | string[] }>();
  const resetToken = useMemo(() => {
    const value = params.resetToken;
    if (Array.isArray(value)) {
      return String(value[0] || "").trim();
    }
    return String(value || "").trim();
  }, [params.resetToken]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidation = useMemo(() => {
    return validatePasswordRules(newPassword);
  }, [newPassword]);

  const passwordFeedback = useMemo(
    () => getPasswordStrengthFeedback(newPassword),
    [newPassword],
  );

  const isPasswordsMatching = newPassword && confirmPassword && newPassword === confirmPassword;
  const isPasswordStrong = passwordFeedback.label === "Strong";
  const isFormValid = isPasswordStrong && isPasswordsMatching;

  const handleResetPassword = async () => {
    if (!resetToken) {
      Alert.alert(
        "Invalid Request",
        "Missing reset token. Please restart forgot password.",
      );
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please complete all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetForgotPassword(resetToken, newPassword);
      Alert.alert("Success", "Password reset successful. You can now log in.", [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Reset Failed", error.message || "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={["#ecfdf5", "#d1fae5", "#a7f3d0"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="ml-4 mt-2 p-2 self-start"
        >
          <ChevronLeft size={28} color="#0d9488" />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center px-6"
        >
          <View className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-3">
                <Lock size={30} color="#0d9488" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 text-center">
                Reset Password
              </Text>
              <Text className="text-lg text-gray-600 text-center mt-2">
                Set a new password for your account.
              </Text>
            </View>

            <Text className="text-base font-semibold text-gray-700 mb-2">
              New Password
            </Text>
            <View className="mb-4">
              <View className="relative">
                <TextInput
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg text-gray-900 pr-12"
                />
                <Pressable
                  onPress={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-4 h-full justify-center"
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </Pressable>
              </View>
              <PasswordStrengthFeedback password={newPassword} />
            </View>

            <Text className="text-base font-semibold text-gray-700 mb-2">
              Confirm Password
            </Text>
            <View className="relative">
              <TextInput
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#9CA3AF"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg text-gray-900 pr-12"
              />
              <Pressable
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 h-full justify-center"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={handleResetPassword}
              disabled={isSubmitting || !isFormValid}
              className="mt-6 rounded-xl overflow-hidden"
              style={({ pressed }) => [
                { opacity: isSubmitting || !isFormValid ? 0.5 : pressed ? 0.85 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full py-4 items-center justify-center rounded-xl"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-bold">
                    Save New Password
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
