import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { updateChild } from "@/api/child.api";
import { getUsers, type User } from "@/api/authentication.api";
import {
  type AddChildForParentField,
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
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    String(child.teacher?._id || ""),
  );
  const [loading, setLoading] = useState(false);
  const [revealChildName, setRevealChildName] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    getValues,
    formState: { errors },
  } = useForm<AddChildForParentFormValues>({
    defaultValues: getInitialForm(child),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const validateField = useMemo(
    () => (field: AddChildForParentField) => (value: string) => {
      const formErrors = validateAddChildForParentForm({
        ...getValues(),
        [field]: value,
      } as AddChildForParentFormValues);
      return formErrors[field] || true;
    },
    [getValues],
  );

  useEffect(() => {
    const nextForm = getInitialForm(child);
    reset(nextForm);
    setSelectedTeacherId(String(child.teacher?._id || ""));
    setRevealChildName(false);
    void trigger();
  }, [child, reset, trigger]);

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

  const firstName = watch("firstName");
  const middleName = watch("middleName");
  const lastName = watch("lastName");
  const dateOfBirth = watch("dateOfBirth");
  const age = watch("age");
  const gender = watch("gender");
  const enrollmentDate = watch("enrollmentDate");
  const schoolYear = watch("schoolYear");

  const onSubmit = async (form: AddChildForParentFormValues) => {
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

  const firstNameField = register("firstName", {
    validate: validateField("firstName"),
  });
  const middleNameField = register("middleName", {
    validate: validateField("middleName"),
  });
  const lastNameField = register("lastName", {
    validate: validateField("lastName"),
  });
  const dateOfBirthField = register("dateOfBirth", {
    validate: validateField("dateOfBirth"),
  });
  const genderMaleField = register("gender", {
    validate: validateField("gender"),
  });
  const genderFemaleField = register("gender", {
    validate: validateField("gender"),
  });
  const enrollmentDateField = register("enrollmentDate", {
    validate: validateField("enrollmentDate"),
  });
  const schoolYearField = register("schoolYear", {
    validate: validateField("schoolYear"),
  });
  const ageField = register("age");

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
      firstName,
      middleName,
      lastName,
    }) || "N/A";
  const firstNameInputValue = revealChildName
    ? firstName
    : maskNamePart(firstName);
  const middleNameInputValue = revealChildName
    ? middleName
    : maskNamePart(middleName);
  const lastNameInputValue = revealChildName
    ? lastName
    : maskNamePart(lastName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 bg-linear-to-r from-teal-50 to-white border-b border-gray-100 dark:from-teal-900/20 dark:to-slate-800 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Edit Child</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 dark:bg-slate-900">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Student ID</label>
            <input
              type="text"
              value={child.studentId || "-"}
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
                maxLength={15}
                readOnly={!revealChildName}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:read-only:bg-slate-800 dark:read-only:text-slate-400"
                {...firstNameField}
                value={firstNameInputValue}
                onChange={
                  revealChildName
                    ? (event) => {
                        firstNameField.onChange(event);
                        void trigger("firstName");
                      }
                    : undefined
                }
                onBlur={(event) => {
                  firstNameField.onBlur(event);
                  if (revealChildName) {
                    void trigger("firstName");
                  }
                }}
              />
              {errors.firstName?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Middle Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                maxLength={15}
                readOnly={!revealChildName}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:read-only:bg-slate-800 dark:read-only:text-slate-400"
                {...middleNameField}
                value={middleNameInputValue}
                onChange={
                  revealChildName
                    ? (event) => {
                        middleNameField.onChange(event);
                        void trigger("middleName");
                      }
                    : undefined
                }
                onBlur={(event) => {
                  middleNameField.onBlur(event);
                  if (revealChildName) {
                    void trigger("middleName");
                  }
                }}
              />
              {errors.middleName?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.middleName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Last Name *</label>
            <input
              type="text"
              maxLength={15}
              readOnly={!revealChildName}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent read-only:cursor-not-allowed read-only:bg-gray-100 read-only:text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:read-only:bg-slate-800 dark:read-only:text-slate-400"
              {...lastNameField}
              value={lastNameInputValue}
              onChange={
                revealChildName
                  ? (event) => {
                      lastNameField.onChange(event);
                      void trigger("lastName");
                    }
                  : undefined
              }
              onBlur={(event) => {
                lastNameField.onBlur(event);
                if (revealChildName) {
                  void trigger("lastName");
                }
              }}
            />
            {errors.lastName?.message && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lastName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Date of Birth *</label>
              <input
                type="date"
                min={minAgeDate}
                max={maxAgeDate}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                {...dateOfBirthField}
                value={dateOfBirth}
                onChange={(event) => {
                  dateOfBirthField.onChange(event);
                  const nextDate = event.target.value;
                  setValue("age", calculateAge(nextDate), { shouldDirty: true });
                  void trigger("dateOfBirth");
                  void trigger("enrollmentDate");
                }}
                onBlur={(event) => {
                  dateOfBirthField.onBlur(event);
                  void trigger("dateOfBirth");
                }}
              />
              {errors.dateOfBirth?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dateOfBirth.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Age</label>
              <input
                type="text"
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
                {...ageField}
                value={age}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Gender *</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="male"
                  className="w-4 h-4"
                  {...genderMaleField}
                  checked={gender === "male"}
                  onChange={(event) => {
                    genderMaleField.onChange(event);
                    void trigger("gender");
                  }}
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="female"
                  className="w-4 h-4"
                  {...genderFemaleField}
                  checked={gender === "female"}
                  onChange={(event) => {
                    genderFemaleField.onChange(event);
                    void trigger("gender");
                  }}
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Female</span>
              </label>
            </div>
            {errors.gender?.message && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.gender.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">Enrollment Date *</label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                {...enrollmentDateField}
                value={enrollmentDate}
                onChange={(event) => {
                  enrollmentDateField.onChange(event);
                  const nextDate = event.target.value;
                  setValue("schoolYear", calculateSchoolYear(nextDate), {
                    shouldDirty: true,
                  });
                  void trigger("dateOfBirth");
                  void trigger("enrollmentDate");
                }}
                onBlur={(event) => {
                  enrollmentDateField.onBlur(event);
                  void trigger("enrollmentDate");
                }}
              />
              {errors.enrollmentDate?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.enrollmentDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">School Year</label>
              <input
                type="text"
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500"
                {...schoolYearField}
                value={schoolYear}
                onBlur={(event) => {
                  schoolYearField.onBlur(event);
                  void trigger("schoolYear");
                }}
              />
              {errors.schoolYear?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.schoolYear.message}</p>
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
