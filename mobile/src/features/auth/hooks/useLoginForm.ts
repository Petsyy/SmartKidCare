import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";
import type { User } from "@/src/context/auth-context";
import { login as apiLogin } from "@/src/api/authentication.api";

export const useLoginForm = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"identifier" | "password" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setErrorMessage("Please enter both login credential and password.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await apiLogin({
        identifier: trimmedIdentifier,
        password,
      });

      if (response.requiresPasswordChange) {
        if (response.passwordSetupToken && response.requiresOtp === false) {
          router.push({
            pathname: "/(auth)/change-password",
            params: { setupToken: response.passwordSetupToken },
          });
          return;
        }

        router.push({
          pathname: "/(auth)/verify-otp",
          params: { email: response.email },
        });
        return;
      }

      const { token: authToken, user: apiUser } = response;

      if (__DEV__) {
        console.log("[Login JWT Token]", authToken);
      }

      const appUser: User = {
        id: apiUser._id,
        email: apiUser.email,
        role:
          apiUser.role === "parent" || apiUser.role === "teacher"
            ? apiUser.role
            : "teacher",
        needsToConfirmLink: apiUser.needsToConfirmLink,
      };

      await login(appUser, authToken);
    } catch (error: any) {
      setErrorMessage(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    focusedField,
    setFocusedField,
    errorMessage,
    setErrorMessage,
    handleLogin,
  };
};
