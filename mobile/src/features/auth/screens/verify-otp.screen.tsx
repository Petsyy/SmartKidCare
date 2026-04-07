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
import { ChevronLeft, MailCheck } from "lucide-react-native";
import {
  resendTeacherPasswordOtp,
  verifyTeacherPasswordOtp,
} from "@/src/api/authentication.api";

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

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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

    setIsVerifying(true);
    try {
      const data = await verifyTeacherPasswordOtp(email, normalizedOtp);
      router.replace({
        pathname: "/(auth)/change-password",
        params: { setupToken: data.passwordSetupToken },
      });
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Invalid OTP.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert("Invalid Request", "Missing teacher email. Please log in again.");
      return;
    }

    setIsResending(true);
    try {
      await resendTeacherPasswordOtp(email);
      Alert.alert("OTP Sent", "A new OTP has been sent to your email.");
    } catch (error: any) {
      Alert.alert("Unable to Resend OTP", error.message || "Please try again.");
    } finally {
      setIsResending(false);
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
                setOtp(value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#9CA3AF"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-center tracking-[6px]"
            />

            <Pressable
              onPress={handleVerifyOtp}
              disabled={isVerifying}
              className="mt-6 rounded-xl overflow-hidden"
              style={({ pressed }) => [{ opacity: isVerifying ? 0.7 : pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full py-4 items-center justify-center rounded-xl"
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-bold">Verify OTP</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleResendOtp}
              disabled={isResending}
              className="mt-4 items-center"
              style={({ pressed }) => [{ opacity: isResending ? 0.7 : pressed ? 0.8 : 1 }]}
            >
              <Text className="text-teal-700 font-semibold">
                {isResending ? "Resending..." : "Resend OTP"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
