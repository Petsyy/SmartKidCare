import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "./Input";
import { Label } from "./Label";
import { NativeSelect } from "./NativeSelect";

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
    <div data-slot="form-field">
      <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
        aria-invalid={Boolean(error)}
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
    <div data-slot="form-field">
      <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <NativeSelect
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
        aria-invalid={Boolean(error)}
        {...registration}
        {...props}
      >
        {children}
      </NativeSelect>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}