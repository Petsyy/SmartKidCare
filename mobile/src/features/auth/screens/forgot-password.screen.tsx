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
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Mail } from "lucide-react-native";
import { requestForgotPasswordOtp } from "@/src/api/authentication.api";

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
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync(trimmedEmail);
      router.push({
        pathname: "/(auth)/forgot-password-otp",
        params: { email: trimmedEmail },
      });
    } catch (error: any) {
      Alert.alert("Request Failed", error.message || "Unable to send OTP.");
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

            <Pressable
              onPress={handleSendOtp}
              disabled={forgotPasswordMutation.isPending}
              className="mt-6 rounded-xl overflow-hidden"
              style={({ pressed }) => [{ opacity: forgotPasswordMutation.isPending ? 0.7 : pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full py-4 items-center justify-center rounded-xl"
              >
                {forgotPasswordMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-bold">Send OTP</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
