import React, { useMemo } from "react";
import { ScrollView } from "react-native";
import UserGuideModal from "@/src/components/ui/user-guide";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import {
  type ProfileRole,
  type UserProfile,
  useProfileScreen,
} from "@/src/features/profile/hooks/useProfileScreen";
import {
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
  OfflineDataCard,
} from "@/src/components/ui";
import {
  ProfileChangePasswordModal,
  ProfileContactCard,
  ProfileOverviewCard,
  ProfileSessionActions,
  ProfileSettingsCard,
} from "../components";

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
    passwordError,
    passwordLoading,
    isChangePasswordFormValid,
    handleLockApp,
    handleLogout,
    handleChangePassword,
    isOffline,
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

  const headerVariant =
    role === "teacher"
      ? "teacherGradient"
      : role === "parent"
        ? "brandGradient"
        : "solid";

  if (loading) {
    return (
      <ScreenShell withKeyboardAvoiding={false}>
        <ScreenHeader
          backgroundVariant={headerVariant}
          title="Profile"
          subtitle="Manage your account settings"
        />
        <ScreenLoadingState
          variant="details"
          title="Loading profile"
          message="Getting your account settings ready."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell edges={[]}>
      <ScreenHeader
        backgroundVariant={headerVariant}
        title="Profile"
        subtitle="Manage your account settings"
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        <ProfileOverviewCard
          role={role}
          roleLabel={roleLabel}
          fullName={fullName}
          firstName={profile?.firstName}
          lastName={profile?.lastName}
          isActive={profile?.isActive}
          showAssignedCenter={showAssignedCenter}
          employeeId={profile?.employeeId}
        />

        <ProfileContactCard
          email={profile?.email}
          phone={profile?.phone}
          showAssignedCenter={showAssignedCenter}
          assignedCenterPrimary={assignedCenterDisplayInfo.primary}
          assignedCenterSecondary={assignedCenterDisplayInfo.secondary}
        />

        <ProfileSettingsCard
          isOffline={isOffline}
          onChangePassword={() => setShowPasswordModal(true)}
          onOpenHelp={() => setShowHelpModal(true)}
        />

        <OfflineDataCard />

        <ProfileSessionActions
          onLockApp={handleLockApp}
          onLogout={handleLogout}
        />
      </ScrollView>

      <ProfileChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentPassword={currentPassword}
        onChangeCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        onChangeNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        onChangeConfirmPassword={setConfirmPassword}
        passwordError={passwordError}
        passwordLoading={passwordLoading}
        isFormValid={isChangePasswordFormValid}
        onSubmit={handleChangePassword}
      />

      <UserGuideModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        role={role}
      />
    </ScreenShell>
  );
}
