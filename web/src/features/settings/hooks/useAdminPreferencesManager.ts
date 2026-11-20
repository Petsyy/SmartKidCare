import { useState } from "react";
import type {
  AdminPreferencesForm,
  UseAdminPreferencesManagerProps,
} from "../types";

export function useAdminPreferencesManager({
  preferences,
  setPreferences,
  savePreferences,
}: UseAdminPreferencesManagerProps) {
  const [preferenceState, setPreferenceState] = useState<{
    saving: boolean;
    success: string | null;
    error: string | null;
  }>({
    saving: false,
    success: null,
    error: null,
  });

  const handlePreferenceToggle = (
    key: keyof AdminPreferencesForm,
    value: boolean,
  ) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));
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
        error:
          error instanceof Error ? error.message : "Failed to save preferences.",
      });
    }
  };

  const enabledPreferenceCount = [
    preferences.adminMfaEnabled,
    preferences.adminNotifyOperationalEvents,
  ].filter(Boolean).length;

  return {
    preferenceState,
    handlePreferenceToggle,
    handleSavePreferences,
    enabledPreferenceCount,
  };
}
