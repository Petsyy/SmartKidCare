import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter, useFocusEffect, usePathname } from "expo-router";
import { useAuthContext } from "@/src/context/auth-context";
import { useAuth } from "@/src/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useChangePassword } from "./useChangePassword";
import { useOffline } from "@/src/offline/offline-context";
import { clearOfflineDataForUser } from "@/src/offline/offline-database";

export type ProfileRole = "parent" | "teacher";

export type UserProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  role: string;
  phone?: string;
  employeeId?: string;
  isActive?: boolean;
  daycareCenter?:
    | {
        _id?: string;
        name?: string;
        barangay?: string;
        code?: string;
        isActive?: boolean;
      }
    | string
    | null;
  assignedCenter?: string;
};

type Params = {
  fetchProfile: () => Promise<UserProfile>;
};

export function useProfileScreen({ fetchProfile }: Params) {
  const router = useRouter();
  const pathname = usePathname();
  const { lockApp, logout, user } = useAuthContext();
  const { isAuthenticated } = useAuth();
  const { localWorkCount } = useOffline();

  const profileRole: ProfileRole = pathname.includes("(teacher)")
    ? "teacher"
    : "parent";

  const {
    data: profile = null,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: mobileQueryKeys.profile(profileRole),
    enabled: isAuthenticated,
    queryFn: () => fetchProfile(),
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const passwordManager = useChangePassword(() => setShowPasswordModal(false));

  useFocusEffect(
    useMemo(
      () => () => {
        void refetch();
      },
      [refetch],
    ),
  );

  const handleLogout = () => {
    const performLogout = async () => {
      if (user?.id) await clearOfflineDataForUser(user.id);
      await logout();
      router.push("/(auth)/login");
    };
    const message =
      localWorkCount > 0
        ? `You have ${localWorkCount} unsynchronized draft or submission${localWorkCount === 1 ? "" : "s"}. Logging out will permanently delete this local work.`
        : "Are you sure you want to logout?";
    Alert.alert("Confirm Logout", message, [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: localWorkCount > 0 ? "Delete Work & Logout" : "Logout",
        onPress: async () => {
          if (localWorkCount > 0) {
            Alert.alert(
              "Permanently Delete Local Work?",
              "This cannot be undone. Unsynchronized records will not reach the server.",
              [
                { text: "Keep My Work", style: "cancel" },
                {
                  text: "Delete & Logout",
                  style: "destructive",
                  onPress: () => void performLogout(),
                },
              ],
            );
            return;
          }
          await performLogout();
        },
        style: "destructive",
      },
    ]);
  };

  const handleLockApp = () => {
    Alert.alert(
      "Lock SmartKidCare?",
      "Your encrypted cached data, drafts, and queued submissions will stay on this device. Use your device security to unlock the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Lock App",
          onPress: () => void lockApp(),
        },
      ],
    );
  };

  return {
    profile,
    loading,
    showPasswordModal,
    setShowPasswordModal,
    showHelpModal,
    setShowHelpModal,
    handleLockApp,
    handleLogout,
    ...passwordManager,
  };
}
