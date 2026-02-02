import { useState, useEffect } from "react";
import { X } from "lucide-react";

export type ChildFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: "male" | "female";
  enrollmentDate: string;
  schoolYear: string;
  status: string;

  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;

  studentId?: string;
  childLinkCode?: string;
};

type AddChildModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ChildFormData) => void;
  isLoading?: boolean;
};

const schoolYears = [
  "2024-2025",
  "2025-2026",
  "2026-2027",
];

const statuses = ["Active", "Inactive", "On Leave"];

const initialFormData: ChildFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  age: "",
  gender: "male",
  enrollmentDate: "",
  schoolYear: "2024-2025",
  status: "Active",

  parentFirstName: "",
  parentLastName: "",
  parentEmail: "",
};

export default function AddChildModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: AddChildModalProps) {
  const [formData, setFormData] = useState<ChildFormData>(initialFormData);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

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

      return updatedData;
    });
  };


  const handleGenderChange = (gender: "male" | "female") => {
    setFormData((prev) => ({
      ...prev,
      gender,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please fill in required fields");
      return;
    }

    const studentId = generateStudentId(formData.enrollmentDate);
    const childLinkCode = generateChildLinkCode();

    onSave({
      ...formData,
      studentId,
      childLinkCode,
    });

    // Reset after submission (will be called before async completes, but that's expected)
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Child Record</h2>
            <p className="text-sm text-gray-500">
              Encode child information from existing enrollment records
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
          {/* Child Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Child Information
            </h3>
            <div className="space-y-4">
              {/* First Name and Middle Name */}
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter middle name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Last Name */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Date of Birth and Age */}
              <div className="grid grid-cols-2 gap-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
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

          {/* Enrollment Details Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Enrollment Details
            </h3>
            <div className="space-y-4">
              {/* Enrollment Date and School Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enrollment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="enrollmentDate"
                    value={formData.enrollmentDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="schoolYear"
                    value={formData.schoolYear}
                    disabled
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {schoolYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parent Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Parent / Guardian Information
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="parentFirstName"
                    value={formData.parentFirstName}
                    onChange={handleInputChange}
                    placeholder="Enter parent first name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="parentLastName"
                    value={formData.parentLastName}
                    onChange={handleInputChange}
                    placeholder="Enter parent last name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Email (Login Credential) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleInputChange}
                  placeholder="parent@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
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
              Student ID and Child Link Code are generated automatically by the
              system after saving.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Child"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
