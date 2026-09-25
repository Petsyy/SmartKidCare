import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  activateCaptainInvitation,
  validateCaptainInvitation,
} from "@/api/admin.api";

export default function CaptainActivation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [invitation, setInvitation] = useState<{
    firstName: string;
    email: string;
    expiresAt: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("The invitation link is incomplete.");
      setLoading(false);
      return;
    }
    void validateCaptainInvitation(token)
      .then(setInvitation)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Invitation is invalid.",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await activateCaptainInvitation({ token, newPassword, confirmPassword });
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Activation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
          {complete ? <CheckCircle2 size={30} /> : <ShieldCheck size={30} />}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {complete ? "Account activated" : "Activate captain account"}
        </h1>

        {loading ? (
          <p className="mt-4 text-slate-600">Validating invitation…</p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {complete ? (
          <div className="mt-5">
            <p className="text-slate-600 dark:text-slate-300">
              Your password is ready. Sign in using your email or username and
              complete email verification.
            </p>
            <Link
              className="mt-6 block rounded-xl bg-teal-600 px-4 py-3 text-center font-semibold text-white hover:bg-teal-700"
              to="/login"
            >
              Continue to sign in
            </Link>
          </div>
        ) : invitation ? (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Welcome, {invitation.firstName}. Create the password for{" "}
              {invitation.email}.
            </p>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <p className="text-xs text-slate-500">
              Use at least 8 characters, start with a capital letter, and
              include a special character.
            </p>
            <button
              disabled={saving}
              className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? "Activating…" : "Activate account"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
