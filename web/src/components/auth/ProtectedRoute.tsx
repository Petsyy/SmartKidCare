import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { API_BASE } from "../config/config.api";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (!isMounted) {
          return;
        }

        setIsAuthenticated(response.ok);
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
