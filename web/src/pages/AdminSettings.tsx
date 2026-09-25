import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {Bell,ShieldCheck,UserCog,Building2,type LucideIcon} from "lucide-react";
import Layout from "../components/layout/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import {type AdminPreferencesForm,type AdminProfileForm,useAdminSettings,
} from "@/features/settings/hooks/useAdminSettings";
import {type PasswordForm,useAdminPassword2FA,
} from "@/features/settings/hooks/useAdminPassword2FA";
import {showAdminPasswordChangedModal,showAdminProfileSavedModal,
} from "@/utils/sweet-alert-modal";

import { ProfileSection } from "@/features/settings/components/ProfileSection";
import { SecuritySection } from "@/features/settings/components/SecuritySection";
import { PreferencesSection } from "@/features/settings/components/PreferencesSection";
import { SystemSection } from "@/features/settings/components/SystemSection";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

type SettingsSectionId = "profile" | "security" | "preferences" | "system";

type SettingsSection = {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "profile",
    title: "Profile",
    description: "Identity and contact info",
    icon: UserCog,
    iconClassName:
      "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:ring-cyan-500/30",
  },
  {
    id: "system",
    title: "School System",
    description: "Platform identity and display",
    icon: Building2,
    iconClassName:
      "bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-500/30",
  },
  {
    id: "security",
    title: "Security",
    description: "Password and sign-in rules",
    icon: ShieldCheck,
    iconClassName:
      "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30",
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "MFA and appearance settings",
    icon: Bell,
    iconClassName:
      "bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-500/30",
  },
];

