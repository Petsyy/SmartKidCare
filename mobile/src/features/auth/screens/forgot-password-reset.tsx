import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { View, Text, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react-native";
import { resetForgotPassword } from "@/src/api/authentication.api";
import { getPasswordStrengthFeedback } from "@/src/validations/password-validation";
import { PasswordStrengthFeedback } from "@/src/features/auth/components";
import { AuthLayout, PasswordInput, GradientButton } from "@/src/components/ui";

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
  const resetMutation = useMutation({
    mutationFn: ({ resetToken, newPassword }: { resetToken: string; newPassword: string }) =>
      resetForgotPassword(resetToken, newPassword),
  });

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

    try {
      await resetMutation.mutateAsync({ resetToken, newPassword });
      Alert.alert("Success", "Password reset successful. You can now log in.", [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Reset Failed", error.message || "Unable to reset password.");
    }
  };

  return (
    <AuthLayout onBack={() => router.replace("/(auth)/login")}>
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
        <PasswordInput
          value={newPassword}
          onChangeText={(value) => setValue("newPassword", value)}
          placeholder="Enter new password"
        />
        <PasswordStrengthFeedback password={newPassword} />
      </View>

      <Text className="text-base font-semibold text-gray-700 mb-2">
        Confirm Password
      </Text>
      <PasswordInput
        value={confirmPassword}
        onChangeText={(value) => setValue("confirmPassword", value)}
        placeholder="Re-enter new password"
      />

      <GradientButton
        label="Save New Password"
        onPress={handleResetPassword}
        disabled={!isFormValid}
        loading={resetMutation.isPending}
        colors={["#10b981", "#059669"]}
        className="mt-6"
      />
    </AuthLayout>
  );
}
