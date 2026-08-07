import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { View, Text, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import type { User } from "@/src/context/auth-context";
import { completeTeacherPasswordSetup } from "@/src/api/authentication.api";
import { getPasswordStrengthFeedback } from "@/src/validations/password-validation";
import { PasswordStrengthFeedback } from "@/src/features/auth/components";
import { AuthLayout, PasswordInput, GradientButton } from "@/src/components/ui";

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
    <AuthLayout onBack={() => router.replace("/(auth)/login")}>
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
        <PasswordInput
          value={newPassword}
          onChangeText={(value) => setValue("newPassword", value)}
          placeholder="Enter new password"
        />
        <PasswordStrengthFeedback password={newPassword} />
      </View>

      <Text className="text-sm font-semibold text-gray-700 mb-2">
        Confirm Password
      </Text>
      <PasswordInput
        value={confirmPassword}
        onChangeText={(value) => setValue("confirmPassword", value)}
        placeholder="Re-enter new password"
      />

      <GradientButton
        label="Save Password"
        onPress={handleSetPassword}
        disabled={!isFormValid}
        loading={passwordSetupMutation.isPending}
        colors={["#10b981", "#059669"]}
        className="mt-6"
      />
    </AuthLayout>
  );
}
