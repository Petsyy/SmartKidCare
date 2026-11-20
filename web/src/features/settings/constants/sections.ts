import { Bell, ShieldCheck, UserCog, Building2 } from "lucide-react";
import type { SettingsSection } from "../types";
import type { PasswordForm } from "../hooks/useAdminPassword2FA";

export const SETTINGS_SECTIONS: SettingsSection[] = [
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
    description: "Login and notification options",
    icon: Bell,
    iconClassName:
      "bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-500/30",
  },
];

export const DEFAULT_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  otp: "",
};
