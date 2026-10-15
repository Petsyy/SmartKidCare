import { useState } from "react";
import { Alert } from "react-native";
import { getChildParentCredentials, resetChildParentPassword } from "@/src/api/teacher.api";
import { getUserFriendlyErrorMessage, reportHandledError } from "@/src/lib/error-reporting";

export interface CredentialsModalState {
  visible: boolean;
  email: string;
  tempPassword?: string | null;
}

export function useParentCredentials(childId: string | null, isOffline: boolean) {
  const [modal, setModal] = useState<CredentialsModalState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const requireConnection = (action: string) => {
    if (!isOffline) return true;
    Alert.alert("Connection required", `Connect to the internet to ${action}.`);
    return false;
  };

  const view = async () => {
    if (!childId || !requireConnection("view parent credentials")) return;
    try {
      setIsLoading(true);
      const credentials = await getChildParentCredentials(childId);
      setModal({ visible: true, ...credentials });
    } catch (error) {
      reportHandledError("parent-credentials.load", error);
      Alert.alert("Unable to Load Credentials", getUserFriendlyErrorMessage(error, "The parent credentials could not be retrieved. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    if (!childId || !requireConnection("reset parent password")) return;
    Alert.alert("Reset Parent Password", "Are you sure you want to reset this parent's password? Their current password will be invalidated immediately. This will affect their entire account.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset Password",
        style: "destructive",
        onPress: async () => {
          try {
            setIsResetting(true);
            const credentials = await resetChildParentPassword(childId);
            setModal({ visible: true, ...credentials });
          } catch (error) {
            reportHandledError("parent-credentials.password-reset", error);
            Alert.alert("Unable to Reset Password", getUserFriendlyErrorMessage(error, "The parent password could not be reset. Please try again."));
          } finally {
            setIsResetting(false);
          }
        },
      },
    ]);
  };

  return { modal, closeModal: () => setModal(null), view, reset, isLoading, isResetting };
}
