import { useState } from "react";
import { X } from "lucide-react";
import { createTeacher } from "../../api/teacher.api";
import { showTeacherCredentialsModal, showErrorModal } from "../../utils/sweetalert.modal";
import {
  type AddTeacherField,
  type AddTeacherFormErrors,
  validateAddTeacherField,
  validateAddTeacherForm,
} from "../../utils/formValidation";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function AddTeacherModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AddTeacherFormErrors>({});

  const setFieldError = (field: AddTeacherField, nextForm = form) => {
    const error = validateAddTeacherField(field, nextForm);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as AddTeacherField;
    const nextForm = {
      ...form,
      [field]: value,
    };
    setForm(nextForm);

    if (errors[field]) {
      setFieldError(field, nextForm);
    }
  };

  const handleFieldBlur = (field: AddTeacherField) => {
    setFieldError(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateAddTeacherForm(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const res = await createTeacher(form);

      onClose();

      setTimeout(async () => {
        await showTeacherCredentialsModal(
          form.firstName,
          form.lastName,
          res.credentials.email,
          res.emailDelivery,
        );

        onCreated();

      }, 150);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create teacher";
      showErrorModal(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Teacher</h2>
            <p className="text-sm text-gray-500">
              Create a new teacher account with auto-generated credentials
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Teacher Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Teacher Information
            </h3>
            <div className="space-y-4">
              {/* First Name, Middle Name Last Name */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("firstName")}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={form.middleName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("middleName")}
                    placeholder="Enter middle name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  {errors.middleName && (
                    <p className="mt-1 text-xs text-red-600">{errors.middleName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur("lastName")}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Login Credential) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur("email")}
                  placeholder="teacher@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur("phone")}
                  placeholder="+63 912 345 6789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

            </div>
          </div>

          {/* Info Box */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3">
            <div className="text-teal-600 mt-0.5">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-teal-700">
              Employee ID and temporary password are generated automatically by the
              system. The teacher will be required to change their password on first login.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Teacher"}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
}

