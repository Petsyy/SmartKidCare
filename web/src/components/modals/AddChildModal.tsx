import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { validateDateFields } from "../../utils/childDateValidation";
import { getUsers, type User } from "../../api/authentication.api";
import {
  type AddChildFormErrors,
  type AddChildFormValues,
  validateAddChildField,
  validateAddChildForm,
  sanitizePhoneInput,
} from "../../utils/formValidation";

export type ChildFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: "male" | "female";
  enrollmentDate: string;
  schoolYear: string;

  parentLastName: string;
  parentFirstName: string;
  parentMiddleName: string;
  parentEmail: string;
  parentPhone: string;
  teacherId?: string;

  studentId?: string;
  childLinkCode?: string;
};

export type InitialParent = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
};

type AddChildModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ChildFormData) => void;
  isLoading?: boolean;
  initialParent?: InitialParent | null;
};

const initialFormData: ChildFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  age: "",
  gender: "male",
  enrollmentDate: "",
  schoolYear: "2024-2025",

  parentLastName: "",
  parentFirstName: "",
  parentMiddleName: "",
  parentEmail: "",
  parentPhone: "",
  teacherId: "",
};

export default function AddChildModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  initialParent = null,
}: AddChildModalProps) {
  const [formData, setFormData] = useState<ChildFormData>(initialFormData);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [dateErrors, setDateErrors] = useState<{
    dateOfBirth?: string;
    enrollmentDate?: string;
  }>({});
  const [fieldErrors, setFieldErrors] = useState<AddChildFormErrors>({});
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = initialParent ? 2 : 3;

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

  // Reset form when modal closes; pre-fill parent when initialParent provided
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setDateErrors({});
      setCurrentStep(1);
    } else if (initialParent) {
      setFormData({
        ...initialFormData,
        parentFirstName: initialParent.firstName,
        parentMiddleName: initialParent.middleName ?? "",
        parentLastName: initialParent.lastName,
        parentEmail: initialParent.email,
      });
      setDateErrors({});
    } else {
      setFormData(initialFormData);
      setDateErrors({});
    }
  }, [isOpen, initialParent]);

  const generateStudentId = (enrollmentDate: string) => {
    const year = new Date(enrollmentDate).getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `CDC-${year}-${random}`;
  };

  const generateChildLinkCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age.toString();
  };

  const applyDateValidation = (data: ChildFormData) => {
    const nextErrors = validateDateFields({
      dateOfBirth: data.dateOfBirth,
      enrollmentDate: data.enrollmentDate,
    });
    setDateErrors(nextErrors);
    return !nextErrors.dateOfBirth && !nextErrors.enrollmentDate;
  };

  const buildAddChildValues = (data: ChildFormData): AddChildFormValues => ({
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    age: data.age,
    gender: data.gender,
    enrollmentDate: data.enrollmentDate,
    schoolYear: data.schoolYear,
    parentLastName: data.parentLastName,
    parentFirstName: data.parentFirstName,
    parentMiddleName: data.parentMiddleName,
    parentEmail: data.parentEmail,
    parentPhone: data.parentPhone,
  });

  const validateStep = (step: number, data: ChildFormData): boolean => {
    const addChildValues = buildAddChildValues(data);
    const requireParentInfo = !initialParent;
    const stepFields: (keyof AddChildFormValues)[] =
      step === 1
        ? ["firstName", "middleName", "lastName", "dateOfBirth", "gender"]
        : step === 2
          ? ["enrollmentDate", "schoolYear"]
          : ["parentFirstName", "parentMiddleName", "parentLastName", "parentEmail", "parentPhone"];

    const nextFieldErrors: AddChildFormErrors = { ...fieldErrors };

    for (const field of stepFields) {
      const error = validateAddChildField(field, addChildValues, {
        requireParentInfo,
      });
      if (error) {
        nextFieldErrors[field] = error;
      } else {
        delete nextFieldErrors[field];
      }
    }

    setFieldErrors(nextFieldErrors);

    if (step === 1 && dateErrors.dateOfBirth) {
      return false;
    }

    if (step === 2 && dateErrors.enrollmentDate) {
      return false;
    }

    return Object.keys(nextFieldErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = e.target;
    const rawValue = e.target.value;
    const value =
      name === "parentPhone" ? sanitizePhoneInput(rawValue) : rawValue;

    setFormData((prev) => {
      let updatedData = { ...prev, [name]: value };

      // Auto-calculate age
      if (name === "dateOfBirth") {
        updatedData.age = calculateAge(value);
      }

      // Auto-calculate school year from enrollment date
      if (name === "enrollmentDate") {
        const year = new Date(value).getFullYear();
        if (!isNaN(year)) {
          updatedData.schoolYear = `${year}-${year + 1}`;
        }
      }

      if (name === "dateOfBirth" || name === "enrollmentDate") {
        applyDateValidation(updatedData);
      }

      // Run per-field validation for parent-related fields when typing.
      if (
        name === "parentFirstName" ||
        name === "parentMiddleName" ||
        name === "parentLastName" ||
        name === "parentEmail" ||
        name === "parentPhone"
      ) {
        const addChildValues: AddChildFormValues = {
          firstName: updatedData.firstName,
          middleName: updatedData.middleName,
          lastName: updatedData.lastName,
          dateOfBirth: updatedData.dateOfBirth,
          age: updatedData.age,
          gender: updatedData.gender,
          enrollmentDate: updatedData.enrollmentDate,
          schoolYear: updatedData.schoolYear,
          parentLastName: updatedData.parentLastName,
          parentFirstName: updatedData.parentFirstName,
          parentMiddleName: updatedData.parentMiddleName,
          parentEmail: updatedData.parentEmail,
          parentPhone: updatedData.parentPhone,
        };
        const error = validateAddChildField(
          name as keyof AddChildFormValues,
          addChildValues,
          { requireParentInfo: !initialParent },
        );
        setFieldErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }

      return updatedData;
    });
  };

  const handleNextStep = () => {
    if (currentStep >= totalSteps) return;
    if (!validateStep(currentStep, formData)) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep <= 1) return;
    setCurrentStep((prev) => prev - 1);
  };

  const handleGenderChange = (gender: "male" | "female") => {
    setFormData((prev) => ({
      ...prev,
      gender,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== totalSteps) {
      return;
    }

    // Run full form validation including phone rules.
    const addChildValues = buildAddChildValues(formData);

    const errors = validateAddChildForm(addChildValues, {
      requireParentInfo: !initialParent,
    });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const studentId = generateStudentId(formData.enrollmentDate);
    const childLinkCode = generateChildLinkCode();

    onSave({
      ...formData,
      teacherId: formData.teacherId?.trim() || undefined,
      studentId,
      childLinkCode,
    });

  };

  if (!isOpen) return null;
  const todayDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {initialParent
                ? "Add Child for Existing Parent"
                : "Add Child Record"}
            </h2>
            <p className="text-sm text-gray-500">
              {initialParent
                ? `Linking new child to ${initialParent.firstName} ${initialParent.lastName} (${initialParent.email})`
                : "Encode child information from existing enrollment records"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 1
                      ? "bg-teal-600 text-white"
                      : currentStep > 1
                        ? "bg-teal-100 text-teal-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                >
                  1
                </div>
                <span className="mt-1 text-xs text-gray-700">Child Info</span>
              </div>
              <div className="flex-1 h-px mx-2 bg-gray-200" />
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 2
                      ? "bg-teal-600 text-white"
                      : currentStep > 2
                        ? "bg-teal-100 text-teal-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                >
                  2
                </div>
                <span className="mt-1 text-xs text-gray-700">Enrollment</span>
              </div>
              {!initialParent && (
                <>
                  <div className="flex-1 h-px mx-2 bg-gray-200" />
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 3
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      3
                    </div>
                    <span className="mt-1 text-xs text-gray-700">
                      Parent Info
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1 — Child Information */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Child Information
              </h3>
              <div className="space-y-4">
                {/* First, Middle, Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      placeholder="Enter middle name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth and Age */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        max={todayDate}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    {dateErrors.dateOfBirth && (
                      <p className="mt-1 text-xs text-red-600">
                        {dateErrors.dateOfBirth}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      readOnly
                      onChange={handleInputChange}
                      placeholder="Auto-calculated"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      <span className="text-sm text-gray-700">Male</span>
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
                      <span className="text-sm text-gray-700">Female</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Enrollment Details */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Enrollment Details
              </h3>
              <div className="space-y-4">
                {/* Enrollment Date and School Year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enrollment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="enrollmentDate"
                      value={formData.enrollmentDate}
                      onChange={handleInputChange}
                      min={formData.dateOfBirth || undefined}
                      max={todayDate}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    {dateErrors.enrollmentDate && (
                      <p className="mt-1 text-xs text-red-600">
                        {dateErrors.enrollmentDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="schoolYear"
                      value={formData.schoolYear}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Teacher
                  </label>
                  <select
                    name="teacherId"
                    value={formData.teacherId || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              </div>
            </div>
          )}

          {/* Step 3 — Parent Information (skipped when parent is pre-selected) */}
          {!initialParent && currentStep === 3 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Parent / Guardian Information
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                To add another child for an existing parent, enter their email
                address. The child will be linked automatically.
              </p>

              <div className="space-y-4">
                {/* Last Name, First Name, Middle Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentFirstName"
                      value={formData.parentFirstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    {fieldErrors.parentFirstName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.parentFirstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentMiddleName"
                      value={formData.parentMiddleName}
                      onChange={handleInputChange}
                      placeholder="Enter middle name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    {fieldErrors.parentMiddleName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.parentMiddleName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="parentLastName"
                      value={formData.parentLastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {fieldErrors.parentLastName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.parentLastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Email (Login Credential){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    placeholder="parent@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  {fieldErrors.parentEmail && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.parentEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    placeholder="09123456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  {fieldErrors.parentPhone && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.parentPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3">
            <div className="text-teal-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-teal-700">
              Student ID and Child Link Code are generated automatically by the
              system after saving.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-between pt-4 border-t">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Child"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
