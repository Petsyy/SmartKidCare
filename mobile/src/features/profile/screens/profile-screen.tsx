import React, { useMemo } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Icons from "lucide-react-native";
import { PasswordStrengthFeedback } from "@/src/features/auth/components";
import UserGuideModal from "@/src/components/ui/user-guide";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import {
  type ProfileRole,
  type UserProfile,
  useProfileScreen,
} from "@/src/features/profile/hooks/useProfileScreen";
import {
  PasswordInput,
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "@/src/components/ui";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  role: ProfileRole;
  roleLabel: string;
  fetchProfile: () => Promise<UserProfile>;
  showAssignedCenter?: boolean;
};

export default function ProfileScreen({
  role,
  roleLabel,
  fetchProfile,
  showAssignedCenter = false,
}: Props) {
  const {
    profile,
    loading,
    showPasswordModal,
    setShowPasswordModal,
    showHelpModal,
    setShowHelpModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    hideCurrentPassword,
    setHideCurrentPassword,
    hideNewPassword,
    setHideNewPassword,
    hideConfirmPassword,
    setHideConfirmPassword,
    passwordError,
    passwordLoading,
    isChangePasswordFormValid,
    handleLogout,
    handleChangePassword,
  } = useProfileScreen({ fetchProfile });

  const fullName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  const assignedCenterDisplayInfo = useMemo(
    () =>
      getDaycareCenterDisplay(
        profile?.daycareCenter || profile?.assignedCenter || "",
      ),
    [profile],
  );

  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant={
            role === "teacher"
              ? "teacherGradient"
              : role === "parent"
                ? "brandGradient"
                : "solid"
          }
          title="Profile"
          subtitle="Manage your account settings"
        />
        <ScreenLoadingState
          title="Loading profile"
          message="Getting your account settings ready."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader
        backgroundVariant={
          role === "teacher"
            ? "teacherGradient"
            : role === "parent"
              ? "brandGradient"
              : "solid"
        }
        title="Profile"
        subtitle="Manage your account settings"
      />

      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <LinearGradient
          colors={["#134E4A", "#0F766E", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24 }}
          className="m-6 overflow-hidden rounded-3xl p-8 shadow-lg"
        >
          <View className="flex-row items-center">
            <View className="h-20 w-20 rounded-full bg-white items-center justify-center">
              <Text className="text-3xl font-bold text-teal-700">
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-white">{fullName}</Text>
              <Text className="text-sm text-teal-100 mt-1">{roleLabel}</Text>
            </View>
          </View>
        </LinearGradient>

        <View className="mx-6 mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <View className="flex-row items-center mb-5">
            <Icons.Phone size={22} color="#14B8A6" />
            <Text className="ml-3 text-lg font-bold text-gray-900">
              Contact Information
            </Text>
          </View>

          <View>
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

            <View
              className={`flex-row items-center ${showAssignedCenter ? "mb-6" : ""}`}
            >
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

            {showAssignedCenter ? (
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <Icons.MapPin size={20} color="#14B8A6" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-sm font-semibold text-gray-500 mb-1">
                    Assigned Center
                  </Text>
                  <Text className="text-base font-medium text-gray-900">
                    {assignedCenterDisplayInfo.primary}
                  </Text>
                  {assignedCenterDisplayInfo.secondary ? (
                    <Text className="mt-0.5 text-sm text-gray-600">
                      {assignedCenterDisplayInfo.secondary}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View className="mx-6 mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <View className="flex-row items-center mb-6">
            <Icons.Shield size={24} color="#14B8A6" />
            <Text className="ml-3 text-lg font-bold text-gray-900">
              Account & Settings
            </Text>
          </View>

          <View className="space-y-1">
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

            <TouchableOpacity
              className="flex-row items-center justify-between py-4"
              onPress={() => setShowHelpModal(true)}
            >
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

            {passwordError ? (
              <View className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200">
                <Text className="text-sm text-red-700 font-medium">
                  {passwordError}
                </Text>
              </View>
            ) : null}

            <View className="space-y-4 mb-6">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </Text>
                <PasswordInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  inputClassName="rounded-2xl"
                  editable={!passwordLoading}
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </Text>
                <PasswordInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  inputClassName="rounded-2xl"
                  editable={!passwordLoading}
                />
                <PasswordStrengthFeedback password={newPassword} />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </Text>
                <PasswordInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  inputClassName="rounded-2xl"
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
                className={`flex-1 rounded-2xl p-4 items-center justify-center ${
                  passwordLoading || !isChangePasswordFormValid
                    ? "bg-gray-300"
                    : "bg-teal-600"
                }`}
                disabled={passwordLoading || !isChangePasswordFormValid}
              >
                {passwordLoading ? (
                  <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Text
                    className={`text-base font-semibold ${
                      passwordLoading || !isChangePasswordFormValid
                        ? "text-gray-500"
                        : "text-white"
                    }`}
                  >
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <UserGuideModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        role={role}
      />
    </ScreenShell>
  );
}
