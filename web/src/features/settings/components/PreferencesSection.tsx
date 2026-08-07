import { Save } from "lucide-react";
import { ToggleRow } from "@/features/settings/components/ToggleArrow";
import type { AdminPreferencesForm } from "@/features/settings/hooks/useAdminSettings";

type PreferencesSectionProps = {
  preferences: AdminPreferencesForm;
  preferenceState: { saving: boolean; success: string | null; error: string | null };
  onPreferenceToggle: (key: keyof AdminPreferencesForm, value: boolean) => void;
  onSave: () => void;
};

export const PreferencesSection = ({
  preferences,
  preferenceState,
  onPreferenceToggle,
  onSave,
}: PreferencesSectionProps) => {
  return (
    <div className="space-y-4">
      <ToggleRow
        title="Require MFA on admin login"
        description="If enabled, every admin sign-in requires an OTP sent to email."
        checked={preferences.adminMfaEnabled}
        onChange={(checked) => onPreferenceToggle("adminMfaEnabled", checked)}
      />

      {preferenceState.error && (
        <p className="text-sm text-red-600">{preferenceState.error}</p>
      )}
      {preferenceState.success && (
        <p className="text-sm text-teal-600">{preferenceState.success}</p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={preferenceState.saving}
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} />
          {preferenceState.saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
};