const DEFAULT_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  otp: "",
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const {
    profile,
    preferences,
    setPreferences,
    isAdmin,
    role,
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
  const visibleSections = role === "system_admin"
    ? SETTINGS_SECTIONS
    : SETTINGS_SECTIONS.filter((section) => section.id !== "system");
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileSnapshot, setProfileSnapshot] =
    useState<AdminProfileForm | null>(null);

  const [profileState, setProfileState] = useState<{
    saving: boolean;
    success: string | null;
    error: string | null;
  }>({
    saving: false,
    success: null,
    error: null,
  });

  const [preferenceState, setPreferenceState] = useState<{
    saving: boolean;
    success: string | null;
    error: string | null;
  }>({
    saving: false,
    success: null,
    error: null,
  });

  const {
    passwordState,
    passwordOtpState,
    passwordFieldErrors,
    securityStatus,
    getPasswordPolicyChecks,
    canRequestPasswordOtp,
    canSubmitPasswordChange,
    handlePasswordInputChange,
    handleRequestPasswordOtp,
    handlePasswordSubmit,
  } = useAdminPassword2FA({
    sendPasswordChangeOtp,
    savePassword,
    onPasswordChanged: async () => {
      await showAdminPasswordChangedModal();
    },
  });

  const profileForm = useForm<AdminProfileForm>({
    defaultValues: profile,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const {
    reset: resetProfileForm,
    getValues: getProfileValues,
    watch: watchProfileForm,
  } = profileForm;

  const passwordForm = useForm<PasswordForm>({
    defaultValues: DEFAULT_PASSWORD_FORM,
  });

  const { watch: watchPasswordForm, reset: resetPasswordForm } = passwordForm;

  const validateProfileField = (
    key: keyof AdminProfileForm,
    value: string,
  ): string | undefined => {
    const trimmedValue = String(value || "").trim();
    const requiredMessages: Partial<Record<keyof AdminProfileForm, string>> = {
      username: "Username is required.",
      firstName: "First name is required.",
      middleName: "Middle name is required.",
      lastName: "Last name is required.",
      email: "Email is required.",
      phone: "Phone number is required.",
    };

    const requiredMessage = requiredMessages[key];
    if (requiredMessage && trimmedValue.length === 0) {
      return requiredMessage;
    }

    if (key === "email" && trimmedValue.length > 0) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);
      if (!isValidEmail) {
        return "Email is invalid.";
      }
    }

    return undefined;
  };

  useEffect(() => {
    resetProfileForm(profile);
  }, [profile, resetProfileForm]);

  useEffect(() => {
    if (passwordState.success) {
      resetPasswordForm(DEFAULT_PASSWORD_FORM);
    }
  }, [passwordState.success, resetPasswordForm]);

  const handlePreferenceToggle = (
    key: keyof AdminPreferencesForm,
    value: boolean,
  ) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const onSubmitProfile = async (form: AdminProfileForm) => {
    if (!isProfileEditing) {
      return;
    }

    const profileKeys: Array<keyof AdminProfileForm> = [
      "username",
      "firstName",
      "middleName",
      "lastName",
      "email",
      "phone",
    ];
    const hasErrors = profileKeys.some((key) =>
      Boolean(validateProfileField(key, String(form[key] ?? ""))),
    );
    if (hasErrors) {
      setProfileState({
        saving: false,
        success: null,
        error: "Please fix the highlighted fields.",
      });
      return;
    }

    setProfileState({ saving: true, success: null, error: null });

    try {
      const savedProfile = await saveProfile(form);
      setProfileState({
        saving: false,
        success: "Profile updated successfully.",
        error: null,
      });
      setIsProfileEditing(false);
      setProfileSnapshot(null);
      resetProfileForm(savedProfile);
      await showAdminProfileSavedModal();
    } catch (error: unknown) {
      setProfileState({
        saving: false,
        success: null,
        error: error instanceof Error ? error.message : "Failed to update profile.",
      });
    }
  };

  const handleSavePreferences = async () => {
    setPreferenceState({ saving: true, success: null, error: null });
    try {
      await savePreferences(preferences);
      setPreferenceState({
        saving: false,
        success: "Preferences saved successfully.",
        error: null,
      });
    } catch (error: unknown) {
      setPreferenceState({
        saving: false,
        success: null,
        error: error instanceof Error ? error.message : "Failed to save preferences.",
      });
    }
  };

  const onSubmitSecurity = async (form: PasswordForm) => {
    const changed = await handlePasswordSubmit(form);
    if (changed) {
      resetPasswordForm(DEFAULT_PASSWORD_FORM);
    }
  };

  const handleEnableProfileEdit = () => {
    setProfileSnapshot({ ...getProfileValues() });
    setProfileState({ saving: false, success: null, error: null });
    setIsProfileEditing(true);
  };

  const handleCancelProfileEdit = () => {
    if (profileSnapshot) {
      resetProfileForm({ ...profileSnapshot });
    }
    setIsProfileEditing(false);
    setProfileSnapshot(null);
    setProfileState({ saving: false, success: null, error: null });
  };

  const profileFormValues = watchProfileForm();
  const passwordFormValues = watchPasswordForm();
  const passwordPolicyChecks = getPasswordPolicyChecks(passwordFormValues);
  const canRequestPasswordOtpValue = canRequestPasswordOtp(passwordFormValues);
  const canSubmitPasswordChangeValue =
    canSubmitPasswordChange(passwordFormValues);

  const requiredProfileCount = [
    profileFormValues.username,
    profileFormValues.firstName,
    profileFormValues.middleName,
    profileFormValues.lastName,
    profileFormValues.email,
    profileFormValues.phone,
  ].filter((value) => value.trim().length > 0).length;
  const profileCompletion = Math.round((requiredProfileCount / 6) * 100);

  const enabledPreferenceCount = [preferences.adminMfaEnabled].filter(
    Boolean,
  ).length;

  const sectionStatus: Record<SettingsSectionId, string> = {
    profile: `${profileCompletion}% complete`,
    security: securityStatus,
    preferences: `${enabledPreferenceCount}/1 enabled`,
    system: "",
  };

  const activeSectionMeta =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection) ??
    SETTINGS_SECTIONS[0];
  const ActiveSectionIcon = activeSectionMeta.icon;

  return (
    <Layout
      activeItem={role === "system_admin" ? "system/settings" : "monitoring/settings"}
      breadcrumbs={[role === "system_admin" ? "System Admin" : "Barangay Captain", "Settings"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <PageHeader
          title="Account Settings"
          subtitle="Manage your profile, security preferences, and administrative options"
        />

        {isLoading && (
          <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)] items-start">
            <aside className="sticky top-28 rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#0A101D]/80">
              <Skeleton className="mb-4 h-4 w-24 ml-2" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-transparent p-3.5">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                    <SkeletonText lines={2} className="w-full mt-1" />
                  </div>
                ))}
              </div>
            </aside>
            <section className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-[#0A101D]/90">
              <div className="mb-8 flex items-start gap-4">
                <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                <SkeletonText lines={2} className="w-48 mt-1" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

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
            <aside className="sticky top-28 rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#0A101D]/80">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                Settings Menu
              </p>
              <div className="mt-4 space-y-2">
                {visibleSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = section.id === activeSection;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`group relative cursor-pointer w-full rounded-2xl border p-3.5 text-left transition-all duration-300 ease-out ${
                        isActive
                          ? "border-slate-200/80 bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-slate-800/80"
                          : "border-transparent bg-transparent hover:border-slate-200/60 hover:bg-slate-50/50 hover:shadow-sm dark:hover:border-slate-700/50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={`rounded-xl p-2.5 transition-all duration-300 ${
                            isActive
                              ? `${section.iconClassName} shadow-sm scale-110`
                              : "bg-slate-100/80 text-slate-500 ring-1 ring-slate-200/50 group-hover:scale-105 group-hover:bg-white group-hover:shadow-sm dark:bg-slate-800/80 dark:text-slate-400 dark:ring-slate-700/50 dark:group-hover:bg-slate-800"
                          }`}
                        >
                          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        </span>
                        <div className="min-w-0 mt-0.5">
                          <p className={`text-sm tracking-wide ${isActive ? "font-bold text-slate-900 dark:text-slate-100" : "font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-200"}`}>
                            {section.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {section.description}
                          </p>
                          <p className={`mt-1.5 text-xs font-semibold ${isActive ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                            {sectionStatus[section.id]}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-all dark:border-white/5 dark:bg-[#0A101D]/90">
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

              {activeSection === "system" && role === "system_admin" && <SystemSection />}

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
