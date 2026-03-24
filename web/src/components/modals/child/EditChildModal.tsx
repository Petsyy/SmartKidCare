import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateChild } from "@/api/child.api";
import { getUsers, type User } from "@/api/authentication.api";
import {
  type AddChildForParentField,
  type AddChildForParentFormErrors,
  type AddChildForParentFormValues,
  validateAddChildForParentForm,
} from "@/utils/formValidation";
import { formatConfidentialName, maskNamePart } from "@/utils/namePrivacy";

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

const calculateSchoolYear = (enrollmentDate: string) => {
  if (!enrollmentDate) return "";
  const year = new Date(enrollmentDate).getFullYear();
  if (isNaN(year)) return "";
  return `${year}-${year + 1}`;
};

const getInitialForm = (child: ChildForEdit): AddChildForParentFormValues => ({
  firstName: child.firstName,
  middleName: child.middleName ?? "",
  lastName: child.lastName,
  dateOfBirth: formatDateForInput(child.dateOfBirth),
  age: String(child.age),
  gender: child.gender as "male" | "female",
  enrollmentDate: formatDateForInput(child.enrollmentDate),
  schoolYear:
    calculateSchoolYear(formatDateForInput(child.enrollmentDate)) || child.schoolYear,
});

export default function EditChildModal({ child, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<AddChildForParentFormValues>(() => getInitialForm(child));
  const [errors, setErrors] = useState<AddChildForParentFormErrors>(() =>
    validateAddChildForParentForm(getInitialForm(child)),
  );
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    String(child.teacher?._id || ""),
  );
  const [loading, setLoading] = useState(false);
  const [revealChildName, setRevealChildName] = useState(false);

  useEffect(() => {
    const nextForm = getInitialForm(child);
    setForm(nextForm);
    setErrors(validateAddChildForParentForm(nextForm));
    setSelectedTeacherId(String(child.teacher?._id || ""));
    setRevealChildName(false);
  }, [child]);

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      try {
        const teacherUsers = await getUsers({ role: "teacher" });
        if (!isMounted) return;
        setTeachers(
          teacherUsers.filter(
            (teacher) => teacher.role === "teacher" && teacher.isActive !== false,
          ),
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load teachers:", error);
        setTeachers([]);
      }
    };

    void loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  const setFieldError = (
    field: AddChildForParentField,
    nextForm = form,
  ) => {
    const allErrors = validateAddChildForParentForm(nextForm);
    setErrors((prev) => {
      const next = { ...prev };
      if (allErrors[field]) {
        next[field] = allErrors[field];
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
    if (field === "enrollmentDate") nextForm.schoolYear = calculateSchoolYear(value);

    setForm(nextForm);

    const validationFields = new Set<AddChildForParentField>([
      "firstName",
      "middleName",
      "lastName",
      "dateOfBirth",
      "enrollmentDate",
      "schoolYear",
    ]);
    if (validationFields.has(field)) {
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
    setFieldError("gender", nextForm);
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
        teacherId: selectedTeacherId || null,
      });
      onUpdated(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const minAgeDate = new Date(
    today.getFullYear() - 6,
    today.getMonth(),
    today.getDate() + 1,
  )
    .toISOString()
    .slice(0, 10);
  const maxAgeDate = new Date(
    today.getFullYear() - 3,
    today.getMonth(),
    today.getDate(),
  )
    .toISOString()
    .slice(0, 10);
  const maskedChildName =
    formatConfidentialName({
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
    }) || "N/A";
  const firstNameInputValue = revealChildName
    ? form.firstName
    : maskNamePart(form.firstName);
  const middleNameInputValue = revealChildName
    ? form.middleName
    : maskNamePart(form.middleName);
  const lastNameInputValue = revealChildName
    ? form.lastName
    : maskNamePart(form.lastName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 bg-linear-to-r from-teal-50 to-white border-b border-gray-100 dark:from-teal-900/20 dark:to-slate-800 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Edit Child</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 dark:bg-slate-900">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Student ID</label>
            <input
              type="text"
              value={child.studentId || "—"}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-900/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Confidential Child Name
                </p>
                <p className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {maskedChildName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevealChildName((prev) => !prev)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/45"
              >
                {revealChildName ? "Hide Name Fields" : "Reveal Name Fields"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={firstNameInputValue}
                onChange={revealChildName ? handleChange : undefined}
                maxLength={15}
                onBlur={() => revealChildName && handleFieldBlur("firstName")}
                readOnly={!revealChildName}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:read-only:bg-slate-800 dark:read-only:text-slate-400"
                required
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Middle Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="middleName"
                value={middleNameInputValue}
                maxLength={15}
                onChange={revealChildName ? handleChange : undefined}
                onBlur={() => revealChildName && handleFieldBlur("middleName")}
                readOnly={!revealChildName}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:read-only:bg-slate-800 dark:read-only:text-slate-400"
              />
              {errors.middleName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.middleName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={lastNameInputValue}
              maxLength={15}
              onChange={revealChildName ? handleChange : undefined}
              onBlur={() => revealChildName && handleFieldBlur("lastName")}
              readOnly={!revealChildName}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:read-only:bg-slate-800 dark:read-only:text-slate-400"
              required
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lastName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                onBlur={() => handleFieldBlur("dateOfBirth")}
                min={minAgeDate}
                max={maxAgeDate}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                required
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dateOfBirth}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Age</label>
              <input
                type="text"
                name="age"
                value={form.age}
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Gender *</label>
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
                <span className="text-sm text-gray-700 dark:text-slate-300">Male</span>
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
                <span className="text-sm text-gray-700 dark:text-slate-300">Female</span>
              </label>
            </div>
            {errors.gender && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.gender}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Enrollment Date *</label>
              <input
                type="date"
                name="enrollmentDate"
                value={form.enrollmentDate}
                onChange={handleChange}
                onBlur={() => handleFieldBlur("enrollmentDate")}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                required
              />
              {errors.enrollmentDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.enrollmentDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">School Year</label>
              <input
                type="text"
                name="schoolYear"
                value={form.schoolYear}
                onBlur={() => handleFieldBlur("schoolYear")}
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
              />
              {errors.schoolYear && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.schoolYear}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">
              Assigned Teacher
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            >
              <option value="">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.lastName}, {teacher.firstName}
                  {teacher.middleName ? ` ${teacher.middleName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
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
