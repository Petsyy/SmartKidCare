import { useState, useEffect } from "react";
import { useSystemSettings } from "@/context/system-settings.context";
import { updateSystemSettings } from "../services/settings.service";
import type { SystemSettingsForm, SystemSettingsStatus } from "../types";

export function useSystemSettingsForm() {
  const { settings, refreshSettings } = useSystemSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<SystemSettingsForm>({
    schoolName: settings?.schoolName || "",
    address: settings?.address || "",
  });
  const [status, setStatus] = useState<SystemSettingsStatus>({
    saving: false,
    error: null,
    success: null,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.schoolName || "",
        address: settings.address || "",
      });
    }
  }, [settings]);

  const updateField = (field: keyof SystemSettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setStatus({ saving: true, error: null, success: null });
    try {
      await updateSystemSettings({
        schoolName: form.schoolName,
        address: form.address,
      });
      await refreshSettings();
      setStatus({
        saving: false,
        error: null,
        success: "System settings updated successfully.",
      });
      setIsEditing(false);
    } catch (err: unknown) {
      setStatus({
        saving: false,
        error: err instanceof Error ? err.message : "Failed to update settings.",
        success: null,
      });
    }
  };

  const handleCancel = () => {
    setForm({
      schoolName: settings?.schoolName || "",
      address: settings?.address || "",
    });
    setIsEditing(false);
    setStatus({ saving: false, error: null, success: null });
  };

  return {
    settings,
    isEditing,
    setIsEditing,
    form,
    updateField,
    status,
    handleSave,
    handleCancel,
  };
}
