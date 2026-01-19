import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { Baby, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@/src/hooks/useAuth";
import type { User } from "@/src/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // TODO: call API here

    const fakeUser: User = {
      id: "123",
      email,
      role: "parent",
    };

    login(fakeUser);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-10">
            <View className="w-20 h-20 flex items-center justify-center rounded-full bg-green-600 p-2 mx-auto shadow-lg">
              <Baby size={35} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center">
              Welcome Back
            </Text>
            <Text className="text-base text-gray-500 text-center mt-2">
              Sign in to your account
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5">
            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View className="relative flex-row items-center">
                <TextInput
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl pr-12"
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  className="absolute right-4"
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ height: '100%', justifyContent: 'center' }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#16a34a" />
                  ) : (
                    <Eye size={20} color="#16a34a" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              className="w-full bg-green-600 py-4 rounded-xl mt-6"
              onPress={handleLogin}
            >
              <Text className="text-white text-center font-semibold">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Don't have an account? </Text>
            <Link href="/role-selection" asChild>
              <TouchableOpacity>
                <Text className="text-green-600 font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
