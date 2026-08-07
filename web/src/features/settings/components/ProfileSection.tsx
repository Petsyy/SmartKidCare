import { PencilLine, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { AdminProfileForm } from "@/features/settings/hooks/useAdminSettings";

const LABEL_CLASS_NAME =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const INPUT_CLASS_NAME =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:read-only:bg-slate-800 dark:read-only:text-slate-500";

type ProfileSectionProps = {
  isProfileEditing: boolean;
  profileState: { saving: boolean; success: string | null; error: string | null };
  form: UseFormReturn<AdminProfileForm>;
  onEnableEdit: () => void;
  onCancelEdit: () => void;
  onSubmit: (form: AdminProfileForm) => void;
  validateField: (key: keyof AdminProfileForm, value: string) => string | undefined;
};

export const ProfileSection = ({
  isProfileEditing,
  profileState,
  form,
  onEnableEdit,
  onCancelEdit,
  onSubmit,
  validateField,
}: ProfileSectionProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {isProfileEditing
            ? "Edit mode is enabled. Email remains read-only."
            : "Profile is locked. Click Edit Profile to update details."}
        </p>
        <button
          type="button"
          onClick={isProfileEditing ? onCancelEdit : onEnableEdit}
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isProfileEditing ? <X size={14} /> : <PencilLine size={14} />}
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
            className={INPUT_CLASS_NAME}
            placeholder="Enter username"
            disabled={!isProfileEditing}
            {...register("username", {
              validate: (value) => validateField("username", value) || true,
            })}
          />
          {errors.username?.message && (
            <p className="mt-1 text-xs text-red-600">
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className={INPUT_CLASS_NAME}
            readOnly
            disabled={!isProfileEditing}
            {...register("email")}
            title="Email cannot be changed"
          />
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS_NAME}
            placeholder="e.g. John"
            disabled={!isProfileEditing}
            {...register("firstName", {
              validate: (value) => validateField("firstName", value) || true,
            })}
          />
          {errors.firstName?.message && (
            <p className="mt-1 text-xs text-red-600">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>
            Middle Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS_NAME}
            placeholder="e.g. Doe"
            disabled={!isProfileEditing}
            {...register("middleName", {
              validate: (value) => validateField("middleName", value) || true,
            })}
          />
          {errors.middleName?.message && (
            <p className="mt-1 text-xs text-red-600">
              {errors.middleName.message}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS_NAME}
            placeholder="e.g. Smith"
            disabled={!isProfileEditing}
            {...register("lastName", {
              validate: (value) => validateField("lastName", value) || true,
            })}
          />
          {errors.lastName?.message && (
            <p className="mt-1 text-xs text-red-600">
              {errors.lastName.message}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS_NAME}>
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS_NAME}
            placeholder="09123456789"
            disabled={!isProfileEditing}
            {...register("phone", {
              validate: (value) => validateField("phone", value) || true,
            })}
          />
          {errors.phone?.message && (
            <p className="mt-1 text-xs text-red-600">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      {profileState.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {profileState.error}
        </div>
      )}

      {profileState.success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          {profileState.success}
        </div>
      )}

      {isProfileEditing && (
        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
          <button
            type="submit"
            disabled={profileState.saving}
            className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
          >
            {profileState.saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </form>
  );
};
