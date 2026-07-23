import type { UseFormRegisterReturn } from "react-hook-form";

export function InputField({
  label,
  error,
  registration,
  required,
  ...props
}: {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
        {...registration}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  error,
  registration,
  required,
  children,
  ...props
}: {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  required?: boolean;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
        {...registration}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
