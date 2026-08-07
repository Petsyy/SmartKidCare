import { useForm } from "react-hook-form";
import { View, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react-native";
import { requestForgotPasswordOtp } from "@/src/api/authentication.api";
import { AuthLayout, GradientButton } from "@/src/components/ui";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { watch, setValue } = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });
  const email = watch("email");
  const forgotPasswordMutation = useMutation({
    mutationFn: requestForgotPasswordOtp,
  });

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      alert("Please enter your email address.");
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync(trimmedEmail);
      router.push({
        pathname: "/(auth)/forgot-password-otp",
        params: { email: trimmedEmail },
      });
    } catch (error: any) {
      alert(error.message || "Unable to send OTP.");
    }
  };

  return (
    <AuthLayout onBack={() => router.replace("/(auth)/login")}>
      <Text className="text-3xl font-bold text-gray-900 text-center">
        Forgot Password
      </Text>
      <Text className="text-lg text-gray-600 text-center mt-2 mb-6">
        Enter your account email to receive an OTP.
      </Text>

      <Text className="text-base font-semibold text-gray-700 mb-2">
        Email Address
      </Text>
      <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
        <Mail size={20} color="#6b7280" style={{ marginRight: 10 }} />
        <TextInput
          value={email}
          onChangeText={(value) => setValue("email", value)}
          placeholder="email@example.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 text-lg text-gray-900"
        />
      </View>

      <GradientButton
        label="Send OTP"
        onPress={handleSendOtp}
        loading={forgotPasswordMutation.isPending}
        colors={["#10b981", "#059669"]}
        className="mt-6"
      />
    </AuthLayout>
  );
}
