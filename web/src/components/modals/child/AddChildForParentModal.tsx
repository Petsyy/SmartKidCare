import { useState, useEffect, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
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
  onSave: (
    data: ChildForParentFormData & { parent: ParentForChild },
    files: {
      birthCertificate: File;
      parentId: File;
    },
  ) => void;
  isLoading?: boolean;
};

const currentYear = new Date().getFullYear();
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const initialFormData: ChildForParentFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  age: "",
  gender: "male",
  enrollmentDate: "",
  schoolYear: `${currentYear}-${currentYear + 1}`,
};

function calculateAge(dob: string) {
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
}

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDobBounds = (referenceDate: Date) => {
  const minDate = new Date(referenceDate);
  minDate.setFullYear(minDate.getFullYear() - 6);
  minDate.setDate(minDate.getDate() + 1);

  const maxDate = new Date(referenceDate);
  maxDate.setFullYear(maxDate.getFullYear() - 3);

  return {
    min: formatDateInputValue(minDate),
    max: formatDateInputValue(maxDate),
  };
};

export default function AddChildForParentModal({
  isOpen,
  parent,
  onClose,
  onSave,
  isLoading = false,
}: AddChildForParentModalProps) {
  const [formData, setFormData] =
    useState<ChildForParentFormData>(initialFormData);
  const [errors, setErrors] = useState<AddChildForParentFormErrors>({});
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
  const today = new Date();
  const todayDate = formatDateInputValue(today);
  const { min: minAgeDate, max: maxAgeDate } = getDobBounds(today);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setBirthCertificateFile(null);
      setParentIdFile(null);
      setDocumentErrors({});
      setDocumentsConfirmed(false);
    }
  }, [isOpen]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const field = name as AddChildForParentField;
    const nextForm: ChildForParentFormData = { ...formData, [field]: value };

    if (field === "dateOfBirth") nextForm.age = calculateAge(value);
    if (field === "enrollmentDate" && value) {
      const year = new Date(value).getFullYear();
      if (!isNaN(year)) nextForm.schoolYear = `${year}-${year + 1}`;
    }

    setFormData(nextForm);

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
    const nextForm = { ...formData, gender };
    setFormData(nextForm);
    setFieldError("gender", nextForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateAddChildForParentForm(formData);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
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

    onSave(
      { ...formData, parent },
      {
        birthCertificate: birthCertificateFile as File,
        parentId: parentIdFile as File,
      },
    );
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

  if (!isOpen) return null;

  const inputClass = (field: AddChildForParentField) =>
    `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 ${
      errors[field]
        ? "border-red-300 focus:ring-red-200"
        : "border-gray-300 focus:ring-teal-500"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              Add Child for Existing Parent
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Linking new child to {parent.firstName} {parent.lastName} (
              {parent.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 dark:bg-slate-900"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-slate-50">
              Child Information
            </h3>
            <div className="space-y-4">
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
                    onBlur={() => handleFieldBlur("firstName")}
                    placeholder="Enter first name"
                    maxLength={50}
                    className={inputClass("firstName")}
                    required
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.firstName}
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
                    onBlur={() => handleFieldBlur("middleName")}
                    placeholder="Enter middle name"
                    maxLength={50}
                    className={inputClass("middleName")}
                  />
                  {errors.middleName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.middleName}
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
                    onBlur={() => handleFieldBlur("lastName")}
                    placeholder="Enter last name"
                    maxLength={50}
                    className={inputClass("lastName")}
                    required
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    min={minAgeDate}
                    max={maxAgeDate}
                    className={inputClass("dateOfBirth")}
                    required
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Age
                  </label>
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
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      Male
                    </span>
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
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      Female
                    </span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-slate-50">
              Enrollment Details
            </h3>
            <div className="space-y-4">
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
                    onBlur={() => handleFieldBlur("enrollmentDate")}
                    min={formData.dateOfBirth || undefined}
                    max={todayDate}
                    className={inputClass("enrollmentDate")}
                    required
                  />
                  {errors.enrollmentDate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.enrollmentDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    School Year
                  </label>
                  <input
                    type="text"
                    name="schoolYear"
                    value={formData.schoolYear}
                    onBlur={() => handleFieldBlur("schoolYear")}
                    readOnly
                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:outline-none dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 ${
                      errors.schoolYear ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.schoolYear && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.schoolYear}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 dark:text-slate-50">
                Required Documents
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Upload clear scanned copies for verification. Only PDF, JPG, and
                PNG are allowed. Maximum file size: 5MB each.
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
                                <span className="text-gray-300 dark:text-slate-600">
                                  |
                                </span>
                                <span>
                                  {getFileExtension(birthCertificateFile.name)}
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
                                <span>{formatFileSize(parentIdFile.size)}</span>
                                <span className="text-gray-300 dark:text-slate-600">
                                  |
                                </span>
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

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3 dark:bg-teal-900/20 dark:border-teal-700/30">
            <svg
              className="w-5 h-5 text-teal-600 shrink-0 mt-0.5 dark:text-teal-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-teal-700 dark:text-teal-300">
              Student ID is generated automatically. The child will be linked to
              this parent account.
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
