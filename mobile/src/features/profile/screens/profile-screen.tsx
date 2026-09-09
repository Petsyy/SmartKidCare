import React, { useMemo } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as Icons from "lucide-react-native";
import { PasswordStrengthFeedback } from "@/src/features/auth/components";
import UserGuideModal from "@/src/components/ui/user-guide";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
    <ScreenShell edges={[]}>
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

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={
            role === "teacher"
              ? ["#134E4A", "#0F766E", "#047857"]
              : ["#115E59", "#0F766E", "#059669"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24 }}
          className="mx-5 mt-5 overflow-hidden rounded-3xl p-6 shadow-lg"
        >
          <View className="flex-row items-center">
            <View className="h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-white/40 bg-white">
              <Text className="text-3xl font-bold text-teal-700">
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xs font-semibold uppercase tracking-widest text-teal-100">
                Account overview
              </Text>
              <Text className="mt-1 text-2xl font-bold text-white">
                {fullName || "Your profile"}
              </Text>
              <Text className="mt-1 text-sm text-teal-100">{roleLabel}</Text>
            </View>
          </View>

          <View className="mt-6 flex-row items-center justify-between border-t border-white/20 pt-4">
            <View className="flex-row items-center">
              <View className="h-2 w-2 rounded-full bg-emerald-300" />
              <Text className="ml-2 text-sm font-medium text-white">
                {profile?.isActive === false ? "Inactive account" : "Active account"}
              </Text>
            </View>
            {showAssignedCenter && profile?.employeeId ? (
              <Text className="text-xs font-medium text-teal-100">
                ID {profile.employeeId}
              </Text>
            ) : null}
          </View>
        </LinearGradient>

        <View className="mx-5 mb-5 mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <View className="mb-5 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
              <Icons.Contact size={20} color="#0F766E" />
            </View>
            <View className="ml-3">
              <Text className="text-lg font-bold text-gray-900">
                Contact Information
              </Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                How we can reach you
              </Text>
            </View>
          </View>

          <View>
            <View className="flex-row items-center mb-6">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
                <Icons.Mail size={20} color="#0F766E" />
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
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
                <Icons.Phone size={20} color="#0F766E" />
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
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
                  <Icons.MapPin size={20} color="#0F766E" />
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

        <View className="mx-5 mb-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
              <Icons.ShieldCheck size={20} color="#047857" />
            </View>
            <View className="ml-3">
              <Text className="text-lg font-bold text-gray-900">
                Account & Settings
              </Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                Security and support
              </Text>
            </View>
          </View>

          <View>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Change password"
              className="flex-row items-center justify-between border-b border-gray-100 py-4"
            >
              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <Icons.LockKeyhole size={19} color="#0F766E" />
                </View>
                <View className="ml-3">
                  <Text className="text-base font-semibold text-gray-800">
                    Change Password
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    Keep your account secure
                  </Text>
                </View>
              </View>
              <Icons.ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowHelpModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Open help and user guide"
              className="flex-row items-center justify-between py-4"
            >
              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <Icons.CircleHelp size={19} color="#0F766E" />
                </View>
                <View className="ml-3">
                  <Text className="text-base font-semibold text-gray-800">
                    Help & User Guide
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    Find answers and walkthroughs
                  </Text>
                </View>
              </View>
              <Icons.ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mx-5">
          <TouchableOpacity
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            className="flex-row items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-4"
          >
            <Icons.LogOut size={20} color="#DC2626" />
            <Text className="ml-2 text-base font-semibold text-red-600">
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
          <View
            className="w-full rounded-t-3xl bg-white px-6 pt-6"
            style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
          >
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
