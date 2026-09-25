import { useState } from "react";
import { CheckCircle2, MailWarning, Send, UserRound, X } from "lucide-react";
import { createCaptain } from "@/api/admin.api";
import type { User } from "@/api/authentication.api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { addCaptainSchema } from "@/features/users/validations/create-captain.validation";

type FormState = {
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Props = {
  activeCaptain?: User;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export default function AddCaptainModal({
  activeCaptain,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>({
    username: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState | "form", string>>
  >({});
  const [confirmReplacement, setConfirmReplacement] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof createCaptain>
  > | null>(null);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = addCaptainSchema.safeParse(form);
    if (!parsed.success) {
      const next: typeof errors = {};
      parsed.error.issues.forEach((issue) => {
        next[issue.path[0] as keyof FormState] = issue.message;
      });
      setErrors(next);
      return;
    }
    if (activeCaptain && !confirmReplacement) {
      setErrors({
        form: "Confirm that this invitation will replace the current captain after activation.",
      });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const response = await createCaptain({
        ...parsed.data,
        replaceCaptainId: activeCaptain?._id,
      });
      setResult(response);
      await onCreated();
    } catch (reason) {
      setErrors({
        form:
          reason instanceof Error
            ? reason.message
            : "Unable to create invitation.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 outline-none"
      >
        <DialogTitle className="sr-only">
          {activeCaptain
            ? "Replace Barangay Captain"
            : "Invite Barangay Captain"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Invite a captain to Bonuan Sabangan.
        </DialogDescription>

        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <UserRound size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {activeCaptain
                    ? "Replace Barangay Captain"
                    : "Invite Barangay Captain"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  Create an account invitation for Bonuan Sabangan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close invitation dialog"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </header>

          {result ? (
            <div className="p-8 text-center">
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${result.invitation.delivery.sent ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {result.invitation.delivery.sent ? (
                  <CheckCircle2 />
                ) : (
                  <MailWarning />
                )}
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Invitation created
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {result.invitation.delivery.sent
                  ? `Activation instructions were sent to ${result.captain.email}.`
                  : result.invitation.delivery.message ||
                    "The email could not be delivered. Use Resend from the captain list."}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Expires {new Date(result.invitation.expiresAt).toLocaleString()}
              </p>
              <button
                onClick={onClose}
                className="mt-6 h-11 rounded-lg bg-teal-600 px-6 font-semibold text-white hover:bg-teal-700"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6 p-6">
              {errors.form ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                >
                  {errors.form}
                </p>
              ) : null}

              {activeCaptain ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <strong>Current captain:</strong> {activeCaptain.firstName}{" "}
                  {activeCaptain.lastName}. They remain active until this
                  invitation is completed.
                </div>
              ) : null}

              <section>
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Captain information
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    name="firstName"
                    label="First Name"
                    required
                    value={form.firstName}
                    error={errors.firstName}
                    onChange={(value) => setField("firstName", value)}
                    placeholder="Enter first name"
                    autoComplete="given-name"
                    maxLength={50}
                  />
                  <Field
                    name="middleName"
                    label="Middle Name"
                    value={form.middleName}
                    error={errors.middleName}
                    onChange={(value) => setField("middleName", value)}
                    placeholder="Optional"
                    autoComplete="additional-name"
                    maxLength={50}
                  />
                  <Field
                    name="lastName"
                    label="Last Name"
                    required
                    value={form.lastName}
                    error={errors.lastName}
                    onChange={(value) => setField("lastName", value)}
                    placeholder="Enter last name"
                    autoComplete="family-name"
                    maxLength={50}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    name="username"
                    label="Username"
                    required
                    value={form.username}
                    error={errors.username}
                    onChange={(value) =>
                      setField(
                        "username",
                        value.replace(/[^A-Za-z0-9]/g, "").toLowerCase(),
                      )
                    }
                    placeholder="juan2026"
                    autoComplete="username"
                    maxLength={30}
                    hint="4-30 letters or numbers. Spaces and special characters are not allowed."
                  />
                  <Field
                    name="email"
                    label="Email Address"
                    required
                    type="email"
                    value={form.email}
                    error={errors.email}
                    onChange={(value) =>
                      setField("email", value.replace(/\s/g, ""))
                    }
                    placeholder="captain@gmail.com"
                    autoComplete="email"
                    maxLength={254}
                    hint="We will send the captain's invitation here. Gmail, Yahoo, or Outlook works best."
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    name="phone"
                    label="Phone Number"
                    required
                    type="tel"
                    value={form.phone}
                    error={errors.phone}
                    onChange={(value) =>
                      setField("phone", value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="09XXXXXXXXX"
                    autoComplete="tel"
                    maxLength={11}
                    inputMode="numeric"
                    hint="Enter 11 digits beginning with 09."
                  />
                  <div>
                    <Label
                      htmlFor="captain-center"
                      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Assigned Center
                    </Label>
                    <Input
                      id="captain-center"
                      value="Bonuan Sabangan Child Development Center"
                      disabled
                      className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-sm text-slate-600 disabled:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Assigned automatically based on the active center.
                    </p>
                  </div>
                </div>
              </section>

              {activeCaptain ? (
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={confirmReplacement}
                    onChange={(event) =>
                      setConfirmReplacement(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    I confirm the current captain will be deactivated only after
                    the invited captain activates their account.
                  </span>
                </label>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                  {saving ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  hint?: string;
};

function Field({
  name,
  label,
  required,
  value,
  error,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  inputMode,
  hint,
}: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div>
      <Label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
