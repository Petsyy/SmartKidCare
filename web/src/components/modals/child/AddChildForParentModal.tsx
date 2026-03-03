import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  type AddChildForParentField,
  type AddChildForParentFormErrors,
  validateAddChildForParentField,
  validateAddChildForParentForm,
} from "@/utils/formValidation";

export type ParentForChild = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
};

export type ChildForParentFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: "male" | "female";
  enrollmentDate: string;
  schoolYear: string;
};

type AddChildForParentModalProps = {
  isOpen: boolean;
  parent: ParentForChild;
  onClose: () => void;
  onSave: (data: ChildForParentFormData & { parent: ParentForChild }) => void;
  isLoading?: boolean;
};

const schoolYears = ["2024-2025", "2025-2026", "2026-2027"];

const initialFormData: ChildForParentFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  age: "",
  gender: "male",
  enrollmentDate: "",
  schoolYear: "2024-2025",
};

function calculateAge(dob: string) {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
}

export default function AddChildForParentModal({
  isOpen,
  parent,
  onClose,
  onSave,
  isLoading = false,
}: AddChildForParentModalProps) {
  const [formData, setFormData] = useState<ChildForParentFormData>(initialFormData);
  const [errors, setErrors] = useState<AddChildForParentFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

  const setFieldError = (
    field: AddChildForParentField,
    nextForm = formData,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const field = name as AddChildForParentField;
    const nextForm: ChildForParentFormData = { ...formData, [field]: value };

    if (field === "dateOfBirth") nextForm.age = calculateAge(value);
    if (field === "enrollmentDate" && value) {
      const year = new Date(value).getFullYear();
      if (!isNaN(year)) nextForm.schoolYear = `${year}-${year + 1}`;
    }

    setFormData(nextForm);

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
    const nextForm = { ...formData, gender };
    setFormData(nextForm);
    if (errors.gender) {
      setFieldError("gender", nextForm);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateAddChildForParentForm(formData);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    onSave({ ...formData, parent });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Add Child for Existing Parent</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Linking new child to {parent.firstName} {parent.lastName} ({parent.email})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition dark:text-slate-500 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-slate-50">Child Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("firstName")}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    required
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("middleName")}
                    placeholder="Enter middle name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                  />
                  {errors.middleName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.middleName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur("lastName")}
                  placeholder="Enter last name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                  required
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lastName}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("dateOfBirth")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    required
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Age</label>
                  <input
                    type="text"
                    name="age"
                    value={formData.age}
                    readOnly
                    placeholder="Auto-calculated"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-slate-300">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={() => handleGenderChange("male")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={() => handleGenderChange("female")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">Female</span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.gender}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-slate-50">Enrollment Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Enrollment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="enrollmentDate"
                    value={formData.enrollmentDate}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("enrollmentDate")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    required
                  />
                  {errors.enrollmentDate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.enrollmentDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">School Year</label>
                  <select
                    name="schoolYear"
                    value={formData.schoolYear}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("schoolYear")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                  >
                    {schoolYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.schoolYear && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.schoolYear}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3 dark:bg-teal-900/20 dark:border-teal-700/30">
            <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-teal-700 dark:text-teal-300">
              Student ID is generated automatically. The child will be linked to this parent account.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Add Child"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
