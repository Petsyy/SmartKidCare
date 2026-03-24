import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { API_BASE } from "../config/config.api";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCheckError, setAuthCheckError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const verifySession = async (isInitial = false) => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (!isMounted) {
          return;
        }

        if (response.ok) {
          setIsAuthenticated(true);
          setAuthCheckError(null);
          return;
        }

        if (response.status === 401) {
          setIsAuthenticated(false);
          setAuthCheckError(null);
          return;
        }

        // Avoid hard-logging out users on transient API issues (e.g., 429/5xx).
        // Keep the current auth state and surface a retry affordance instead.
        setAuthCheckError("Unable to verify session right now.");
      } catch {
        if (isMounted) {
          setAuthCheckError("Network issue while verifying your session.");
        }
      } finally {
        if (isMounted && isInitial) {
          setIsChecking(false);
        }
      }
    };

    void verifySession(true);

    // Poll keeps long-open tabs in sync with server-side token expiry.
    pollTimer = setInterval(() => {
      void verifySession(false);
    }, 3000);

    return () => {
      isMounted = false;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, []);

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
            onClick={() => window.location.reload()}
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

  return <>{children}</>;
}
