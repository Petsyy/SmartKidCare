import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useAdminSettings,
  useAdminSecurityForm,
  useAdminProfileForm,
  useAdminPreferencesManager,
  type SettingsSectionId,
  SETTINGS_SECTIONS,
  ProfileSection,
  SecuritySection,
  PreferencesSection,
  SystemSection,
  SettingsNavSidebar,
  SettingsLoadingSkeleton,
} from "@/features/settings";

export default function AdminSettings() {
  const navigate = useNavigate();
  const {
    profile,
    preferences,
    setPreferences,
    isAdmin,
    isLoading,
    loadError,
    loadSettings,
    saveProfile,
    savePreferences,
    sendPasswordChangeOtp,
    savePassword,
  } = useAdminSettings();

  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("profile");

  // Profile Form Manager
  const {
    isProfileEditing,
    profileState,
    profileForm,
    profileCompletion,
    validateProfileField,
    onSubmitProfile,
    handleEnableProfileEdit,
    handleCancelProfileEdit,
  } = useAdminProfileForm({ profile, saveProfile });

  // Preferences Manager
  const {
    preferenceState,
    handlePreferenceToggle,
    handleSavePreferences,
    enabledPreferenceCount,
  } = useAdminPreferencesManager({
    preferences,
    setPreferences,
    savePreferences,
  });

  // Password & Security 2FA Manager
  const {
    passwordForm,
    passwordState,
    passwordOtpState,
    passwordFieldErrors,
    securityStatus,
    passwordPolicyChecks,
    canRequestPasswordOtpValue,
    canSubmitPasswordChangeValue,
    handlePasswordInputChange,
    handleRequestPasswordOtp,
    onSubmitSecurity,
  } = useAdminSecurityForm({
    sendPasswordChangeOtp,
    savePassword,
  });

  const sectionStatus: Record<SettingsSectionId, string> = {
    profile: `${profileCompletion}% complete`,
    security: securityStatus,
    preferences: `${enabledPreferenceCount}/2 configurable options enabled`,
    system: "",
  };

  const activeSectionMeta =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection) ??
    SETTINGS_SECTIONS[0];
  const ActiveSectionIcon = activeSectionMeta.icon;

  return (
    <Layout
      activeItem="monitoring/settings"
      breadcrumbs={["Barangay Captain", "Settings"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Account Settings"
          subtitle="Manage your profile, security preferences, and administrative options"
        />

        {isLoading && <SettingsLoadingSkeleton />}

        {!isLoading && loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-500/40 dark:bg-red-500/10">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              onClick={() => void loadSettings()}
              className="cursor-pointer mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !loadError && !isAdmin && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            This page is available for admin accounts only.
          </div>
        )}

        {!isLoading && !loadError && isAdmin && (
          <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)] items-start">
            <SettingsNavSidebar
              sections={SETTINGS_SECTIONS}
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              sectionStatus={sectionStatus}
            />

            <section className="rounded-3xl border border-slate-200/60 bg-white p-4 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-all dark:border-white/5 dark:bg-[#0A101D]/90 sm:p-6 lg:p-8">
              <div className="mb-8 flex items-start gap-4">
                <div
                  className={`rounded-xl p-3 shadow-sm ${activeSectionMeta.iconClassName}`}
                >
                  <ActiveSectionIcon size={22} strokeWidth={2.5} />
                </div>
                <div className="mt-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {activeSectionMeta.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {activeSectionMeta.description}
                  </p>
                </div>
              </div>

              {activeSection === "profile" && (
                <ProfileSection
                  isProfileEditing={isProfileEditing}
                  profileState={profileState}
                  form={profileForm}
                  onEnableEdit={handleEnableProfileEdit}
                  onCancelEdit={handleCancelProfileEdit}
                  onSubmit={onSubmitProfile}
                  validateField={validateProfileField}
                />
              )}

              {activeSection === "system" && <SystemSection />}

              {activeSection === "security" && (
                <SecuritySection
                  form={passwordForm}
                  passwordState={passwordState}
                  passwordOtpState={passwordOtpState}
                  passwordFieldErrors={passwordFieldErrors}
                  passwordPolicyChecks={passwordPolicyChecks}
                  canRequestPasswordOtpValue={canRequestPasswordOtpValue}
                  canSubmitPasswordChangeValue={canSubmitPasswordChangeValue}
                  onSubmit={onSubmitSecurity}
                  onPasswordInputChange={handlePasswordInputChange}
                  onRequestOtp={handleRequestPasswordOtp}
                />
              )}

              {activeSection === "preferences" && (
                <PreferencesSection
                  preferences={preferences}
                  preferenceState={preferenceState}
                  onPreferenceToggle={handlePreferenceToggle}
                  onSave={handleSavePreferences}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
