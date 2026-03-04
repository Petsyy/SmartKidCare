import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  KeyRound,
  Moon,
  PencilLine,
  Save,
  ShieldCheck,
  Sun,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import {
  type AdminPreferencesForm,
  type AdminProfileForm,
  useAdminSettings,
} from "@/hooks/useAdminSettings";
import { useAdminPassword2FA } from "@/hooks/useAdminPassword2FA";
import {
  showAdminPasswordChangedModal,
  showAdminProfileSavedModal,
} from "@/utils/sweetalert.modal";
import ThemeSwitch from "@/components/theme/ThemeSwitch";
import { useTheme } from "@/context/ThemeContext";

type SettingsSectionId = "profile" | "security" | "preferences";

type SettingsSection = {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
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
    description: "MFA and notification settings",
    icon: Bell,
    iconClassName:
      "bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-500/30",
  },
];

const LABEL_CLASS_NAME =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const INPUT_CLASS_NAME =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:read-only:bg-slate-800 dark:read-only:text-slate-500";

const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: ToggleRowProps) => {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-500/40">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <span className="relative mt-0.5 inline-flex h-6 w-11 flex-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-teal-500 peer-focus:ring-2 peer-focus:ring-teal-300 peer-focus:ring-offset-2 dark:bg-slate-600 dark:peer-focus:ring-offset-slate-900" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 dark:bg-slate-100" />
      </span>
    </label>
  );
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    profile,
    setProfile,
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
    passwordForm,
    passwordState,
    passwordOtpState,
    passwordFieldErrors,
    passwordPolicyChecks,
    canRequestPasswordOtp,
    canSubmitPasswordChange,
    securityStatus,
    handlePasswordFieldChange,
    handleRequestPasswordOtp,
    handlePasswordSubmit,
  } = useAdminPassword2FA({
    sendPasswordChangeOtp,
    savePassword,
    onPasswordChanged: async () => {
      await showAdminPasswordChangedModal();
    },
  });

  const handleProfileFieldChange = (
    key: keyof AdminProfileForm,
    value: string,
  ) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handlePreferenceToggle = (
    key: keyof AdminPreferencesForm,
    value: boolean,
  ) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isProfileEditing) {
      return;
    }

    setProfileState({ saving: true, success: null, error: null });

    if (
      !profile.username.trim() ||
      !profile.firstName.trim() ||
      !profile.lastName.trim() ||
      !profile.email.trim()
    ) {
      setProfileState({
        saving: false,
        success: null,
        error: "Username, first name, last name, and email are required.",
      });
      return;
    }

    try {
      await saveProfile(profile);
      setProfileState({
        saving: false,
        success: "Profile updated successfully.",
        error: null,
      });
      setIsProfileEditing(false);
      setProfileSnapshot(null);
      await showAdminProfileSavedModal();
    } catch (error: any) {
      setProfileState({
        saving: false,
        success: null,
        error: error?.message || "Failed to update profile.",
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
    } catch (error: any) {
      setPreferenceState({
        saving: false,
        success: null,
        error: error?.message || "Failed to save preferences.",
      });
    }
  };

  const handleEnableProfileEdit = () => {
    setProfileSnapshot({ ...profile });
    setProfileState({ saving: false, success: null, error: null });
    setIsProfileEditing(true);
  };

  const handleCancelProfileEdit = () => {
    if (profileSnapshot) {
      setProfile({ ...profileSnapshot });
    }
    setIsProfileEditing(false);
    setProfileSnapshot(null);
    setProfileState({ saving: false, success: null, error: null });
  };

  const requiredProfileCount = [
    profile.username,
    profile.firstName,
    profile.lastName,
    profile.email,
  ].filter((value) => value.trim().length > 0).length;
  const profileCompletion = Math.round((requiredProfileCount / 4) * 100);

  const enabledPreferenceCount = [
    preferences.adminMfaEnabled,
    preferences.adminNotifySecurityEvents,
    preferences.adminNotifySystemUpdates,
  ].filter(Boolean).length;

  const sectionStatus: Record<SettingsSectionId, string> = {
    profile: `${profileCompletion}% complete`,
    security: securityStatus,
    preferences: `${enabledPreferenceCount}/3 enabled`,
  };

  const activeSectionMeta =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection) ??
    SETTINGS_SECTIONS[0];
  const ActiveSectionIcon = activeSectionMeta.icon;

  return (
    <Layout
      activeItem="settings"
      breadcrumbs={["Admin", "Settings"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage admin profile, security, and system notifications.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Loading settings...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-500/40 dark:bg-red-500/10">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              onClick={() => void loadSettings()}
              className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
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
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm xl:sticky xl:top-6 dark:border-slate-700 dark:bg-slate-900">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Settings Menu
              </p>
              <div className="mt-3 space-y-2">
                {SETTINGS_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = section.id === activeSection;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isActive
                          ? "border-teal-200 bg-teal-50 dark:border-teal-500/50 dark:bg-teal-500/10"
                          : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`rounded-lg p-2 ${
                            isActive
                              ? section.iconClassName
                              : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                          }`}
                        >
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {section.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {section.description}
                          </p>
                          <p className="mt-1 text-xs font-medium text-teal-700 dark:text-teal-300">
                            {sectionStatus[section.id]}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-6 flex items-start gap-3">
                <div
                  className={`rounded-lg p-2 ${activeSectionMeta.iconClassName}`}
                >
                  <ActiveSectionIcon size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {activeSectionMeta.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {activeSectionMeta.description}
                  </p>
                </div>
              </div>

              {activeSection === "profile" && (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {isProfileEditing
                        ? "Edit mode is enabled. Email remains read-only."
                        : "Profile is locked. Click Edit Profile to update details."}
                    </p>
                    <button
                      type="button"
                      onClick={
                        isProfileEditing
                          ? handleCancelProfileEdit
                          : handleEnableProfileEdit
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs cursor-pointer font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {isProfileEditing ? (
                        <X size={14} />
                      ) : (
                        <PencilLine size={14} />
                      )}
                      {isProfileEditing ? "Cancel Edit" : "Edit Profile"}
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={LABEL_CLASS_NAME}>
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(event) =>
                          handleProfileFieldChange(
                            "username",
                            event.target.value,
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="Enter username"
                        disabled={!isProfileEditing}
                        required
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS_NAME}>
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        className={INPUT_CLASS_NAME}
                        readOnly
                        placeholder="Email cannot be edited"
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Email cannot be edited here.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className={LABEL_CLASS_NAME}>
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(event) =>
                          handleProfileFieldChange(
                            "firstName",
                            event.target.value,
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="Enter first name"
                        disabled={!isProfileEditing}
                        required
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS_NAME}>Middle Name</label>
                      <input
                        type="text"
                        value={profile.middleName}
                        onChange={(event) =>
                          handleProfileFieldChange(
                            "middleName",
                            event.target.value,
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="Enter middle name"
                        disabled={!isProfileEditing}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS_NAME}>
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(event) =>
                          handleProfileFieldChange(
                            "lastName",
                            event.target.value,
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="Enter last name"
                        disabled={!isProfileEditing}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLASS_NAME}>Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(event) =>
                        handleProfileFieldChange("phone", event.target.value)
                      }
                      className={INPUT_CLASS_NAME}
                      placeholder="Enter phone number"
                      disabled={!isProfileEditing}
                    />
                  </div>

                  {profileState.error && (
                    <p className="text-sm text-red-600">{profileState.error}</p>
                  )}
                  {profileState.success && (
                    <p className="text-sm text-teal-600">
                      {profileState.success}
                    </p>
                  )}

                  {isProfileEditing && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={profileState.saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                      >
                        <Save size={16} />
                        {profileState.saving ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {activeSection === "security" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                      <label className={LABEL_CLASS_NAME}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          handlePasswordFieldChange(
                            "currentPassword",
                            event.target.value,
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="Current password"
                      />
                      {passwordFieldErrors.currentPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordFieldErrors.currentPassword}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={LABEL_CLASS_NAME}>New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          handlePasswordFieldChange(
                            "newPassword",
                            event.target.value,
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="New password"
                      />
                      {passwordFieldErrors.newPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordFieldErrors.newPassword}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={LABEL_CLASS_NAME}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          handlePasswordFieldChange(
                            "confirmPassword",
                            event.target.value,
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="Confirm password"
                      />
                      {passwordFieldErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordFieldErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Password Rules
                    </p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li
                        className={
                          passwordPolicyChecks.minimumLength
                            ? "text-teal-700"
                            : "text-slate-400"
                        }
                      >
                        At least 8 characters
                      </li>
                      <li
                        className={
                          passwordPolicyChecks.startsWithUppercase
                            ? "text-teal-700"
                            : "text-slate-400"
                        }
                      >
                        Starts with a capital letter
                      </li>
                      <li
                        className={
                          passwordPolicyChecks.hasSpecialCharacter
                            ? "text-teal-700"
                            : "text-slate-400"
                        }
                      >
                        Includes at least one special character
                      </li>
                      <li
                        className={
                          passwordPolicyChecks.differsFromCurrent
                            ? "text-teal-700"
                            : "text-slate-400"
                        }
                      >
                        Different from current password
                      </li>
                      <li
                        className={
                          passwordPolicyChecks.matchesConfirmation
                            ? "text-teal-700"
                            : "text-slate-400"
                        }
                      >
                        Matches confirmation
                      </li>
                    </ul>
                  </div>

                  {passwordOtpState.sent && (
                    <div>
                      <label className={LABEL_CLASS_NAME}>
                        One-Time Password (OTP)
                      </label>
                      <input
                        type="text"
                        value={passwordForm.otp}
                        onChange={(event) =>
                          handlePasswordFieldChange(
                            "otp",
                            event.target.value.replace(/\D/g, ""),
                          )
                        }
                        className={INPUT_CLASS_NAME}
                        placeholder="Enter 6-digit code from email"
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Enter the OTP sent to your admin email to confirm
                        password change.
                      </p>
                      {passwordFieldErrors.otp && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordFieldErrors.otp}
                        </p>
                      )}
                    </div>
                  )}

                  {!passwordOtpState.sent && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Send OTP first, then verify it to complete password
                      change.
                    </p>
                  )}

                  {passwordOtpState.error && (
                    <p className="text-sm text-red-600">
                      {passwordOtpState.error}
                    </p>
                  )}
                  {passwordOtpState.info && (
                    <p className="text-sm text-teal-600">
                      {passwordOtpState.info}
                    </p>
                  )}
                  {passwordState.error && (
                    <p className="text-sm text-red-600">
                      {passwordState.error}
                    </p>
                  )}
                  {passwordState.success && (
                    <p className="text-sm text-teal-600">
                      {passwordState.success}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRequestPasswordOtp()}
                      disabled={
                        passwordOtpState.requesting ||
                        passwordState.saving ||
                        !canRequestPasswordOtp
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-5 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-500/30 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-500/10"
                    >
                      <KeyRound size={16} />
                      {passwordOtpState.requesting
                        ? "Sending OTP..."
                        : passwordOtpState.sent
                          ? "Resend OTP"
                          : "Send OTP"}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        passwordState.saving || !canSubmitPasswordChange
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50"
                    >
                      <KeyRound size={16} />
                      {passwordState.saving
                        ? "Updating..."
                        : "Verify OTP & Change Password"}
                    </button>
                  </div>
                </form>
              )}

              {activeSection === "preferences" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Appearance Theme
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Switch between light and dark mode for the admin web
                        app.
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">
                        {theme === "dark" ? (
                          <Moon size={14} />
                        ) : (
                          <Sun size={14} />
                        )}
                        Current mode: {theme === "dark" ? "Dark" : "Light"}
                      </p>
                    </div>

                    <ThemeSwitch
                      checked={theme === "dark"}
                      onChange={(checked) =>
                        setTheme(checked ? "dark" : "light")
                      }
                    />
                  </div>

                  <ToggleRow
                    title="Require MFA on admin login"
                    description="If enabled, every admin sign-in requires an OTP sent to email."
                    checked={preferences.adminMfaEnabled}
                    onChange={(checked) =>
                      handlePreferenceToggle("adminMfaEnabled", checked)
                    }
                  />
                  <ToggleRow
                    title="Security event emails"
                    description="Receive notifications for security-related account events."
                    checked={preferences.adminNotifySecurityEvents}
                    onChange={(checked) =>
                      handlePreferenceToggle(
                        "adminNotifySecurityEvents",
                        checked,
                      )
                    }
                  />
                  <ToggleRow
                    title="System update emails"
                    description="Receive notifications for maintenance and release updates."
                    checked={preferences.adminNotifySystemUpdates}
                    onChange={(checked) =>
                      handlePreferenceToggle(
                        "adminNotifySystemUpdates",
                        checked,
                      )
                    }
                  />

                  {preferenceState.error && (
                    <p className="text-sm text-red-600">
                      {preferenceState.error}
                    </p>
                  )}
                  {preferenceState.success && (
                    <p className="text-sm text-teal-600">
                      {preferenceState.success}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleSavePreferences()}
                      disabled={preferenceState.saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={16} />
                      {preferenceState.saving
                        ? "Saving..."
                        : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
