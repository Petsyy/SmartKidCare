import { useState, useEffect, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { getUsers, type User } from "@/api/authentication.api";
import {
  type AddChildFormErrors,
  type AddChildFormValues,
  validateAddChildForm,
  sanitizePhoneInput,
  buildAddChildValuesFromForm,
  validateChildField,
  validateChildStep,
  validateDateFields,
} from "@/utils/formValidation";

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
  onSave: (
    data: ChildFormData,
    files: {
      birthCertificate: File;
      parentId: File;
    },
  ) => void;
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

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileExtension = (name: string) => {
  const parts = String(name || "").split(".");
  if (parts.length <= 1) return "FILE";
  return String(parts.pop() || "FILE").toUpperCase();
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
  const [birthCertificateFile, setBirthCertificateFile] = useState<File | null>(
    null,
  );
  const [parentIdFile, setParentIdFile] = useState<File | null>(null);
  const [documentErrors, setDocumentErrors] = useState<{
    birthCertificate?: string;
    parentId?: string;
    confirmation?: string;
  }>({});
  const [documentsConfirmed, setDocumentsConfirmed] = useState(false);
  const birthCertificateInputRef = useRef<HTMLInputElement | null>(null);
  const parentIdInputRef = useRef<HTMLInputElement | null>(null);

  const totalSteps = initialParent ? 3 : 4;
  const documentsStep = initialParent ? 3 : 4;

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      try {
        const teacherUsers = await getUsers({ role: "teacher" });
        if (!isMounted) return;
        setTeachers(
          teacherUsers.filter(
            (teacher) =>
              teacher.role === "teacher" && teacher.isActive !== false,
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
      setBirthCertificateFile(null);
      setParentIdFile(null);
      setDocumentErrors({});
      setDocumentsConfirmed(false);
    } else if (initialParent) {
      setFormData({
        ...initialFormData,
        parentFirstName: initialParent.firstName,
        parentMiddleName: initialParent.middleName ?? "",
        parentLastName: initialParent.lastName,
        parentEmail: initialParent.email,
      });
      setDateErrors({});
      setBirthCertificateFile(null);
      setParentIdFile(null);
      setDocumentErrors({});
      setDocumentsConfirmed(false);
    } else {
      setFormData(initialFormData);
      setDateErrors({});
      setBirthCertificateFile(null);
      setParentIdFile(null);
      setDocumentErrors({});
      setDocumentsConfirmed(false);
    }
  }, [isOpen, initialParent]);

  const generateStudentId = (enrollmentDate: string) => {
    const year = new Date(enrollmentDate).getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `CDC-${year}-${random}`;
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

  const validateStep = (step: number, data: ChildFormData): boolean => {
    const addChildValues = buildAddChildValuesFromForm(data);
    const { isValid, errors } = validateChildStep(
      step,
      addChildValues,
      dateErrors,
      { requireParentInfo: !initialParent },
      fieldErrors,
    );
    setFieldErrors(errors);
    return isValid;
  };

  const setFieldValidationError = (
    field: keyof AddChildFormValues,
    data: ChildFormData,
  ) => {
    const error = validateChildField(field, buildAddChildValuesFromForm(data), {
      requireParentInfo: !initialParent,
    });
    setFieldErrors((prev: AddChildFormErrors) => ({
      ...prev,
      [field]: error,
    }));
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

      const validationFields = new Set<keyof AddChildFormValues>([
        "firstName",
        "middleName",
        "lastName",
        "dateOfBirth",
        "enrollmentDate",
        "schoolYear",
        "teacherId",
        "parentFirstName",
        "parentMiddleName",
        "parentLastName",
        "parentEmail",
        "parentPhone",
      ]);
      if (validationFields.has(name as keyof AddChildFormValues)) {
        setFieldValidationError(name as keyof AddChildFormValues, updatedData);
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
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        gender,
      };
      setFieldValidationError("gender", updatedData);
      return updatedData;
    });
  };

  const validateDocumentFile = (file: File | null): string | null => {
    if (!file) return "File is required.";

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return "Only PDF, JPG, and PNG files are allowed.";
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return "File size must be 5MB or below.";
    }

    return null;
  };

  const handleDocumentChange = (
    type: "birthCertificate" | "parentId",
    file: File | null,
  ) => {
    const error = validateDocumentFile(file);

    if (type === "birthCertificate") {
      setBirthCertificateFile(file);
      setDocumentErrors((prev) => ({
        ...prev,
        birthCertificate: error || undefined,
      }));
      return;
    }

    setParentIdFile(file);
    setDocumentErrors((prev) => ({
      ...prev,
      parentId: error || undefined,
    }));
  };

  const removeDocument = (type: "birthCertificate" | "parentId") => {
    if (type === "birthCertificate") {
      setBirthCertificateFile(null);
      setDocumentErrors((prev) => ({
        ...prev,
        birthCertificate: "Birth Certificate is required.",
      }));
      if (birthCertificateInputRef.current) {
        birthCertificateInputRef.current.value = "";
      }
      return;
    }

    setParentIdFile(null);
    setDocumentErrors((prev) => ({
      ...prev,
      parentId: "Parent ID is required.",
    }));
    if (parentIdInputRef.current) {
      parentIdInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== totalSteps) {
      return;
    }

    const birthError = validateDocumentFile(birthCertificateFile);
    const parentError = validateDocumentFile(parentIdFile);
    const confirmationError = documentsConfirmed
      ? undefined
      : "Please confirm that uploaded documents were verified.";

    if (birthError || parentError || confirmationError) {
      setDocumentErrors({
        birthCertificate: birthError || undefined,
        parentId: parentError || undefined,
        confirmation: confirmationError,
      });
      return;
    }

    // Run full form validation including phone rules.
    const addChildValues = buildAddChildValuesFromForm(formData);

    const errors = validateAddChildForm(addChildValues, {
      requireParentInfo: !initialParent,
    });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const studentId = generateStudentId(formData.enrollmentDate);

    onSave(
      {
        ...formData,
        teacherId: formData.teacherId?.trim() || undefined,
        studentId,
      },
      {
        birthCertificate: birthCertificateFile as File,
        parentId: parentIdFile as File,
      },
    );
  };

  if (!isOpen) return null;
  const todayDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              {initialParent
                ? "Add Child for Existing Parent"
                : "Add Child Record"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {initialParent
                ? `Linking new child to ${initialParent.firstName} ${initialParent.lastName} (${initialParent.email})`
                : "Encode child information from existing enrollment records"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-4">
            {(initialParent
              ? ["Child Info", "Enrollment", "Documents"]
              : ["Child Info", "Enrollment", "Parent Info", "Documents"]
            ).map((label, index, arr) => {
              const stepNumber = index + 1;

              return (
                <div key={label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep === stepNumber
                          ? "bg-teal-600 text-white"
                          : currentStep > stepNumber
                            ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                            : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {stepNumber}
                    </div>
                    <span className="mt-1 text-xs text-gray-700 dark:text-slate-300">{label}</span>
                  </div>

                  {index < arr.length - 1 && (
                    <div className="flex-1 h-px mx-2 bg-gray-200 dark:bg-slate-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 dark:bg-slate-900">
          {/* Step 1 — Child Information */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-slate-50">
                Child Information
              </h3>
              <div className="space-y-4">
                {/* First, Middle, Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={() =>
                        setFieldValidationError("firstName", formData)
                      }
                      placeholder="Enter first name"
                      maxLength={50}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 ${
                        fieldErrors.firstName
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300 focus:ring-teal-500"
                      }`}
                      required
                    />
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      Middle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      onBlur={() =>
                        setFieldValidationError("middleName", formData)
                      }
                      placeholder="Enter middle name"
                      maxLength={50}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 ${
                        fieldErrors.middleName
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300 focus:ring-teal-500"
                      }`}
                    />
                    {fieldErrors.middleName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.middleName}
                      </p>
                    )}
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
                      onBlur={() =>
                        setFieldValidationError("lastName", formData)
                      }
                      placeholder="Enter last name"
                      maxLength={50}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 ${
                        fieldErrors.lastName
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300 focus:ring-teal-500"
                      }`}
                      required
                    />
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date of Birth and Age */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        onBlur={() =>
                          setFieldValidationError("dateOfBirth", formData)
                        }
                        max={todayDate}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 ${
                          fieldErrors.dateOfBirth || dateErrors.dateOfBirth
                            ? "border-red-300 focus:ring-red-200"
                            : "border-gray-300 focus:ring-teal-500"
                        }`}
                        required
                      />
                    </div>
                    {(fieldErrors.dateOfBirth || dateErrors.dateOfBirth) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.dateOfBirth || dateErrors.dateOfBirth}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      readOnly
                      onChange={handleInputChange}
                      placeholder="Auto-calculated"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    />
                  </div>
                </div>

                {/* Gender */}
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
                  {fieldErrors.gender && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.gender}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Enrollment Details */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-slate-50">
                Enrollment Details
              </h3>
              <div className="space-y-4">
                {/* Enrollment Date and School Year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      Enrollment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="enrollmentDate"
                      value={formData.enrollmentDate}
                      onChange={handleInputChange}
                      onBlur={() =>
                        setFieldValidationError("enrollmentDate", formData)
                      }
                      min={formData.dateOfBirth || undefined}
                      max={todayDate}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 ${
                        fieldErrors.enrollmentDate || dateErrors.enrollmentDate
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300 focus:ring-teal-500"
                      }`}
                      required
                    />
                    {(fieldErrors.enrollmentDate ||
                      dateErrors.enrollmentDate) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.enrollmentDate ||
                          dateErrors.enrollmentDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      School Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="schoolYear"
                      value={formData.schoolYear}
                      readOnly
                      onBlur={() =>
                        setFieldValidationError("schoolYear", formData)
                      }
                      className={`w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:outline-none dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 ${
                        fieldErrors.schoolYear
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.schoolYear && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.schoolYear}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Assigned Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="teacherId"
                    value={formData.teacherId || ""}
                    onChange={handleInputChange}
                    onBlur={() => setFieldValidationError("teacherId", formData)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 ${
                      fieldErrors.teacherId
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:ring-teal-500"
                    }`}
                  >
                    <option value="">Unassigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.lastName}, {teacher.firstName}
                        {teacher.middleName ? ` ${teacher.middleName}` : ""}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.teacherId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.teacherId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Parent Information (skipped when parent is pre-selected) */}
          {!initialParent && currentStep === 3 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 dark:text-slate-50">
                Parent / Guardian Information
              </h3>
              <p className="text-sm text-gray-500 mb-4 dark:text-slate-400">
                To add another child for an existing parent, enter their email
                address. The child will be linked automatically.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentFirstName"
                      value={formData.parentFirstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                      required
                    />
                    {fieldErrors.parentFirstName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.parentFirstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      Middle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentMiddleName"
                      value={formData.parentMiddleName}
                      onChange={handleInputChange}
                      placeholder="Enter middle name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                      required
                    />
                    {fieldErrors.parentMiddleName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.parentMiddleName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="parentLastName"
                      value={formData.parentLastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    />
                    {fieldErrors.parentLastName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.parentLastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Parent Email (Login Credential){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    placeholder="parent@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    required
                  />
                  {fieldErrors.parentEmail && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.parentEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Parent Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    placeholder="09123456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    required
                  />
                  {fieldErrors.parentPhone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.parentPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents Upload */}
          {currentStep === documentsStep && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 dark:text-slate-50">
                  Required Documents
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Upload clear scanned copies for verification. Only PDF, JPG,
                  and PNG are allowed. Maximum file size: 5MB each.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 flex flex-col dark:border-slate-700 dark:bg-slate-700/30">
                  <div className="flex items-start justify-between gap-3 mb-3 min-h-11.5">
                    <p className="text-[15px] font-semibold text-gray-900 leading-5 pr-2 dark:text-slate-50">
                      Birth Certificate <span className="text-red-500">*</span>
                    </p>
                    {birthCertificateFile ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full dark:text-emerald-300 dark:bg-emerald-900/30">
                        <CheckCircle2 size={12} />
                        Uploaded
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full dark:text-amber-300 dark:bg-amber-900/30">
                        <AlertCircle size={12} />
                        Required
                      </span>
                    )}
                  </div>

                  <input
                    ref={birthCertificateInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleDocumentChange(
                        "birthCertificate",
                        e.target.files?.[0] || null,
                      )
                    }
                    className="hidden"
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => birthCertificateInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        birthCertificateInputRef.current?.click();
                      }
                    }}
                    className="w-full rounded-lg border-2 border-dashed border-teal-300 bg-white px-4 py-4 text-left transition hover:border-teal-500 hover:bg-teal-50 mt-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:bg-slate-900 dark:border-teal-700/50 dark:hover:bg-slate-700/50"
                  >
                    {!birthCertificateFile ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                          <UploadCloud size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-50">
                            Choose a file
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            PDF, JPG, PNG up to 5MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-50">
                          Replace file
                        </p>

                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1 flex items-start gap-2.5">
                              <span className="shrink-0 mt-0.5 text-gray-500 dark:text-slate-400">
                                <FileText size={14} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-medium text-gray-800 wrap-break-word leading-5 dark:text-slate-50"
                                  title={birthCertificateFile.name}
                                >
                                  {birthCertificateFile.name}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
                                  <span>
                                    {formatFileSize(birthCertificateFile.size)}
                                  </span>
                                  <span className="text-gray-300 dark:text-slate-600">|</span>
                                  <span>
                                    {getFileExtension(
                                      birthCertificateFile.name,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument("birthCertificate");
                              }}
                              className="inline-flex items-center gap-1 self-start text-xs text-rose-600 hover:text-rose-700 cursor-pointer sm:ml-3 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                              <Trash2 size={12} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {documentErrors.birthCertificate && (
                    <p className="mt-2 text-xs text-red-600 min-h-4.5 dark:text-red-400">
                      {documentErrors.birthCertificate}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 flex flex-col dark:border-slate-700 dark:bg-slate-700/30">
                  <div className="flex items-start justify-between gap-3 mb-3 min-h-11.5">
                    <p className="text-[15px] font-semibold text-gray-900 leading-5 pr-2 dark:text-slate-50">
                      Parent Valid Government ID{" "}
                      <span className="text-red-500">*</span>
                    </p>
                    {parentIdFile ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full dark:text-emerald-300 dark:bg-emerald-900/30">
                        <CheckCircle2 size={12} />
                        Uploaded
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full dark:text-amber-300 dark:bg-amber-900/30">
                        <AlertCircle size={12} />
                        Required
                      </span>
                    )}
                  </div>

                  <input
                    ref={parentIdInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleDocumentChange(
                        "parentId",
                        e.target.files?.[0] || null,
                      )
                    }
                    className="hidden"
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => parentIdInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        parentIdInputRef.current?.click();
                      }
                    }}
                    className="w-full rounded-lg border-2 border-dashed border-teal-300 bg-white px-4 py-4 text-left transition hover:border-teal-500 hover:bg-teal-50 mt-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:bg-slate-900 dark:border-teal-700/50 dark:hover:bg-slate-700/50"
                  >
                    {!parentIdFile ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                          <UploadCloud size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-50">
                            Choose a file
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            PDF, JPG, PNG up to 5MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-50">
                          Replace file
                        </p>

                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1 flex items-start gap-2.5">
                              <span className="shrink-0 mt-0.5 text-gray-500 dark:text-slate-400">
                                <FileText size={14} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-medium text-gray-800 wrap-break-word leading-5 dark:text-slate-50"
                                  title={parentIdFile.name}
                                >
                                  {parentIdFile.name}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
                                  <span>
                                    {formatFileSize(parentIdFile.size)}
                                  </span>
                                  <span className="text-gray-300 dark:text-slate-600">|</span>
                                  <span>
                                    {getFileExtension(parentIdFile.name)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument("parentId");
                              }}
                              className="inline-flex items-center gap-1 self-start text-xs text-rose-600 hover:text-rose-700 cursor-pointer sm:ml-3 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                              <Trash2 size={12} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {documentErrors.parentId && (
                    <p className="mt-2 text-xs text-red-600 min-h-4.5 dark:text-red-400">
                      {documentErrors.parentId}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={documentsConfirmed}
                    onChange={(e) => {
                      setDocumentsConfirmed(e.target.checked);
                      setDocumentErrors((prev) => ({
                        ...prev,
                        confirmation: undefined,
                      }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm leading-6 text-gray-700 dark:text-slate-300">
                    I confirm that the uploaded documents were verified against
                    the original physical copies.
                  </span>
                </label>
                {documentErrors.confirmation && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {documentErrors.confirmation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3 dark:bg-teal-900/20 dark:border-teal-700/30">
            <div className="text-teal-600 mt-0.5 dark:text-teal-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-teal-700 dark:text-teal-300">
              Student IDs are auto-generated based on enrollment year and a
              random number. For example, a child enrolled in 2024 might receive
              an ID like{" "}
              <span className="font-mono bg-teal-100 px-1 rounded dark:bg-teal-900/40">
                CDC-2024-123456
              </span>
              .
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-between pt-4 border-t dark:border-slate-700">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
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
