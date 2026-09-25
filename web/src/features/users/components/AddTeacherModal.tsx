import { GraduationCap, Send, X } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useAddTeacherForm } from "../hooks/useAddTeacherForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function AddTeacherModal({ onClose, onCreated }: Props) {
  const { form, isSubmitting, onSubmit } =
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 outline-none"
      >
        <DialogTitle className="sr-only">Add Teacher</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new teacher account with auto-generated credentials.
        </DialogDescription>
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <GraduationCap size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Add Teacher
                </h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  Create a teacher account and send their login details.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close teacher dialog"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </header>

          <form onSubmit={onSubmit} className="space-y-6 p-6">
            <section>
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Teacher Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  name="firstName"
                  label="First Name"
                  placeholder="Enter first name"
                  maxLength={50}
                  autoComplete="given-name"
                  required
                  registration={register("firstName")}
                  error={errors.firstName?.message}
                />
                <Field
                  name="middleName"
                  label="Middle Name"
                  placeholder="Enter middle name"
                  maxLength={50}
                  autoComplete="additional-name"
                  required
                  registration={register("middleName")}
                  error={errors.middleName?.message}
                />
                <Field
                  name="lastName"
                  label="Last Name"
                  placeholder="Enter last name"
                  maxLength={50}
                  autoComplete="family-name"
                  required
                  registration={register("lastName")}
                  error={errors.lastName?.message}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="teacher@gmail.com"
                  maxLength={254}
                  autoComplete="email"
                  onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\s/g, ""); }}
                  hint="We will send the teacher's login details here. Gmail, Yahoo, or Outlook works best."
                  required
                  registration={register("email")}
                  error={errors.email?.message}
                />
                <Field
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  maxLength={11}
                  inputMode="numeric"
                  autoComplete="tel"
                  onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 11); }}
                  hint="Enter 11 digits beginning with 09."
                  required
                  registration={register("phone")}
                  error={errors.phone?.message}
                />
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {isSubmitting ? "Creating..." : "Create Teacher"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  hint?: string;
  onInput?: React.FormEventHandler<HTMLInputElement>;
};

function Field({
  name,
  label,
  required,
  registration,
  error,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  inputMode,
  hint,
  onInput,
}: FieldProps) {
  const errorId = `${name}-error`;

  return (
    <div>
      <Label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        onInput={onInput}
        {...registration}
      />
      {error ? <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
