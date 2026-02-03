import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Baby, Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import { useAuth } from "@/src/hooks/useAuth";
import type { User } from "@/src/context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';
import { login as apiLogin } from "@/src/api/authentication.api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FormField = ({ label, children, icon: Icon }: { label: string; children: React.ReactNode; icon?: React.ComponentType<{ size?: number; color?: string; style?: object }> }) => (
  <View className="mb-5">
    <View className="flex-row items-center mb-2">
      {Icon && <Icon size={14} color="#6b7280" style={{ marginRight: 6 }} />}
      <Text className="text-base font-semibold text-gray-700">{label}</Text>
      <Text className="ml-1 text-red-500">*</Text>
    </View>
    {children}
  </View>
);

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      alert("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const { token: authToken, user: apiUser } = await apiLogin({ email: trimmedEmail, password });

      const appUser: User = {
        id: apiUser._id,
        email: apiUser.email,
        role: apiUser.role === "parent" || apiUser.role === "teacher" ? apiUser.role : "teacher",
      };

      await AsyncStorage.setItem("token", authToken);
      await AsyncStorage.setItem("user", JSON.stringify(appUser));

      login(appUser, authToken);
    } catch (error: any) {
      alert(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5', '#a7f3d0']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className='flex-1'
        >
          <View className="flex-1 justify-center">
            <View className="mx-5 rounded-3xl overflow-hidden shadow-lg shadow-green-300">
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="pb-16 pt-8 px-5"
              >
                <View className="items-center">
                  <View className="w-24 h-24 items-center justify-center rounded-full bg-white/20 mb-6 border-2 border-white/30">
                    <Baby size={40} color="white" />
                  </View>
                  <Text className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</Text>
                  <Text className="text-white/90 text-center text-base">Sign in to your SmartKidCare account</Text>
                </View>
              </LinearGradient>
            </View>

            <View className="px-5 -mt-10 pb-6">
              <View className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200">
                <FormField label="Email Address" icon={Mail}>
                  <TextInput
                    className="px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-green-500 focus:bg-white"
                    placeholder="email@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </FormField>

                <FormField label="Password" icon={Lock}>
                  <View className="relative">
                    <TextInput
                      className="px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 pr-12 focus:border-green-500 focus:bg-white"
                      secureTextEntry={!showPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      className="absolute right-4 h-full justify-center"
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      {showPassword ? (
                        <EyeOff size={22} color="#6b7280" />
                      ) : (
                        <Eye size={22} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </FormField>

                <TouchableOpacity className="self-end mb-4">
                  <Text className="text-green-600 text-sm font-medium">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  className="rounded-xl overflow-hidden"
                  style={({ pressed }) => [{ opacity: isLoading ? 0.7 : pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full py-4 items-center justify-center rounded-xl shadow-lg shadow-green-200"
                    style={{ opacity: isLoading ? 0.7 : 1 }}
                  >
                    {isLoading ? (
                      <View className="flex-row items-center justify-center gap-3">
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="text-white text-center text-lg font-bold">
                          Signing In...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white text-center text-lg font-bold">
                        Sign In
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}