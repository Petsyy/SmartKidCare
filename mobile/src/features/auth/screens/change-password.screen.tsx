import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Eye, EyeOff, Lock } from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import type { User } from "@/src/context/auth-context";
import { completeTeacherPasswordSetup } from "@/src/api/authentication.api";
import { getPasswordStrengthFeedback } from "@/src/validations/password-validation";
import { PasswordStrengthFeedback } from "@/src/features/auth/components";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ setupToken?: string | string[] }>();
  const setupToken = useMemo(() => {
    const value = params.setupToken;
    if (Array.isArray(value)) {
      return String(value[0] || "").trim();
    }
    return String(value || "").trim();
  }, [params.setupToken]);

  const { watch, setValue } = useForm<{
    newPassword: string;
    confirmPassword: string;
  }>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });
  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordSetupMutation = useMutation({
    mutationFn: ({ setupToken, newPassword }: { setupToken: string; newPassword: string }) =>
      completeTeacherPasswordSetup(setupToken, newPassword),
  });

  const passwordFeedback = useMemo(
    () => getPasswordStrengthFeedback(newPassword),
    [newPassword],
  );

  const isPasswordsMatching = newPassword && confirmPassword && newPassword === confirmPassword;
  const isPasswordStrong = passwordFeedback.label === "Strong";
  const isFormValid = isPasswordStrong && isPasswordsMatching;

  const handleSetPassword = async () => {
    if (!setupToken) {
      Alert.alert("Invalid Request", "Missing setup token. Please log in again.");
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

    try {
      const { token: authToken, user: apiUser } =
        await passwordSetupMutation.mutateAsync({ setupToken, newPassword });

      const appUser: User = {
        id: apiUser._id,
        email: apiUser.email,
        role:
          apiUser.role === "parent" || apiUser.role === "teacher"
            ? apiUser.role
            : "teacher",
        needsToConfirmLink: apiUser.needsToConfirmLink,
      };

      await login(appUser, authToken);
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Setup Failed", error.message || "Unable to set password.");
    }
  };

  return (
    <LinearGradient colors={["#ecfdf5", "#d1fae5", "#a7f3d0"]} className="flex-1">
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
              <Text className="text-2xl font-bold text-gray-900 text-center">
                Set New Password
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                Create your permanent password to activate your account.
              </Text>
            </View>

            <Text className="text-sm font-semibold text-gray-700 mb-2">
              New Password
            </Text>
            <View className="mb-4">
              <View className="relative">
                <TextInput
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(value) => setValue("newPassword", value)}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 pr-12"
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

            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </Text>
            <View className="relative">
              <TextInput
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(value) => setValue("confirmPassword", value)}
                placeholder="Re-enter new password"
                placeholderTextColor="#9CA3AF"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 pr-12"
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
              onPress={handleSetPassword}
              disabled={passwordSetupMutation.isPending || !isFormValid}
              className="mt-6 rounded-xl overflow-hidden"
              style={({ pressed }) => [{ opacity: pressed && isFormValid ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={isFormValid ? ["#10b981", "#059669"] : ["#d1d5db", "#9ca3af"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full py-4 items-center justify-center rounded-xl"
              >
                {passwordSetupMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className={isFormValid ? "text-white text-lg font-bold" : "text-gray-500 text-lg font-bold"}>
                    Save Password
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
