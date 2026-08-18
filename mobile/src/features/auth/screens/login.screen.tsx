import { useState, type ComponentType, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, ShieldCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/use-auth";
import type { User } from "@/src/context/auth-context";
import { login as apiLogin } from "@/src/api/authentication.api";
import { PasswordInput, GradientButton } from "@/src/components/ui";

type LoginFormValues = {
  identifier: string;
  password: string;
};

const FormField = ({
  label,
  children,
  icon: Icon,
}: {
  label: string;
  children: ReactNode;
  icon?: ComponentType<{ size?: number; color?: string; style?: object }>;
}) => (
  <View className="mb-5">
    <View className="flex-row items-center mb-2">
      {Icon && <Icon size={14} color="#6b7280" style={{ marginRight: 6 }} />}
      <Text className="text-lg font-semibold text-gray-700">{label}</Text>
      <Text className="ml-1 text-red-500">*</Text>
    </View>
    {children}
  </View>
);

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [focusedField, setFocusedField] = useState<"identifier" | "password" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { setValue, watch } = useForm<LoginFormValues>({
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const identifier = watch("identifier");
  const password = watch("password");

  const loginMutation = useMutation({
    mutationFn: apiLogin,
  });

  const handleLogin = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setErrorMessage("Please enter both login credential and password.");
      return;
    }

    setErrorMessage("");

    try {
      const response = await loginMutation.mutateAsync({
        identifier: trimmedIdentifier,
        password,
      });

      if (response.requiresPasswordChange) {
        if (response.passwordSetupToken && response.requiresOtp === false) {
          router.push({
            pathname: "/(auth)/change-password",
            params: { setupToken: response.passwordSetupToken },
          });
          return;
        }

        router.push({
          pathname: "/(auth)/verify-otp",
          params: { email: response.email },
        });
        return;
      }

      const { token: authToken, user: apiUser } = response;

      if (__DEV__) {
        console.log("[Login JWT Token]", authToken);
      }

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
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.";
      setErrorMessage(message);
    }
  };

  return (
    <LinearGradient
      colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]}
      className="flex-1"
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1">
            <View className="absolute -top-16 -right-14 h-48 w-48 rounded-full bg-emerald-200/70" />
            <View className="absolute -bottom-20 -left-14 h-56 w-56 rounded-full bg-teal-200/50" />

            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: 20,
                paddingBottom: 24,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="rounded-3xl overflow-hidden shadow-xl shadow-emerald-200">
                <LinearGradient
                  colors={["#14b8a6", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="pb-16 pt-8 px-6"
                >
                  <View className="items-center">
                    <View className="w-24 h-24 items-center justify-center rounded-full bg-white/20 mb-5 border-2 border-white/30">
                      <Image
                        source={require("@/assets/images/smartkidcare.png")}
                        className="w-20 h-20"
                        style={{ opacity: 0.82 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text className="text-3xl font-extrabold text-white mb-2 text-center tracking-tight">
                      SmartKidCare
                    </Text>
                    <Text className="text-white/95 text-center text-lg leading-6">
                      Sign in to manage attendance and feeding records.
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View className="-mt-10 pb-4">
                <View className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-100 border border-emerald-50">
                  <FormField label="Email Address" icon={Mail}>
                    <TextInput
                      className={`px-4 py-3.5 rounded-xl text-lg text-gray-900 border ${
                        focusedField === "identifier"
                          ? "border-emerald-500 bg-white"
                          : "border-gray-200 bg-gray-50"
                      }`}
                      placeholder="Enter your login email"
                      placeholderTextColor="#9CA3AF"
                      value={identifier}
                      onChangeText={(text) => {
                        if (errorMessage) setErrorMessage("");
                        setValue("identifier", text);
                      }}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onFocus={() => setFocusedField("identifier")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </FormField>

                  <FormField label="Password" icon={Lock}>
                    <PasswordInput
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={(text) => {
                        if (errorMessage) setErrorMessage("");
                        setValue("password", text);
                      }}
                      returnKeyType="go"
                      onSubmitEditing={handleLogin}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </FormField>

                  {errorMessage ? (
                    <View className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                      <Text className="text-base text-red-700">
                        {errorMessage}
                      </Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    className="self-end mb-4"
                    onPress={() => router.push("/(auth)/forgot-password")}
                  >
                    <Text className="text-emerald-700 text-base font-semibold">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  <GradientButton
                    label="Sign In"
                    onPress={handleLogin}
                    loading={loginMutation.isPending}
                    loadingLabel="Signing In..."
                  />

                  <View className="mt-4 flex-row items-center justify-center">
                    <ShieldCheck size={14} color="#047857" />
                    <Text className="ml-2 text-sm text-emerald-800">
                      Protected login with secure account verification.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
