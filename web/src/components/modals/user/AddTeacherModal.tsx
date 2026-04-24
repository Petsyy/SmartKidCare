import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { createTeacher } from "@/api/teacher.api";
import { getDaycareCenters, type DaycareCenter } from "@/api/daycare-center.api";
import { showTeacherCredentialsModal, showErrorModal } from "@/utils/sweetAlertModal";
import {
  type AddTeacherField,
  type AddTeacherFormValues,
  validateAddTeacherField,
  sanitizePhoneInput,
} from "@/utils/formValidation";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

const EMPTY_FORM: AddTeacherFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  daycareCenterId: "",
};

export default function AddTeacherModal({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<DaycareCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<AddTeacherFormValues>({
    defaultValues: EMPTY_FORM,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const validateField = useMemo(
    () => (field: AddTeacherField) => (value: string) =>
      validateAddTeacherField(
        field,
        {
          ...getValues(),
          [field]: value,
        } as AddTeacherFormValues,
      ) || true,
    [getValues],
  );

  useEffect(() => {
    // Keep the previous behavior where validation hints are shown immediately.
    void trigger();
  }, [trigger]);

  useEffect(() => {
    const loadCenters = async () => {
      setLoadingCenters(true);
      try {
        const result = await getDaycareCenters();
        setCenters(result.filter((center) => center.isActive !== false));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load centers";
        showErrorModal(message);
      } finally {
        setLoadingCenters(false);
      }
    };

    void loadCenters();
  }, []);

  const onSubmit = async (form: AddTeacherFormValues) => {
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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-900">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Add Teacher</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-slate-50">
              Teacher Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    maxLength={50}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    {...register("firstName", {
                      validate: validateField("firstName"),
                    })}
                  />
                  {errors.firstName?.message && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Middle Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter middle name"
                    maxLength={50}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    {...register("middleName", {
                      validate: validateField("middleName"),
                    })}
                  />
                  {errors.middleName?.message && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.middleName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    maxLength={50}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                    {...register("lastName", {
                      validate: validateField("lastName"),
                    })}
                  />
                  {errors.lastName?.message && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                  Email (Login Credential) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="teacher@email.com"
                  maxLength={254}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                  {...register("email", {
                    validate: validateField("email"),
                  })}
                />
                {errors.email?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="09123456789"
                  inputMode="numeric"
                  maxLength={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                  {...register("phone", {
                    validate: validateField("phone"),
                    onChange: (event) => {
                      const input = event.target as HTMLInputElement;
                      input.value = sanitizePhoneInput(input.value);
                    },
                  })}
                />
                {errors.phone?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                  Assigned Center <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                  disabled={loadingCenters}
                  {...register("daycareCenterId", {
                    validate: validateField("daycareCenterId"),
                  })}
                >
                  <option value="">
                    {loadingCenters ? "Loading centers..." : "Select a center"}
                  </option>
                  {centers.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.barangay} - {center.name}
                    </option>
                  ))}
                </select>
                {errors.daycareCenterId?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.daycareCenterId.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3 dark:bg-teal-900/20 dark:border-teal-700/30">
            <div className="text-teal-600 mt-0.5 dark:text-teal-400">
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
            <p className="text-sm text-teal-700 dark:text-teal-300">
              A temporary password is generated automatically by the system. The teacher will be required to change their password on first login.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
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
      </div>
    </div>
  );
}
