export interface LoginSubmitButtonProps {
  isLoading: boolean;
  isPasswordSetup: boolean;
}

export function LoginSubmitButton({
  isLoading,
  isPasswordSetup,
}: LoginSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-cyan-500 py-3 font-semibold text-white shadow-md transition hover:from-teal-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:from-teal-400 disabled:to-cyan-400"
    >
      {isLoading ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {isPasswordSetup ? "Setting password..." : "Signing in..."}
        </>
      ) : isPasswordSetup ? (
        "Set Password & Continue"
      ) : (
        "Sign In"
      )}
    </button>
  );
}
