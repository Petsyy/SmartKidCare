import { X, UserRound } from "lucide-react";
import { useEditChildForm } from "../hooks/useEditChildForm";
import type { User } from "@/api/authentication.api";
import { InputField, SelectField } from "@/components/ui/FormFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";

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
    minAgeDate,
    maxAgeDate,
  } = useEditChildForm({ child, onClose, onUpdated });

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={onClose}
      >
        <DialogTitle className="sr-only">Edit Child</DialogTitle>
        <DialogDescription className="sr-only">
          Update child information.
        </DialogDescription>
        <div
          className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-linear-to-rrom-teal-50 to-emerald-50/50 px-6 py-5 backdrop-blur-md dark:border-slate-700/50 dark:from-teal-900/30 dark:to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <UserRound size={20} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Edit Child
              </h3>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-white/50 p-2 text-gray-500 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={onSubmit}
            className="max-h-[70vh] overflow-y-auto p-6 space-y-4"
          >
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
                  form.setValue("dateOfBirth", e.target.value, {
                    shouldValidate: true,
                  });
                  const birthDate = new Date(e.target.value);
                  const today = new Date();
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (
                    m < 0 ||
                    (m === 0 && today.getDate() < birthDate.getDate())
                  ) {
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
                  form.setValue("enrollmentDate", e.target.value, {
                    shouldValidate: true,
                  });
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    form.setValue("schoolYear", `${year}-${year + 1}`, {
                      shouldValidate: true,
                    });
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

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-teal-400"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
