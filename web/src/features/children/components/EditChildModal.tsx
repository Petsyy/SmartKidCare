import { X, Eye, EyeOff } from "lucide-react";
import { useEditChildForm } from "../hooks/useEditChildForm";
import type { User } from "@/api/authentication.api";
import { InputField, SelectField } from "@/components/ui/FormFields";

export type ChildForEdit = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string | Date;
  age: string | number;
  gender: string;
  homeAddress?: string;
  parentRelationship?: string;
  weight?: number | null;
  height?: number | null;
  enrollmentDate: string | Date;
  schoolYear: string;
  studentId?: string;
  teacher?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
  } | null;
};

type Props = {
  child: ChildForEdit;
  onClose: () => void;
  onUpdated: (updated: ChildForEdit) => void;
};

export default function EditChildModal({ child, onClose, onUpdated }: Props) {
  const {
    form,
    teachers,
    loadingTeachers,
    isSubmitting,
    onSubmit,
    revealChildName,
    setRevealChildName,
    maskedChildName,
    firstNameInputValue,
    middleNameInputValue,
    lastNameInputValue,
    minAgeDate,
    maxAgeDate,
  } = useEditChildForm({ child, onClose, onUpdated });

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 bg-linear-to-r from-teal-50 to-white border-b border-gray-100 dark:from-teal-900/20 dark:to-slate-800 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
            Edit Child
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4 dark:bg-slate-900"
        >
          <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-900/10">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-teal-900 dark:text-teal-400">
                Child's Name
              </h3>
              <button
                type="button"
                onClick={() => setRevealChildName(!revealChildName)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 dark:text-teal-400 dark:hover:bg-teal-900/50"
              >
                {revealChildName ? (
                  <>
                    <EyeOff size={14} /> Hide Name
                  </>
                ) : (
                  <>
                    <Eye size={14} /> Reveal Name
                  </>
                )}
              </button>
            </div>

            <p className="mb-4 text-xs text-teal-700/80 dark:text-teal-500/80">
              Only showing initials for privacy:{" "}
              <span className="font-semibold">{maskedChildName}</span>
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="First Name"
                value={firstNameInputValue}
                required
                registration={register("firstName")}
                error={errors.firstName?.message}
                onChange={(e) => {
                  form.setValue("firstName", e.target.value);
                  setRevealChildName(true);
                }}
              />
              <InputField
                label="Middle Name"
                value={middleNameInputValue}
                registration={register("middleName")}
                error={errors.middleName?.message}
                onChange={(e) => {
                  form.setValue("middleName", e.target.value);
                  setRevealChildName(true);
                }}
              />
              <InputField
                label="Last Name"
                value={lastNameInputValue}
                required
                registration={register("lastName")}
                error={errors.lastName?.message}
                onChange={(e) => {
                  form.setValue("lastName", e.target.value);
                  setRevealChildName(true);
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              type="date"
              label="Date of Birth"
              min={minAgeDate}
              max={maxAgeDate}
              required
              registration={register("dateOfBirth")}
              error={errors.dateOfBirth?.message}
              onChange={(e) => {
                form.setValue("dateOfBirth", e.target.value, { shouldValidate: true });
                const birthDate = new Date(e.target.value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                  age--;
                }
                if (!isNaN(age)) {
                  form.setValue("age", String(age), { shouldValidate: true });
                }
              }}
            />

            <SelectField
              label="Gender"
              required
              registration={register("gender")}
              error={errors.gender?.message}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </SelectField>
          </div>

          <InputField
            label="Complete Home Address"
            required
            registration={register("homeAddress")}
            error={errors.homeAddress?.message}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="Parent Relationship"
              required
              registration={register("parentRelationship")}
              error={errors.parentRelationship?.message}
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
              <option value="Grandparent">Grandparent</option>
              <option value="Other">Other</option>
            </SelectField>
            <InputField
              type="number"
              label="Weight (kg)"
              required
              registration={register("weight")}
              error={errors.weight?.message}
            />
            <InputField
              type="number"
              label="Height (cm)"
              required
              registration={register("height")}
              error={errors.height?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              type="date"
              label="Enrollment Date"
              required
              registration={register("enrollmentDate")}
              error={errors.enrollmentDate?.message}
              onChange={(e) => {
                form.setValue("enrollmentDate", e.target.value, { shouldValidate: true });
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  const year = date.getFullYear();
                  form.setValue("schoolYear", `${year}-${year + 1}`, { shouldValidate: true });
                }
              }}
            />

            <SelectField
              label="Assigned Teacher"
              registration={register("teacherId")}
              error={errors.teacherId?.message}
            >
              <option value="">Select a Teacher (Optional)</option>
              {loadingTeachers ? (
                <option disabled>Loading...</option>
              ) : (
                teachers.map((t: User) => (
                  <option key={t._id} value={t._id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))
              )}
            </SelectField>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
