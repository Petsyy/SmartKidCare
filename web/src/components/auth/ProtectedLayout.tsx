import { Navigate, Outlet } from "react-router-dom";
import { useAuthSession } from "./useAuthSession";

export default function ProtectedLayout() {
  const {
    isChecking,
    isAuthenticated,
    authCheckError,
    retryAuthCheck,
  } = useAuthSession();

  if (isChecking) {
    return null;
  }

  if (authCheckError && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Session Check Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">{authCheckError}</p>
          <button
            onClick={() => void retryAuthCheck()}
            className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
