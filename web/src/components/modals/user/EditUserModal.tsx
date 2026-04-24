import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, User as UserIcon, Save } from "lucide-react";
import Swal from "sweetalert2";
import { type User } from "@/api/authentication.api";
import { updateUser } from "@/api/admin.api";
import { showErrorModal } from "@/utils/sweetAlertModal";

type Props = {
  user: User;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
};

type EditUserForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
};

const validateField = (name: keyof EditUserForm, value: string): string | undefined => {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    const labelMap: Record<keyof EditUserForm, string> = {
      firstName: "First name is required.",
      middleName: "Middle name is required.",
      lastName: "Last name is required.",
      email: "Email is required.",
      phone: "Phone number is required.",
    };
    return labelMap[name];
  }

  if (name === "email") {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValidEmail) return "Email is invalid.";
  }

  return undefined;
};

const getFormFromUser = (user: User): EditUserForm => ({
  firstName: user.firstName,
  middleName: user.middleName || "",
  lastName: user.lastName,
  email: user.email,
  phone: user.phone || "",
});

export default function EditUserModal({ user, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<EditUserForm>({
    defaultValues: getFormFromUser(user),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const validateInput = (field: keyof EditUserForm) => (value: string) =>
    validateField(field, value) || true;

  useEffect(() => {
    reset(getFormFromUser(user));
    void trigger();
  }, [user, reset, trigger]);

  const onSubmit = async (form: EditUserForm) => {
    setLoading(true);
    try {
      await updateUser(user._id, form);

      await Swal.fire({
        title: "Success",
        text: "User updated successfully",
        icon: "success",
        confirmButtonColor: "#0D9488",
      });

      onClose();
      await onUpdated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      showErrorModal(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 bg-teal-50 border-b border-teal-200 dark:bg-teal-900/20 dark:border-teal-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Edit User</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {user.firstName} {user.middleName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 dark:bg-slate-900">
          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                user.role === "teacher"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                  : user.role === "parent"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
              }`}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                  {...register("firstName", {
                    validate: validateInput("firstName"),
                  })}
                />
                {errors.firstName?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">
                  Middle Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                  {...register("middleName", {
                    validate: validateInput("middleName"),
                  })}
                />
                {errors.middleName?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.middleName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                  {...register("lastName", {
                    validate: validateInput("lastName"),
                  })}
                />
                {errors.lastName?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="user@email.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                {...register("email", {
                  validate: validateInput("email"),
                })}
              />
              {errors.email?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-300">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="Enter phone number"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
                {...register("phone", {
                  validate: validateInput("phone"),
                })}
              />
              {errors.phone?.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700">
            <div className="flex gap-3 sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
