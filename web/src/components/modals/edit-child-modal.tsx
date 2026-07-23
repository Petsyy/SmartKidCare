import { X, Eye, EyeOff } from "lucide-react";
import { useEditChildForm } from "./useEditChildForm";
import { InputField, SelectField } from "@/components/ui/form-fields";

export type ChildForEdit = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string | Date;
  age: string | number;
  gender: string;
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Edit Child</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 dark:bg-slate-900">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Student ID</label>
            <input
              type="text"
              value={child.studentId || "-"}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
            />
          </div>

          <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-900/10">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-teal-900 dark:text-teal-400">Child's Name</h3>
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
              Only showing initials for privacy: <span className="font-semibold">{maskedChildName}</span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="sm:col-span-2">
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
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Age</label>
              <input
                type="text"
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
                {...register("age")}
              />
              {errors.age?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.age.message}</p>
              )}
            </div>

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

          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-gray-100 dark:border-slate-800">
            <InputField
              type="date"
              label="Enrollment Date"
              required
              registration={register("enrollmentDate")}
              error={errors.enrollmentDate?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">School Year</label>
              <input
                type="text"
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
                {...register("schoolYear")}
              />
              {errors.schoolYear?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.schoolYear.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
            <SelectField
              label="Assigned Teacher"
              registration={register("teacherId")}
              error={errors.teacherId?.message}
            >
              <option value="">Select a Teacher (Optional)</option>
              {loadingTeachers ? (
                <option disabled>Loading...</option>
              ) : (
                teachers.map((t) => (
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
