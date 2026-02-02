import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link2, Baby } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/src/hooks/useAuth";
import { linkChild } from "@/src/api/api";

type Props = {
  onLinked: () => void;
};

export default function LinkChildCode({ onLinked }: Props) {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert("Missing Code", "Please enter the child link code.");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Session expired. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      await linkChild(token, trimmed);
      onLinked();
    } catch (error: any) {
      Alert.alert(
        "Link Failed",
        error.message || "Invalid or expired link code. Please ask your school administrator for a new code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#ecfdf5", "#d1fae5", "#a7f3d0"]} className="flex-1">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center px-6"
        >
          <View className="items-center mb-8">
            <View className="w-20 h-20 items-center justify-center rounded-full bg-teal-500/30 mb-4 border-2 border-teal-400/50">
              <Baby size={40} color="#0d9488" />
            </View>
            <Text className="text-2xl font-bold text-gray-800 text-center">
              No child linked to your account
            </Text>
            <Text className="text-gray-600 text-center mt-2 px-4">
              Ask your school administrator for a child link code.
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Enter Child Link Code
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
              <Link2 size={20} color="#6b7280" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-base text-gray-900"
                placeholder="e.g. ABC123"
                placeholderTextColor="#9CA3AF"
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="mt-6 rounded-xl overflow-hidden"
              style={({ pressed }) => [{ opacity: loading ? 0.7 : pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full py-4 items-center justify-center rounded-xl"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-bold">Link Child</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
