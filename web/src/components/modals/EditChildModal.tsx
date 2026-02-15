import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateChild } from "../../api/child.api";
import {
  type AddChildForParentField,
  type AddChildForParentFormErrors,
  type AddChildForParentFormValues,
  validateAddChildForParentField,
  validateAddChildForParentForm,
} from "../../utils/formValidation";

const schoolYears = ["2024-2025", "2025-2026", "2026-2027"];

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
};

type Props = {
  child: ChildForEdit;
  onClose: () => void;
  onUpdated: (updated: ChildForEdit) => void;
};

const formatDateForInput = (d: string | Date) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
};

const calculateAge = (dob: string) => {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

const getInitialForm = (child: ChildForEdit): AddChildForParentFormValues => ({
  firstName: child.firstName,
  middleName: child.middleName ?? "",
  lastName: child.lastName,
  dateOfBirth: formatDateForInput(child.dateOfBirth),
  age: String(child.age),
  gender: child.gender as "male" | "female",
  enrollmentDate: formatDateForInput(child.enrollmentDate),
  schoolYear: child.schoolYear,
});

export default function EditChildModal({ child, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<AddChildForParentFormValues>(() => getInitialForm(child));
  const [errors, setErrors] = useState<AddChildForParentFormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(getInitialForm(child));
    setErrors({});
  }, [child]);

  const setFieldError = (
    field: AddChildForParentField,
    nextForm = form,
  ) => {
    const error = validateAddChildForParentField(field, nextForm);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const field = name as AddChildForParentField;
    const nextForm = { ...form, [field]: value } as AddChildForParentFormValues;

    if (field === "dateOfBirth") nextForm.age = calculateAge(value);
    if (field === "enrollmentDate" && value) {
      const year = new Date(value).getFullYear();
      if (!isNaN(year)) nextForm.schoolYear = `${year}-${year + 1}`;
    }

    setForm(nextForm);

    if (errors[field]) {
      setFieldError(field, nextForm);
    }
    if (field === "dateOfBirth" || field === "enrollmentDate") {
      setFieldError("dateOfBirth", nextForm);
      setFieldError("enrollmentDate", nextForm);
    }
  };

  const handleFieldBlur = (field: AddChildForParentField) => {
    setFieldError(field);
  };

  const handleGenderChange = (gender: "male" | "female") => {
    const nextForm: AddChildForParentFormValues = { ...form, gender };
    setForm(nextForm);
    if (errors.gender) {
      setFieldError("gender", nextForm);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateAddChildForParentForm(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const updated = await updateChild(child._id, {
        firstName: form.firstName,
        middleName: form.middleName || undefined,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        age: Number(form.age),
        gender: form.gender,
        enrollmentDate: form.enrollmentDate,
        schoolYear: form.schoolYear,
      });
      onUpdated(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 bg-linear-to-r from-teal-50 to-white border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Edit Child</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="text"
              value={child.studentId || "—"}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                onBlur={() => handleFieldBlur("firstName")}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={form.middleName}
                onChange={handleChange}
                onBlur={() => handleFieldBlur("middleName")}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              {errors.middleName && (
                <p className="mt-1 text-xs text-red-600">{errors.middleName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              onBlur={() => handleFieldBlur("lastName")}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                onBlur={() => handleFieldBlur("dateOfBirth")}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
              <input
                type="text"
                name="age"
                value={form.age}
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === "male"}
                  onChange={() => handleGenderChange("male")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === "female"}
                  onChange={() => handleGenderChange("female")}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Female</span>
              </label>
            </div>
            {errors.gender && (
              <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Enrollment Date *</label>
              <input
                type="date"
                name="enrollmentDate"
                value={form.enrollmentDate}
                onChange={handleChange}
                onBlur={() => handleFieldBlur("enrollmentDate")}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              {errors.enrollmentDate && (
                <p className="mt-1 text-xs text-red-600">{errors.enrollmentDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">School Year</label>
              <select
                name="schoolYear"
                value={form.schoolYear}
                onChange={handleChange}
                onBlur={() => handleFieldBlur("schoolYear")}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {schoolYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.schoolYear && (
                <p className="mt-1 text-xs text-red-600">{errors.schoolYear}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
