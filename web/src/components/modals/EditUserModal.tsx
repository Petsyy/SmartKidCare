import { useState } from "react";
import { X } from "lucide-react";
import Swal from "sweetalert2";
import { type User } from "../../api/authentication.api";
import { updateUser, deleteUser } from "../../api/admin.api";
import { showErrorModal } from "../../utils/sweetalert.modal";

type Props = {
  user: User;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
};

export default function EditUserModal({ user, onClose, onUpdated, onDeleted }: Props) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      Swal.fire({
        title: "Missing Fields",
        text: "Please fill all required fields",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#0D9488",
      });
      return;
    }

    setLoading(true);
    try {
      await updateUser(user._id, form);

      Swal.fire({
        title: "Success",
        text: "User updated successfully",
        icon: "success",
        confirmButtonColor: "#0D9488",
      });

      onClose();
      await onUpdated();
    } catch (error: any) {
      showErrorModal(error.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await deleteUser(user._id);

      Swal.fire({
        title: "Deleted",
        text: "User has been deleted",
        icon: "success",
        confirmButtonColor: "#0D9488",
      });

      onClose();
      await onDeleted();
    } catch (error: any) {
      showErrorModal(error.message || "Failed to delete user");
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
            <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-500">
              Update user information for {user.firstName} {user.lastName}
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
          {/* User Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              User Information
            </h3>
            <div className="space-y-4">
              {/* Role Badge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === "teacher"
                    ? "bg-blue-100 text-blue-800"
                    : user.role === "parent"
                    ? "bg-green-100 text-green-800"
                    : "bg-purple-100 text-purple-800"
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>

              {/* Employee ID (Teacher only) */}
              {user.employeeId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={user.employeeId}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}

              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
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
                    placeholder="Enter last name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="user@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-between pt-4 border-t">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-2 border border-red-300 rounded-lg text-red-600 font-medium hover:bg-red-50 transition disabled:opacity-50"
            >
              Delete User
            </button>
            <div className="flex gap-3">
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
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
