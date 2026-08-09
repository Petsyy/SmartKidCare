import { X, UserCog } from "lucide-react";
import { type User } from "@/api/authentication.api";
import { useEditUserForm } from "../hooks/useEditUserForm";
import { InputField } from "@/components/ui/FormFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <DialogTitle className="sr-only">Edit User</DialogTitle>
        <DialogDescription className="sr-only">
          Update user account information.
        </DialogDescription>
        <div
          className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-teal-50 to-emerald-50/50 px-6 py-5 backdrop-blur-md dark:border-slate-700/50 dark:from-teal-900/30 dark:to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <UserCog size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Edit User
                </h3>
                <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
                  {user.firstName} {user.middleName} {user.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-white/50 p-2 text-gray-500 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6">
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

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-teal-400"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
