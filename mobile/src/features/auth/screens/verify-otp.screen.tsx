import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react-native";
import { resendTeacherPasswordOtp, verifyTeacherPasswordOtp, } from "@/src/api/authentication.api";
import { AuthLayout, GradientButton } from "@/src/components/ui";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = useMemo(() => {
    const value = params.email;
    if (Array.isArray(value)) {
      return String(value[0] || "").trim();
    }
    return String(value || "").trim();
  }, [params.email]);

  const { watch, setValue } = useForm<{ otp: string }>({
    defaultValues: {
      otp: "",
    },
  });
  const otp = watch("otp");
  const verifyMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyTeacherPasswordOtp(email, otp),
  });
  const resendMutation = useMutation({
    mutationFn: resendTeacherPasswordOtp,
  });

  const handleVerifyOtp = async () => {
    const normalizedOtp = otp.trim();

    if (!email) {
      Alert.alert("Invalid Request", "Missing teacher email. Please log in again.");
      return;
    }

    if (normalizedOtp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP.");
      return;
    }

    try {
      const data = await verifyMutation.mutateAsync({ email, otp: normalizedOtp });
      router.replace({
        pathname: "/(auth)/change-password",
        params: { setupToken: data.passwordSetupToken },
      });
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Invalid OTP.");
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert("Invalid Request", "Missing teacher email. Please log in again.");
      return;
    }

    try {
      await resendMutation.mutateAsync(email);
      Alert.alert("OTP Sent", "A new OTP has been sent to your email.");
    } catch (error: any) {
      Alert.alert("Unable to Resend OTP", error.message || "Please try again.");
    }
  };

  return (
    <AuthLayout onBack={() => router.replace("/(auth)/login")}>
      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-3">
          <MailCheck size={30} color="#0d9488" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Verify OTP
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Enter the 6-digit code sent to
        </Text>
        <Text className="text-teal-700 font-semibold text-center mt-1">
          {email || "your email"}
        </Text>
      </View>

      <Text className="text-sm font-semibold text-gray-700 mb-2">
        One-Time Password
      </Text>
      <TextInput
        value={otp}
        onChangeText={(value) =>
          setValue("otp", value.replace(/[^0-9]/g, "").slice(0, 6))
        }
        keyboardType="number-pad"
        maxLength={6}
        placeholder="Enter 6-digit OTP"
        placeholderTextColor="#9CA3AF"
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-center tracking-[6px]"
      />

      <GradientButton
        label="Verify OTP"
        onPress={handleVerifyOtp}
        loading={verifyMutation.isPending}
        colors={["#10b981", "#059669"]}
        className="mt-6"
      />

      <Pressable
        onPress={handleResendOtp}
        disabled={resendMutation.isPending}
        className="mt-4 items-center"
        style={({ pressed }) => [{ opacity: resendMutation.isPending ? 0.7 : pressed ? 0.8 : 1 }]}
      >
        <Text className="text-teal-700 font-semibold">
          {resendMutation.isPending ? "Resending..." : "Resend OTP"}
        </Text>
      </Pressable>
    </AuthLayout>
  );
}
