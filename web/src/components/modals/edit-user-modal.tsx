import { X, User as UserIcon, Save } from "lucide-react";
import { type User } from "@/api/authentication.api";
import { useEditUserForm } from "./useEditUserForm";
import { InputField } from "@/components/ui/form-fields";

type Props = {
  user: User;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
  onDeleted?: () => Promise<void> | void;
};

export default function EditUserModal({ user, onClose, onUpdated }: Props) {
  const { form, isSubmitting, onSubmit } = useEditUserForm({
    user,
    onClose,
    onUpdated,
  });

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden dark:bg-slate-900 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 bg-teal-50 border-b border-teal-200 dark:bg-teal-900/20 dark:border-teal-900/50 shrink-0">
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 dark:bg-slate-900">
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
              <InputField
                label="First Name"
                placeholder="Enter first name"
                required
                registration={register("firstName")}
                error={errors.firstName?.message}
              />
              <InputField
                label="Middle Name"
                placeholder="Enter middle name"
                required
                registration={register("middleName")}
                error={errors.middleName?.message}
              />
              <div className="col-span-2">
                <InputField
                  label="Last Name"
                  placeholder="Enter last name"
                  required
                  registration={register("lastName")}
                  error={errors.lastName?.message}
                />
              </div>
            </div>

            <InputField
              type="email"
              label="Email"
              placeholder="user@email.com"
              required
              registration={register("email")}
              error={errors.email?.message}
            />

            <InputField
              type="tel"
              label="Phone Number"
              placeholder="Enter phone number"
              required
              registration={register("phone")}
              error={errors.phone?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700 shrink-0">
            <div className="flex gap-3 sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
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
