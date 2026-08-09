import { X } from "lucide-react";
import { useAddTeacherForm } from "../hooks/useAddTeacherForm";
import { InputField, SelectField } from "@/components/ui/FormFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function AddTeacherModal({ onClose, onCreated }: Props) {
  const { form, centers, loadingCenters, isSubmitting, onSubmit } =
    useAddTeacherForm({
      onClose,
      onCreated,
    });

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 outline-none"
      >
        <DialogTitle className="sr-only">Add Teacher</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new teacher account with auto-generated credentials.
        </DialogDescription>
        <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-lg dark:bg-slate-900">
          <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Add Teacher
              </h2>
              <p className="text-sm font-normal leading-5 text-slate-600 dark:text-slate-400">
                Create a new teacher account with auto-generated credentials
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition dark:text-slate-500 dark:hover:text-slate-300"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-6 dark:bg-slate-900">
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Teacher Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <InputField
                    label="First Name"
                    placeholder="Enter first name"
                    maxLength={50}
                    required
                    registration={register("firstName")}
                    error={errors.firstName?.message}
                  />
                  <InputField
                    label="Middle Name"
                    placeholder="Enter middle name"
                    maxLength={50}
                    required
                    registration={register("middleName")}
                    error={errors.middleName?.message}
                  />
                  <InputField
                    label="Last Name"
                    placeholder="Enter last name"
                    maxLength={50}
                    required
                    registration={register("lastName")}
                    error={errors.lastName?.message}
                  />
                </div>

                <InputField
                  label="Email (Login Credential)"
                  type="email"
                  placeholder="teacher@email.com"
                  maxLength={254}
                  required
                  registration={register("email")}
                  error={errors.email?.message}
                />

                <InputField
                  label="Phone Number"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  required
                  registration={register("phone")}
                  error={errors.phone?.message}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Assignment
              </h3>
              <div className="space-y-4">
                <SelectField
                  label="Daycare Center"
                  required
                  registration={register("daycareCenterId")}
                  error={errors.daycareCenterId?.message}
                >
                  <option value="">Select a center</option>
                  {loadingCenters ? (
                    <option disabled>Loading centers...</option>
                  ) : (
                    centers.map((center) => (
                      <option key={center._id} value={center._id}>
                        {center.name} ({center.barangay})
                      </option>
                    ))
                  )}
                </SelectField>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Teacher"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
