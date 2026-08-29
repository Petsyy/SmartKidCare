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
  error,
}: {
  label: string;
  children: ReactNode;
  icon?: ComponentType<{ size?: number; color?: string; style?: object }>;
  error?: string;
}) => (
  <View className="mb-5">
    <View className="flex-row items-center mb-2">
      {Icon && <Icon size={14} color="#6b7280" style={{ marginRight: 6 }} />}
      <Text className="text-lg font-semibold text-gray-700">{label}</Text>
      <Text className="ml-1 text-red-500">*</Text>
    </View>
    {children}
    {error ? (
      <Text
        className="mt-2 text-sm font-medium text-red-700"
        accessibilityLiveRegion="polite"
      >
        {error}
      </Text>
    ) : null}
  </View>
);

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [focusedField, setFocusedField] = useState<
    "identifier" | "password" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormValues, string>>
  >({});

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
    const nextFieldErrors: Partial<Record<keyof LoginFormValues, string>> = {};

    if (!trimmedIdentifier) {
      nextFieldErrors.identifier = "Enter your registered email address.";
    }
    if (!password) {
      nextFieldErrors.password = "Enter your password.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage("");
      return;
    }

    setFieldErrors({});
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
              <View className="mb-6 items-center px-4">
                <View className="h-20 w-20 items-center justify-center rounded-3xl border border-emerald-100 bg-white shadow-lg shadow-emerald-200">
                  <Image
                    source={require("@/assets/images/smartkidcare.png")}
                    className="h-16 w-16"
                    style={{ opacity: 0.9 }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  className="mt-4 text-center text-3xl font-extrabold tracking-tight text-emerald-900"
                  accessibilityRole="header"
                >
                  SmartKidCare
                </Text>
                <Text className="mt-1 text-center text-base leading-6 text-emerald-800">
                  Teacher and parent care portal
                </Text>
              </View>

              <View className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-100">
                <LinearGradient
                  colors={["#14b8a6", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-2 w-full"
                />
                <View className="p-6">
                  <View className="mb-6">
                    <Text
                      className="text-2xl font-extrabold text-gray-900"
                      accessibilityRole="header"
                    >
                      Sign in to your account
                    </Text>
                    <Text className="mt-1 text-base leading-6 text-gray-600">
                      Enter your registered email and password to continue.
                    </Text>
                  </View>

                  <FormField
                    label="Email Address"
                    icon={Mail}
                    error={fieldErrors.identifier}
                  >
                    <TextInput
                      className={`px-4 py-3.5 rounded-xl text-lg text-gray-900 border ${
                        fieldErrors.identifier
                          ? "border-red-500 bg-red-50"
                          : focusedField === "identifier"
                            ? "border-emerald-500 bg-white"
                            : "border-gray-200 bg-gray-50"
                      }`}
                      placeholder="Enter your login email"
                      placeholderTextColor="#9CA3AF"
                      value={identifier}
                      onChangeText={(text) => {
                        if (errorMessage) setErrorMessage("");
                        if (fieldErrors.identifier) {
                          setFieldErrors((current) => ({
                            ...current,
                            identifier: undefined,
                          }));
                        }
                        setValue("identifier", text);
                      }}
                      accessibilityLabel="Email address"
                      accessibilityHint="Enter the email address registered to your account"
                      keyboardType="email-address"
                      autoComplete="email"
                      textContentType="emailAddress"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onFocus={() => setFocusedField("identifier")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </FormField>

                  <FormField
                    label="Password"
                    icon={Lock}
                    error={fieldErrors.password}
                  >
                    <PasswordInput
                      placeholder="Enter your password"
                      value={password}
                      inputClassName={
                        fieldErrors.password ? "border-red-500 bg-red-50" : ""
                      }
                      onChangeText={(text) => {
                        if (errorMessage) setErrorMessage("");
                        if (fieldErrors.password) {
                          setFieldErrors((current) => ({
                            ...current,
                            password: undefined,
                          }));
                        }
                        setValue("password", text);
                      }}
                      accessibilityLabel="Password"
                      accessibilityHint="Enter your account password"
                      autoComplete="current-password"
                      textContentType="password"
                      returnKeyType="go"
                      onSubmitEditing={handleLogin}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </FormField>

                  {errorMessage ? (
                    <View
                      className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5"
                      accessibilityRole="alert"
                      accessibilityLiveRegion="assertive"
                    >
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

                  <View className="mt-5 flex-row items-center justify-center rounded-2xl bg-emerald-50 px-3 py-3">
                    <ShieldCheck size={16} color="#047857" />
                    <Text className="ml-2 flex-1 text-sm leading-5 text-emerald-800">
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
