import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthContext } from "../../src/context/AuthContext";
import { getParentProfile } from "@/src/api/parent.api";
import { API_BASE_URL } from "@/src/config/config.api";
import { validatePasswordRules } from "@/src/validations/password-validation";
import PasswordStrengthFeedback from "@/src/components/password-strength-feedback/PasswordStrengthFeedback";
import React, { useState } from "react";
import * as Icons from "lucide-react-native";

type UserProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  role: string;
  phone?: string;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, token } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        try {
          if (token) {
            const profileData = await getParentProfile(token);
            setProfile(profileData);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, [token]),
  );

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          logout();
          router.push("/(auth)/login");
        },
        style: "destructive",
      },
    ]);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const passwordValidation = validatePasswordRules(newPassword);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || "Invalid password");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      Alert.alert("Success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center">
          <View className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </View>
      </SafeAreaView>
    );
  }

  const fullName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <Text className="text-3xl font-extrabold text-white">Profile</Text>
        <Text className="text-lg text-teal-100 mt-1">
          Manage your account settings
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header Profile Card */}
        <View className="m-6 rounded-3xl bg-teal-600 p-8 shadow-lg">
          <View className="flex-row items-center">
            <View className="h-20 w-20 rounded-full bg-white items-center justify-center">
              <Text className="text-3xl font-bold text-teal-600">
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-white">{fullName}</Text>
              <Text className="text-sm text-teal-100 mt-1">Parent</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View className="mx-6 mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <View className="flex-row items-center mb-5">
            <Icons.Phone size={22} color="#14B8A6" />
            <Text className="ml-3 text-lg font-bold text-gray-900">
              Contact Information
            </Text>
          </View>

          <View>
            {/* Email */}
            <View className="flex-row items-center mb-6">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                <Icons.Mail size={20} color="#14B8A6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-sm font-semibold text-gray-500 mb-1">
                  Email
                </Text>
                <Text className="text-base font-medium text-gray-900">
                  {profile?.email}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                <Icons.Phone size={20} color="#14B8A6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-sm font-semibold text-gray-500 mb-1">
                  Phone Number
                </Text>
                <Text className="text-base font-medium text-gray-900">
                  {profile?.phone || "Not provided"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account & Settings */}
        <View className="mx-6 mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <View className="flex-row items-center mb-6">
            <Icons.Shield size={24} color="#14B8A6" />
            <Text className="ml-3 text-lg font-bold text-gray-900">
              Account & Settings
            </Text>
          </View>

          <View className="space-y-1">
            {/* Change Password */}
            <TouchableOpacity
              onPress={() => setShowPasswordModal(true)}
              className="flex-row items-center justify-between py-4 border-b border-gray-100"
            >
              <View className="flex-row items-center flex-1">
                <Icons.Lock size={22} color="#14B8A6" />
                <Text className="ml-3 text-base font-medium text-gray-700">
                  Change Password
                </Text>
              </View>
              <Icons.ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>

            {/* Help & User Guide */}
            <TouchableOpacity className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center flex-1">
                <Icons.HelpCircle size={22} color="#14B8A6" />
                <Text className="ml-3 text-base font-medium text-gray-700">
                  Help & User Guide
                </Text>
              </View>
              <Icons.ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View className="mx-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="rounded-3xl border-2 border-red-400 p-4 flex-row items-center justify-center"
          >
            <Icons.LogOut size={22} color="#F87171" />
            <Text className="ml-2 text-base font-semibold text-red-500">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-end">
          <View className="w-full rounded-t-3xl bg-white p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                Change Password
              </Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Icons.X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {passwordError && (
              <View className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200">
                <Text className="text-sm text-red-700 font-medium">
                  {passwordError}
                </Text>
              </View>
            )}

            <View className="space-y-4 mb-6">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </Text>
                <TextInput
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-900"
                  editable={!passwordLoading}
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </Text>
                <TextInput
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-900"
                  editable={!passwordLoading}
                />
                <PasswordStrengthFeedback password={newPassword} />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </Text>
                <TextInput
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-900"
                  editable={!passwordLoading}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                className="flex-1 rounded-2xl bg-gray-100 p-4 items-center justify-center"
                disabled={passwordLoading}
              >
                <Text className="text-base font-semibold text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChangePassword}
                className="flex-1 rounded-2xl bg-teal-600 p-4 items-center justify-center"
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
