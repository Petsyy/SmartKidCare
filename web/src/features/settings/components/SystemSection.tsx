import React, { useState } from "react";
import { useSystemSettings } from "../../../context/SystemSettingsContext";
import { updateSystemSettings } from "../../../api/system-settings.api";

export const SystemSection: React.FC = () => {
  const { settings, refreshSettings } = useSystemSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    schoolName: settings?.schoolName || "",
    address: settings?.address || "",
  });
  const [status, setStatus] = useState<{
    saving: boolean;
    error: string | null;
    success: string | null;
  }>({ saving: false, error: null, success: null });

  const handleSave = async () => {
    setStatus({ saving: true, error: null, success: null });
    try {
      await updateSystemSettings({
        schoolName: form.schoolName,
        address: form.address,
      });
      await refreshSettings();
      setStatus({ saving: false, error: null, success: "System settings updated successfully." });
      setIsEditing(false);
    } catch (err: any) {
      setStatus({
        saving: false,
        error: err.message || "Failed to update settings.",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            School Information
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage the platform's school identity and display name.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20 cursor-pointer"
          >
            Edit Info
          </button>
        )}
      </div>

      {status.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          {status.error}
        </div>
      )}
      {status.success && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-200">
          {status.success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            School Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          ) : (
            <p className="text-sm text-slate-900 dark:text-slate-100">
              {settings?.schoolName || "Not set"}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Address
          </label>
          {isEditing ? (
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          ) : (
            <p className="text-sm text-slate-900 dark:text-slate-100">
              {settings?.address || "Not set"}
            </p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleCancel}
            disabled={status.saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status.saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
          >
            {status.saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};
